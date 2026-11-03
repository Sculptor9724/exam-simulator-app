import { useEffect } from "react";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";
import { PRE_END_MUTE_MS } from "../lib/examTimers";

interface ExamTimersProps {
  client: any;
  examDurationInMs: number;
  examSimulator: ExamSimulator;
  onExamFinish?: () => Promise<void>;
  onPreEndMute?: () => void;
}

const timeForFeedbackMs = 60 * 1000;

export default function examTimers({
  client,
  examDurationInMs,
  examSimulator,
  onExamFinish,
  onPreEndMute,
}: ExamTimersProps) {
  if (!client) return;

  const introTimer = setTimeout(() => {
    client.send([{ text: "Introducer eksamen tak :)" }]);
  }, 1000);

  //console.log("Duration in minutes: " + examDurationInMinutes);

  const minuteTimers: NodeJS.Timeout[] = [];
  let minutesPassed = 0;

  const minuteUpdateInterval = setInterval(
    () => {
      minutesPassed = minutesPassed + 1;
      const minutesRemaining =
        Math.floor((examDurationInMs - timeForFeedbackMs) / 60000) -
        minutesPassed;
      if (minutesRemaining > 1) {
      } else {
        clearInterval(minuteUpdateInterval);
      }
    },
    1 * 60 * 1000,
  );

  const gradingTimer = setTimeout(
    () => {
      client.send([
        {
          text: "IMPORTANT! There is one minute left. Please provide a grade and feedback as soon as possible!!!",
        },
      ]);
    },
    Math.max(0, examDurationInMs - timeForFeedbackMs),
  );

  // Mute microphone shortly before the exam ends (central constant)
  const preMuteThresholdMs = PRE_END_MUTE_MS;
  const preEndMuteTimer = setTimeout(
    () => {
      try {
        onPreEndMute?.();
      } catch {}
    },
    Math.max(0, examDurationInMs - preMuteThresholdMs),
  );

  const examUpTimer = setTimeout(async () => {
    if (onExamFinish) {
      await onExamFinish();
    }
  }, examDurationInMs);

  // Safety net: disconnect if submit_grade hasn't fired after 2 extra minutes
  const disconnectTimer = setTimeout(
    async () => {
      client.disconnect();
    },
    examDurationInMs + 2 * 60 * 1000,
  );

  return () => {
    clearTimeout(introTimer);
    clearTimeout(gradingTimer);
    clearTimeout(preEndMuteTimer);
    clearInterval(minuteUpdateInterval);
    clearInterval(examUpTimer);
    clearInterval(disconnectTimer);
    minuteTimers.forEach(clearTimeout); // Clear any individual minute timers if created differently
  };
}
