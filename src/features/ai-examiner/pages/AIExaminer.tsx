import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  LiveAPIProvider,
  useLiveAPIContext,
} from "../../../shared/contexts/LiveAPIContext";
import { CountdownTimer } from "../components/CountdownTimer";
import ControlTrayCustom from "../components/control-tray/ControlTray";
import cn from "classnames";
import Layout from "../../../layout/Layout";
import { supabase } from "../../../config/supabaseClient";
import { useAuth } from "../../auth/contexts/AuthContext";
import { examRepository } from "../../exams/repositories/ExamRepository";
import { examLogRepository } from "../../exams/repositories/ExamLogRepository";
import { examFinishService } from "../services/examFinishService";
import { getExaminerQuestions } from "../utils/getExaminerQuestions";
import getPrompt from "../utils/prompt";
// Timers are managed locally for clarity
import { LoadingAnimation } from "../components/LoadingAnimation";
import { setupExamTimers } from "../lib/examTimers";
import { examLogger } from "../lib/examLogger";
import ExamDeliberationScreen from "../components/ExamDeliberationScreen/ExamDeliberationScreen";
import StudentTaskGhost from "../components/StudentTaskGhost";
import StudentTaskMarkdown from "../components/StudentTaskMarkdown";
import ProjectDefenseResourceInput from "../components/ProjectDefenseResourceInput";
import { getProjectDefenseQuestions } from "../utils/getProjectDefenseQuestions";
import {
  LiveConnectConfig,
  MediaResolution,
  Modality,
  ThinkingLevel,
} from "@google/genai";
import { GENAI_CONFIG } from "../../../config/genaiConfig";
import ExamRatingModal from "../components/ExamRatingModal"; // Added import
import { saveExamRating } from "../utils/examRatings"; // Added import
import { apiUrl } from "../../../config/apiConfig";
import { useJavaScriptErrorChecker } from "../hooks/useJavaScriptErrorChecker";
import UnsupportedBrowserModal from "../components/UnsupportedBrowserModal";
import { getGradeInstructionText } from "../utils/gradeCriteria";

const UNEXPECTED_ERROR_MESSAGE =
  "Der opstod en uventet fejl, og forbindelsen til eksaminator blev afbrudt.";

const DEFENSE_LOADING_MESSAGE = "Forbereder din eksamen";

function getDefenseStartDisabledReason(
  canStartExam: boolean,
  isDefenseExam: boolean,
): string | undefined {
  if (canStartExam || !isDefenseExam) {
    return undefined;
  }

  return "Upload mindst én PDF-fil eller indsæt et GitHub-link";
}

function getDefenseProcessingErrorMessage(error: unknown): string {
  const errorMessage = String(
    (error as { message?: string })?.message || "",
  ).toLowerCase();

  if (errorMessage.includes("timeout") || errorMessage.includes("504")) {
    return "Det tog for lang tid at behandle dine dokumenter. Prøv med færre eller mindre filer.";
  }

  if (errorMessage.includes("parse") || errorMessage.includes("read")) {
    return "Vi kunne ikke læse en af dine filer. Prøv at eksportere den som PDF.";
  }

  return "Der opstod en fejl. Prøv igen.";
}

/*
"realtime_input_config": {
  "automatic_activity_detection": {
      "disabled": False, # default
      "start_of_speech_sensitivity": types.StartSensitivity.START_SENSITIVITY_LOW,
      "end_of_speech_sensitivity": types.EndSensitivity.END_SENSITIVITY_LOW,
      "prefix_padding_ms": 20,
      "silence_duration_ms": 100,
  }
}
*/
// Helper function to create config object
const getConfig = (prompt: string): LiveConnectConfig =>
  ({
    responseModalities: [Modality.AUDIO],
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
    contextWindowCompression: { slidingWindow: {} },
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
      includeThoughts: true,
    },
    sessionResumption: {},
    outputAudioTranscription: {},
    // Also request input transcription so we can format a full dialogue
    inputAudioTranscription: {} as any,
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
    },
    systemInstruction: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    tools: [
      {
        functionDeclarations: [
          //submitGradeFunctionDeclaration,
          //checkJavaScriptErrorsFunctionDeclaration,
        ],
      },
    ],
  }) as LiveConnectConfig;

interface ExamWorkflowProps {
  examId: string;
}

function ExamWorkflow({ examId }: ExamWorkflowProps) {
  const haveNotSeenScreenRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const navigate = useNavigate();

  const [isLoadingExamData, setIsLoadingExamData] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [examError, setExamError] = useState<string | null>(null);

  const [examSimulator, setExamSimulator] = useState<any>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [studentTask, setStudentTask] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [useDocumentResource, setUseDocumentResource] = useState(false);
  const [useGithubResource, setUseGithubResource] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false); // Added state for modal
  const [showRatingConfirmation, setShowRatingConfirmation] = useState(false);
  const [examLogId, setExamLogId] = useState<number | null>(null);
  const examLogIdRef = useRef<number | null>(null);
  const [isFinishingExam, setIsFinishingExam] = useState(false);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [aiGrade, setAiGrade] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [gradeReady, setGradeReady] = useState(false);
  const errorTimerRef = useRef<number | null>(null);
  const unexpectedErrorHandledRef = useRef(false);
  const finishedReasonRef = useRef<"time_passed" | "user_finished">(
    "time_passed",
  );
  const closingStageRef = useRef<
    "idle" | "awaiting_farewell" | "awaiting_grade"
  >("idle");
  const closingTimersRef = useRef<number[]>([]);
  const isModelSpeakingRef = useRef<boolean>(false);
  const audioChunkCountRef = useRef(0);
  const completedAudioChunkCountRef = useRef(0);
  const examTimersClearRef = useRef<null | (() => void)>(null);
  const pendingGradeRef = useRef<{
    grade: string | null;
    feedback: string | null;
  } | null>(null);

  const handleUnexpectedError = useCallback(() => {
    if (unexpectedErrorHandledRef.current) {
      return;
    }
    unexpectedErrorHandledRef.current = true;
    examLogger.log(
      "unexpected_error",
      "Connection dropped unexpectedly, navigating to dashboard",
    );
    window.alert(UNEXPECTED_ERROR_MESSAGE);
    navigate("/dashboard");
  }, [navigate]);

  // Keep ref in sync so toolcall handler always has the latest value
  useEffect(() => {
    examLogIdRef.current = examLogId;
  }, [examLogId]);

  const { client, setConfig, connect, config, connected, muteOutput } =
    useLiveAPIContext();
  const { user } = useAuth(); // Get the current user from Auth context

  const isDefenseExam =
    examSimulator?.type === "defense" || examSimulator?.type === "Github Repo";
  const hasRepoUrl = repoUrl.trim().length > 0;
  const hasAnyProvidedResource = uploadedFiles.length > 0 || hasRepoUrl;
  const canStartExam = !isDefenseExam || hasAnyProvidedResource;
  const startDisabledReason = getDefenseStartDisabledReason(
    canStartExam,
    isDefenseExam,
  );

  const currentExamTotalDurationInMinutes = examSimulator?.duration;

  const isLocalhost = window.location.hostname === "localhost";
  const examDurationInMs = currentExamTotalDurationInMinutes * 60 * 1000;
  /*const examDurationInMs = isLocalhost
    ? 1 * 60 * 1000
    : currentExamTotalDurationInMinutes * 60 * 1000; 
    */

  useEffect(() => {
    // Fallback: if connection drops unexpectedly during an active exam,
    // show an alert after a short grace period and ensure disconnect.
    const shouldWatch =
      examStarted &&
      !connected &&
      !isDeliberating &&
      closingStageRef.current === "idle" &&
      !isStartingExam &&
      !isFinishingExam;

    if (shouldWatch) {
      examLogger.log("connection_dropped", {
        examStarted,
        connected,
        isDeliberating,
        closingStage: closingStageRef.current,
      });
      if (errorTimerRef.current) {
        window.clearTimeout(errorTimerRef.current);
      }
      errorTimerRef.current = window.setTimeout(() => {
        try {
          client.disconnect();
        } catch {}
        handleUnexpectedError();
      }, 4000);
    } else {
      if (errorTimerRef.current) {
        window.clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
      unexpectedErrorHandledRef.current = false;
    }
  }, [
    examStarted,
    connected,
    isDeliberating,
    isStartingExam,
    isFinishingExam,
    client,
    handleUnexpectedError,
  ]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        window.clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchDataAndPrepareExam = async () => {
      // examId is guaranteed by the parent component's check
      setIsLoadingExamData(true);
      setExamError(null);

      const fetchedExamSimulator: any = await examRepository.fetchById(
        Number(examId),
      );
      if (!fetchedExamSimulator) throw new Error("Exam not found");

      setExamSimulator(fetchedExamSimulator);
      //console.log(fetchedExamSimulator);

      // this should load per default
      if (fetchedExamSimulator.type === "generated-task") {
        const examContent = await getExaminerQuestions(fetchedExamSimulator);

        setStudentTask(examContent || "");

        const newPromptContent = getPrompt.standard(
          fetchedExamSimulator,
          fetchedExamSimulator?.duration - 1,
          examContent,
        );

        // console.log(newPromptContent);

        // setConfig is called here, ensuring it's available from context
        // This will trigger a hook recall where the .connect is then called
        setConfig(getConfig(newPromptContent));
      }

      setIsLoadingExamData(false);
    };
    // The check `if (client && setConfig)` was removed as these are expected to be available
    // if useLiveAPIContext is used correctly within its provider.
    // The effect will re-run if setConfig changes, which is appropriate.
    fetchDataAndPrepareExam();
  }, [examId, setConfig]); // client removed from deps as it's stable, setConfig is the key dependency from context here

  useEffect(() => {
    examLogger.log("connected_changed", { connected });
    if (connected) {
      setIsStartingExam(false);
    } else {
      clearExamTimers();
    }
  }, [connected]);

  const handleRatingSubmit = async (
    rating: number,
    goodFeedback: string,
    improveFeedback: string,
  ) => {
    if (user && examId) {
      try {
        await saveExamRating({
          exam_id: examId, // Pass examId
          user_id: user.id,
          rating: rating + 1,
          good_feedback: goodFeedback,
          improve_feedback: improveFeedback,
        });
        setShowRatingConfirmation(true);
        setTimeout(() => {
          setShowRatingConfirmation(false);
          setIsRatingModalOpen(false); // Or navigate to a thank you page
          window.location.reload();
        }, 2000); // Show confirmation for 2 seconds
      } catch (error) {
        console.error("Failed to submit rating:", error);
        setIsRatingModalOpen(false);
        // Optionally, show an error message to the user
      }
    } else {
      setIsRatingModalOpen(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    if (videoStream && client && haveNotSeenScreenRef.current) {
      //console.log("videoStream detected for screen sharing ack");
      client.send([
        {
          text: `SKÆRMDELING AKTIVERET: Brugeren har delt deres skærm. Anerkend det ved at sige: "Jeg kan se din skærm nu"`,
        },
      ]);
      haveNotSeenScreenRef.current = false;
    }
  }, [videoStream, client]);

  // Get the error checking function from the hook
  const { captureAndCheckForErrors } = useJavaScriptErrorChecker({
    videoRef,
    examStarted,
    videoStream,
  });

  const clearExamTimers = () => {
    if (examTimersClearRef.current) {
      try {
        examTimersClearRef.current();
      } finally {
        examTimersClearRef.current = null;
      }
    }
  };

  const finalizeExam = async (
    grade: string | null,
    feedback: string | null,
  ) => {
    examLogger.log("finalize_exam_start", {
      grade,
      feedback: feedback?.slice(0, 80),
    });
    const currentExamLogId = examLogIdRef.current;
    if (!currentExamLogId) {
      examLogger.log("finalize_exam_abort", "No examLogId");
      return;
    }

    clearExamTimers();
    closingStageRef.current = "idle";
    pendingGradeRef.current = null;

    await examLogRepository.updateById(currentExamLogId, {
      finished_at: new Date().toISOString(),
      finished_reason: finishedReasonRef.current,
      grade,
      feedback,
    });

    examLogger.log("finalize_exam_done", {
      examLogId: currentExamLogId,
      reason: finishedReasonRef.current,
    });
    setGradeReady(true);
  };

  const clearClosingTimer = (timerId: number) => {
    window.clearTimeout(timerId);
    closingTimersRef.current = closingTimersRef.current.filter(
      (id) => id !== timerId,
    );
  };

  const setClosingTimer = (callback: () => void, ms: number) => {
    const timerId = window.setTimeout(() => {
      closingTimersRef.current = closingTimersRef.current.filter(
        (id) => id !== timerId,
      );
      callback();
    }, ms);
    closingTimersRef.current.push(timerId);
    return timerId;
  };

  const clearClosingTimers = () => {
    closingTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    closingTimersRef.current = [];
  };

  type SpokenResponseReason =
    | "audiooutputcomplete"
    | "timeout"
    | "close";

  const waitForSpokenResponse = (
    label: string,
    timeoutMs: number,
    requireServerCompletion: boolean,
    onAudioStarted?: () => void,
  ) =>
    new Promise<SpokenResponseReason>((resolve) => {
      let completed = false;
      let timeoutId: number | null = null;
      let audioSettledTimerId: number | null = null;
      let turnCompleteAfterAudio = false;
      let audioStarted = false;
      let audioOutputComplete = false;
      let ignoredTurnCompletes = 0;

      const finish = (reason: SpokenResponseReason) => {
        if (completed) {
          return;
        }

        completed = true;
        client.off("audio", onAudio);
        client.off("turncomplete", onTurnComplete);
        client.off("close", onClose);
        client.off("audiooutputcomplete", onAudioOutputComplete);
        if (timeoutId !== null) {
          clearClosingTimer(timeoutId);
        }
        if (audioSettledTimerId !== null) {
          clearClosingTimer(audioSettledTimerId);
        }

        if (reason !== "audiooutputcomplete") {
          examLogger.log(label, { reason, timeoutMs });
        }
        resolve(reason);
      };

      const maybeFinishAfterPlayback = () => {
        if (
          audioStarted &&
          audioOutputComplete &&
          (!requireServerCompletion || turnCompleteAfterAudio)
        ) {
          finish("audiooutputcomplete");
        }
      };
      const onAudio = () => {
        if (!audioStarted) {
          onAudioStarted?.();
        }
        if (audioSettledTimerId !== null) {
          clearClosingTimer(audioSettledTimerId);
          audioSettledTimerId = null;
        }
        audioStarted = true;
        audioOutputComplete = false;
        examLogger.log(`${label}_audio_started`);
      };
      const onTurnComplete = () => {
        if (!audioStarted) {
          ignoredTurnCompletes += 1;
          examLogger.log(`${label}_ignored_turncomplete_before_audio`, {
            ignoredTurnCompletes,
          });
          return;
        }

        turnCompleteAfterAudio = true;
        maybeFinishAfterPlayback();
      };
      const onAudioOutputComplete = () => {
        if (!audioStarted) {
          return;
        }

        if (audioSettledTimerId !== null) {
          clearClosingTimer(audioSettledTimerId);
        }
        audioSettledTimerId = setClosingTimer(() => {
          audioSettledTimerId = null;
          audioOutputComplete = true;
          maybeFinishAfterPlayback();
        }, 150);
      };
      const onClose = () => finish("close");

      timeoutId = setClosingTimer(() => finish("timeout"), timeoutMs);
      client.on("audio", onAudio);
      client.on("turncomplete", onTurnComplete);
      client.on("close", onClose);
      client.on("audiooutputcomplete", onAudioOutputComplete);
    });

  const sendAndWaitForSpokenResponse = (
    label: string,
    instruction: { text: string },
    timeoutMs: number,
    retryAfterMs: number,
    requireServerCompletion = true,
  ) => {
    let retryTimer: number | null = null;
    const responsePromise = waitForSpokenResponse(
      label,
      timeoutMs,
      requireServerCompletion,
      () => {
        if (retryTimer !== null) {
          clearClosingTimer(retryTimer);
          retryTimer = null;
        }
      },
    );
    retryTimer = setClosingTimer(() => {
      retryTimer = null;
      examLogger.log(`${label}_retry`);
      client.send([instruction]);
    }, retryAfterMs);

    examLogger.log(`${label}_send`);
    client.send([instruction]);

    return responsePromise.finally(() => {
      if (retryTimer !== null) {
        clearClosingTimer(retryTimer);
      }
    });
  };

  // Delay helper that returns a proper awaitable promise
  const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  // Start closing flow is called when the time is up OR the "Afslut Eksamen" button is clicked
  const startClosingFlow = async (reason: "time_passed" | "user_finished") => {
    examLogger.log("closing_flow_start", {
      reason,
      currentStage: closingStageRef.current,
    });

    if (closingStageRef.current !== "idle") {
      examLogger.log("closing_flow_skipped", {
        reason: "already in closing",
        stage: closingStageRef.current,
      });
      return;
    }

    closingStageRef.current = "awaiting_farewell";

    // Show immediate UI feedback while we finish (e.g., while model wraps up speaking)
    setIsFinishingExam(true);

    examLogger.log("closing_mute_and_stop_timers");
    clearExamTimers();
    setMuted(true);
    client.sendAudioStreamEnd();

    // The farewell instruction is the first close response the student must hear.
    // If the model was mid-answer, this interrupts that answer and starts closing.

    const farewellInstruction = {
      text: 'SYSTEM_BESKED: Ignorer alt der tidligere blev snakket om! Eksamen er nu færdig. Sig det her til den studerende: "Eksamen er færdig. Du vil blive flyttet uden for døren mens jeg voterer".',
    };

    examLogger.log("closing_send_farewell_instruction");
    const farewellCompletionReason = await sendAndWaitForSpokenResponse(
      "closing_farewell",
      farewellInstruction,
      20000,
      3000,
    );
    examLogger.log("closing_farewell_wait_done", {
      reason: farewellCompletionReason,
    });
    // Wait for a small amount after AI has said you are placed in another room
    await delay(200);

    finishedReasonRef.current = reason;
    pendingGradeRef.current = null;

    // We're transitioning to deliberation UI; clear the finishing state on the button
    setIsFinishingExam(false);
    setIsDeliberating(true);
    examLogger.log("deliberation_started");

    // Mute AI audio output so the student doesn't hear the grading

    if (!isLocalhost) {
      muteOutput();
    }
    examLogger.log("closing_output_muted");


    const gradeInstruction = {
      text: `
        ${getGradeInstructionText(
          examSimulator?.grade_criteria,
          examSimulator?.feedback,
        )}`,
    };

    examLogger.log("closing_send_grade_instruction");
    examLogger.log("closing_awaiting_grade_turncomplete");
    const gradeCompletionReason = await sendAndWaitForSpokenResponse(
      "closing_grade",
      gradeInstruction,
      60000,
      5000,
    );
    examLogger.log("closing_grade_wait_done", {
      reason: gradeCompletionReason,
    });
    await delay(500);

    const fullOutput = client.outputMessage ?? "";
    const finalOutputMessage = fullOutput.split(/\s+/).slice(-500).join(" ");
    examLogger.log("closing_disconnect", {
      fullOutputWords: fullOutput.split(/\s+/).length,
      truncatedWords: finalOutputMessage.split(/\s+/).length,
    });
    client.disconnect(); // no reason to keep the AI session open while awaiting grading

    // Fetch grade and feedback from backend API and finalize
    try {
      closingStageRef.current = "awaiting_grade";
      examLogger.log("grade_fetch_start");


      const { grade, feedback } = await examFinishService.fetchGradeAndFeedback(
        finalOutputMessage,
        examSimulator,
      );

      examLogger.log("grade_fetch_done", {
        grade,
        feedbackLength: feedback?.length,
      });
      await finalizeExam(grade, feedback);
    } catch (e) {
      examLogger.log("grade_fetch_error", String(e));
      console.error("Failed to fetch grade/feedback:", e);
      await finalizeExam(null, null);
    }

    /*
    // Move to the grade phase; if grade already arrived, finalize, else request it
    closingStageRef.current = "awaiting_grade";
    if (pendingGradeRef.current) {
      setIsFinishingExam(true);
      const { grade, feedback } = pendingGradeRef.current;
      await finalizeExam(grade, feedback);
    } else {
      requestGradeToolCall();
    } */
  };

  // Set up event listener for function calls from the model
  useEffect(() => {
    if (!client || !examStarted) return;

    const onAudio = () => {
      audioChunkCountRef.current += 1;
      isModelSpeakingRef.current = true;
      examLogger.log("model_audio_start");
    };
    const onTurnComplete = () => {
      examLogger.log("model_turncomplete");
    };
    const onAudioOutputComplete = () => {
      completedAudioChunkCountRef.current = audioChunkCountRef.current;
      isModelSpeakingRef.current = false;
      examLogger.log("model_audio_output_complete", {
        audioChunks: audioChunkCountRef.current,
      });
    };
    client.on("audio", onAudio);
    client.on("turncomplete", onTurnComplete);
    client.on("audiooutputcomplete", onAudioOutputComplete);

    return () => {
      client.off("audio", onAudio);
      client.off("turncomplete", onTurnComplete);
      client.off("audiooutputcomplete", onAudioOutputComplete);
    };
  }, [client, examStarted, captureAndCheckForErrors]);

  useEffect(() => {
    return () => {
      clearExamTimers();
      clearClosingTimers();
    };
  }, []);

  const onStartExamClicked = async () => {
    if (isStartingExam) {
      return;
    }

    setIsStartingExam(true);
    examLogger.reset();
    examLogger.log("exam_start_clicked", {
      isDefenseExam,
      examId,
      durationMs: examDurationInMs,
    });

    async function prepareDefenseExamConfig(): Promise<any /* LiveConnectConfig */> {
      setIsLoadingDocuments(true);
      setLoadingMessage(DEFENSE_LOADING_MESSAGE);

      try {
        const questions = await getProjectDefenseQuestions(
          uploadedFiles,
          repoUrl.trim() || null,
          examSimulator,
        );


        const prompt = getPrompt.defense(
          examSimulator,
          examSimulator.duration - 1,
          questions,
        );

        // Prepare the session config (does NOT connect by itself)
        // Connection is only initiated by calling connect/connectWithConfig later
        const localCfg = getConfig(prompt);
        setConfig(localCfg);
        return localCfg;
      } catch (error) {
        alert(getDefenseProcessingErrorMessage(error));
        return null;
      } finally {
        setIsLoadingDocuments(false);
        setLoadingMessage("");
      }
    }

    try {
      // Check if user can connect today BEFORE preparing any heavy resources or connecting
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${apiUrl}/can-connect`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const canConnect = await response.json();

      if (!canConnect) {
        examLogger.log("exam_start_blocked", "no sessions remaining");
        alert(
          "Ikke flere sessioner for idag desværre. Prøv igen imorgen. Skriv til benjamin.dals.hughes@gmaila.com for mere adgang",
        );
        navigate("/dashboard");
        setIsStartingExam(false);
        return;
      }

      // Only now, after we know the user can connect today, prepare defense config if needed
      if (isDefenseExam) {
        const localDefenseConfig = await prepareDefenseExamConfig();
        if (!localDefenseConfig) {
          setIsStartingExam(false);
          return;
        }
        // Create exam log
        if (user) {
          const createdExamLogId = await examLogRepository.create({
            user_id: user.id,
            exam_id: Number(examId),
            grade: null,
            feedback: null,
          });
          setExamLogId(createdExamLogId);
        }

        // Connect and start exam with the freshly prepared config to avoid race with React state
        await client.connect(
          client.model ?? GENAI_CONFIG.DEFAULT_MODEL,
          localDefenseConfig,
        );
        examLogger.log("defense_connected");
        setExamStarted(true);

        // Kick off the session with an intro exactly once (either on setupcomplete or 3s fallback)
        {
          let fired = false;
          let fallbackId: number | undefined;
          const sendIntro = () => {
            if (fired) return;
            fired = true;
            if (fallbackId !== undefined) {
              window.clearTimeout(fallbackId);
              fallbackId = undefined;
            }
            client.off("setupcomplete", sendIntro);
            client.send([
              {
                text: "Start eksamene med en kort introduktion.",
              },
            ]);
          };
          client.on("setupcomplete", sendIntro);
          fallbackId = window.setTimeout(sendIntro, 3000);
        }

        // Setup standardized exam timers
        examTimersClearRef.current?.();
        examTimersClearRef.current = setupExamTimers({
          examDurationInMs,
          onPreEndMute: () => {
            examLogger.log("timer_pre_end_mute");
            setMuted(true);
            client.sendAudioStreamEnd();
          },
          onExamEnd: () => {
            examLogger.log("timer_exam_end");
            void startClosingFlow("time_passed");
          },
        });
        examLogger.log("defense_timers_set", { examDurationInMs });

        // Early return because defense path is fully handled above
        return;
      }

      // Standard exam path: config should have been prepared on load
      if (!config || !config.hasOwnProperty("systemInstruction") || !client) {
        console.error("Config or client not ready");
        setIsStartingExam(false);
        return;
      }

      // Create exam log
      if (user) {
        const createdExamLogId = await examLogRepository.create({
          user_id: user.id,
          exam_id: Number(examId),
          grade: null,
          feedback: null,
        });
        setExamLogId(createdExamLogId);
      }

      // Connect and start exam
      connect();
      examLogger.log("standard_connect_called");
      setExamStarted(true);

      // Kick off the session with an intro exactly once (either on setupcomplete or 3s fallback)
      {
        let fired = false;
        let fallbackId: number | undefined;
        const sendIntro = () => {
          if (fired) return;
          fired = true;
          if (fallbackId !== undefined) {
            window.clearTimeout(fallbackId);
            fallbackId = undefined;
          }
          client.off("setupcomplete", sendIntro);
          client.send([
            {
              text: "Start eksamenen med en kort introduktion",
            },
          ]);
        };
        client.on("setupcomplete", sendIntro);
        fallbackId = window.setTimeout(sendIntro, 3000);
      }

      // Setup standardized exam timers
      examTimersClearRef.current?.();
      examTimersClearRef.current = setupExamTimers({
        examDurationInMs,
        onPreEndMute: () => {
          examLogger.log("timer_pre_end_mute");
          setMuted(true);
          client.sendAudioStreamEnd();
        },
        onExamEnd: () => {
          examLogger.log("timer_exam_end");
          void startClosingFlow("time_passed");
        },
      });
      examLogger.log("standard_timers_set", { examDurationInMs });
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("Error: " + error);
      navigate("/dashboard");
      setIsStartingExam(false);
    }
  };

  /**
   * Handles finishing the exam
   * Uses the examFinishService to get grade/feedback and update the exam log
   */
  const onFinishExamClicked = async () => {
    if (!examLogId) {
      console.error("No exam log ID found");
      return;
    }

    void startClosingFlow("user_finished");
  };

  // Cleanup effect to log exam finish if user navigates away during active exam
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (examStarted && examLogId) {
        // Try to log exam finish when page is being unloaded
        // Use repository directly since we can't do complex grading during page unload
        await examLogRepository.updateById(examLogId, {
          finished_at: new Date().toISOString(),
          finished_reason: "redirect",
        });
      }
    };

    // Add event listener for page unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup function to run when component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // If exam is still active when component unmounts, log finish
      if (examStarted && examLogId) {
        examLogRepository.updateById(examLogId, {
          finished_at: new Date().toISOString(),
          finished_reason: "redirect",
        });
      }
    };
  }, [examStarted, examLogId]);

  if (isLoadingExamData) {
    return (
      // Layout removed from here as it's handled by AIexaminerPage
      <StudentTaskGhost />
    );
  }

  if (examError) {
    return <div>Error loading exam: {examError}</div>;
  }

  if (!examSimulator && !isLoadingExamData && !examError) {
    return (
      <div>
        Exam data could not be loaded. Please check the exam ID or try again
        later.
      </div>
    );
  }

  if (isDeliberating) {
    return (
      <ExamDeliberationScreen
        gradeReady={gradeReady}
        onViewResult={() =>
          navigate(
            `/exam-finished?user=${user.id}&exam-log-id=${examLogIdRef.current}`,
          )
        }
      />
    );
  }

  return (
    <div className="streaming-console max-w-2xl mx-auto flex flex-col">
      <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
        <h1 className="mb-8 font-bold text-2xl text-black text-center">
          Velkommen til din {examSimulator ? examSimulator.title : "exam"}
        </h1>

        {!isRatingModalOpen && (
          <CountdownTimer
            totalMs={examDurationInMs}
            autoStart={false}
            startTrigger={examStarted}
          />
        )}

        {isDefenseExam ? (
          <>
            <ProjectDefenseResourceInput
              useDocumentResource={useDocumentResource}
              onUseDocumentResourceChange={setUseDocumentResource}
              useGithubResource={useGithubResource}
              onUseGithubResourceChange={setUseGithubResource}
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
              repoUrl={repoUrl}
              onRepoUrlChange={setRepoUrl}
              fileErrors={fileErrors}
              onFileErrorsChange={setFileErrors}
              disabled={isLoadingDocuments || isStartingExam}
            />
            {isLoadingDocuments && loadingMessage ? (
              <p className="mt-3 text-sm text-blue-700">{loadingMessage}</p>
            ) : null}
          </>
        ) : (
          <div>
            {isLoadingExamData && !studentTask ? (
              <LoadingAnimation isLoading={true} />
            ) : studentTask ? (
              <>
                <StudentTaskMarkdown content={studentTask} />
              </>
            ) : (
              <StudentTaskGhost />
            )}
          </div>
        )}
        <video
          className={cn({
            hidden: !videoRef.current || !videoStream,
          })}
          style={{
            width: "20%",
            position: "fixed",
            bottom: "25px",
            right: "25px",
            opacity: 0,
          }}
          ref={videoRef}
          autoPlay
          playsInline
        />
      </div>

      {!isRatingModalOpen && (
        <ControlTrayCustom
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          onStartExam={onStartExamClicked}
          onFinishExam={onFinishExamClicked}
          disabled={isLoadingExamData || isLoadingDocuments || !canStartExam}
          startDisabledReason={startDisabledReason}
          isFinishing={isFinishingExam}
          isStarting={isStartingExam}
          muted={muted}
          onMutedChange={setMuted}
        />
      )}

      {!isRatingModalOpen && isDefenseExam && !connected && !canStartExam && (
        <p className="text-sm text-gray-600 text-center mt-3 mb-4">
          {startDisabledReason}
        </p>
      )}

      <ExamRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
        }}
        onSubmit={handleRatingSubmit}
        showConfirmation={showRatingConfirmation}
      />
    </div>
  );
}

/*
This components only job is to fetch key and render a LiveAPIProvider component with the exam inside of it
*/
export default function AIexaminerPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // id can be null
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(false);
  const liveOptions = useMemo(() => ({ apiKey: "notoken" }), []);

  useEffect(() => {
    // Check if the browser is Chrome
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome =
      userAgent.indexOf("chrome") > -1 && userAgent.indexOf("edg") === -1;
    setIsUnsupportedBrowser(!isChrome);
  }, []);

  // Ensure id is a string before passing to ExamWorkflow
  if (!id) {
    return (
      <Layout>
        <div>
          Exam ID is missing. Please provide an ID in the URL (e.g.,
          ?id=your_exam_id).
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LiveAPIProvider options={liveOptions}>
        <ExamWorkflow examId={id} />
      </LiveAPIProvider>
      <UnsupportedBrowserModal isOpen={isUnsupportedBrowser} />
    </Layout>
  );
}
