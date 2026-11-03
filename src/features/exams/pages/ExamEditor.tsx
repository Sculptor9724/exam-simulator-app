import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../../layout/Layout";
import { useAuth } from "../../auth/contexts/AuthContext";
import { Class } from "../../../types";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";
import { examRepository } from "../repositories/ExamRepository";
import { classExamRepository } from "../repositories/ClassExamRepository";
import { classRepository } from "../../classes/repositories/ClassRepository";
import TaskExamplesInput from "../components/TaskExamplesInput";
import { MAX_TASK_EXAMPLES } from "../constants/examConstants";

export default function ExamEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("id") || "";
  const { user, userProfile } = useAuth();
  const initialClassId = searchParams.get("classId");
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    initialClassId,
  );
  const [hasLoadedClasses, setHasLoadedClasses] = useState(false);
  const isTeacher = userProfile?.is_student === false;

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(examId !== "");

  useEffect(() => {
    const fetchExam = async () => {
      if (examId) {
        try {
          const data = await examRepository.fetchById(Number(examId));
          setExam(data);
        } catch (error) {
          console.error("Error fetching exam:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchExam();
  }, [examId]);

  useEffect(() => {
    const fetchExamClassRelation = async () => {
      if (!examId) {
        return;
      }
      const numericExamId = Number(examId);
      if (Number.isNaN(numericExamId)) {
        return;
      }

      try {
        const classId =
          await classExamRepository.fetchClassIdByExamId(numericExamId);
        setSelectedClassId(classId);
      } catch (error) {
        console.error("Error fetching exam class relation:", error);
      }
    };

    if (isTeacher) {
      fetchExamClassRelation();
    }
  }, [examId, isTeacher]);

  const [title, setTitle] = useState(exam ? exam.title : "");
  const [gradeCriteria, setGradeCriteria] = useState("");
  const [feedback, setFeedback] = useState(exam ? exam.feedback : "");
  const [duration, setDuration] = useState<number>(8);
  const [learningGoals, setLearningGoals] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("generated-task");
  const [taskExamples, setTaskExamples] = useState<string[]>([""]);
  const [taskGenerationInstructions, setTaskGenerationInstructions] =
    useState("");
  const [examinerInstructions, setExaminerInstructions] = useState("");
  const [typicalQuestions, setTypicalQuestions] = useState("");
  const [is_public, setIsPublic] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const isEditMode = examId !== "" && exam !== undefined;

  useEffect(() => {
    if (exam) {
      setTitle(exam.title || "");
      setGradeCriteria(exam.grade_criteria || "");
      setFeedback(exam.feedback || "");
      setDuration(!isNaN(Number(exam.duration)) ? Number(exam.duration) : 8);
      setLearningGoals(exam.learning_goals || "");
      setDescription(exam.description || "");
      setType(exam.type ?? "generated-task");
      // Split the concatenated examples back into an array for editing
      if (exam.examples && exam.examples.trim()) {
        // Split by the "Task example N" pattern and extract the content
        const examplesArray = exam.examples
          .split(/Task example \d+\n```\n/)
          .slice(1) // Remove first empty element
          .map((ex: string) => ex.replace(/\n```$/m, "").trim())
          .filter((ex: string) => ex.trim());
        setTaskExamples(examplesArray.length > 0 ? examplesArray : [""]);
      } else {
        setTaskExamples([""]);
      }
      setTaskGenerationInstructions(exam.task_generation_instructions || "");
      setExaminerInstructions(exam.examiner_instructions || "");
      setTypicalQuestions(exam.typical_questions || "");
      setIsPublic(exam.is_public || false);
    }
  }, [exam]);

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!user || !isTeacher) {
        setTeacherClasses([]);
        setIsLoadingClasses(false);
        setHasLoadedClasses(false);
        return;
      }

      setIsLoadingClasses(true);
      try {
        const data = await classRepository.fetchAll(user.id);
        const fetchedClasses = data as Class[];
        setTeacherClasses(fetchedClasses);

        if (!examId && initialClassId) {
          const hasInitialClass = fetchedClasses.some(
            (classItem) => classItem.id === initialClassId,
          );
          setSelectedClassId(hasInitialClass ? initialClassId : null);
        }
      } catch (error) {
        console.error("Error fetching teacher classes:", error);
        setTeacherClasses([]);
      } finally {
        setIsLoadingClasses(false);
        setHasLoadedClasses(true);
      }
    };

    fetchTeacherClasses();
  }, [user, isTeacher, examId, initialClassId]);

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
      // Remove message after fade out animation completes
      setTimeout(() => setToastMessage(""), 300);
    }, 3000);
  };

  const syncClassAssociation = async (examIdentifier: number | null) => {
    if (!isTeacher || examIdentifier === null) {
      return;
    }

    const numericExamId = Number(examIdentifier);
    if (Number.isNaN(numericExamId)) {
      throw new Error("Ugyldigt eksamens-id til klasseknytning.");
    }

    try {
      await classExamRepository.deleteByExamId(numericExamId);

      if (selectedClassId) {
        await classExamRepository.addExamToClass(
          selectedClassId,
          numericExamId,
        );
      }
    } catch (error: any) {
      throw new Error(
        `Kunne ikke opdatere eksamenens klasseknytning. ${error.message}`,
      );
    }
  };

  const handleSave = async () => {
    if (!user) {
      showToast("Fejl: Kunne ikke gemme. Brugeroplysninger mangler.");
      return; // Prevent saving if user is not found 14
    }

    // Validate task examples for generated-task mode
    if (type === "generated-task") {
      const validExamples = taskExamples.filter((ex) => ex.trim() !== "");
      if (validExamples.length > MAX_TASK_EXAMPLES) {
        showToast(
          `Fejl: Du kan maksimalt have ${MAX_TASK_EXAMPLES} opgave eksempler.`,
        );
        return;
      }
    }

    if (isTeacher && selectedClassId && hasLoadedClasses) {
      const hasSelectedClass = teacherClasses.some(
        (classItem) => classItem.id === selectedClassId,
      );

      if (!hasSelectedClass) {
        showToast("Fejl: Den valgte klasse findes ikke længere.");
        return;
      }
    }

    let savedExamId: number | null = null;
    let successMessage = "";

    // Filter out empty task examples and format them
    const validTaskExamples = taskExamples.filter((ex) => ex.trim() !== "");
    const concatenatedExamples =
      type === "generated-task" && validTaskExamples.length > 0
        ? validTaskExamples
            .map(
              (ex, index) =>
                `Task example ${index + 1}\n\`\`\`\n${ex.trim()}\n\`\`\``,
            )
            .join("\n\n")
        : null;

    if (isEditMode) {
      // Ensure exam is defined before accessing its properties
      if (!exam) {
        showToast("Fejl: Kunne ikke finde eksamen der skal opdateres.");
        return;
      }

      try {
        const numericExamId = Number(examId);
        await examRepository.update(numericExamId, {
          title,
          description,
          type,
          examples: concatenatedExamples,
          task_generation_instructions:
            type === "generated-task" ? taskGenerationInstructions : null,
          examiner_instructions: examinerInstructions,
          duration,
          grade_criteria: gradeCriteria,
          feedback,
          learning_goals: learningGoals,
          typical_questions: typicalQuestions,
          is_public,
          user_id: user.id,
        });

        successMessage = "Eksamen opdateret!";
      } catch (updateError: any) {
        console.error("Error updating exam:", updateError);
        showToast(`Fejl: Kunne ikke opdatere eksamen. ${updateError.message}`);
        return;
      }
    } else {
      try {
        const insertedExam = await examRepository.create({
          title,
          description,
          type,
          examples: concatenatedExamples,
          task_generation_instructions:
            type === "generated-task" ? taskGenerationInstructions : null,
          examiner_instructions: examinerInstructions,
          duration,
          grade_criteria: gradeCriteria,
          feedback,
          learning_goals: learningGoals,
          typical_questions: typicalQuestions,
          is_public,
          user_id: user.id,
        });

        savedExamId = insertedExam.id;
        successMessage = "Eksamen oprettet!";
      } catch (insertError: any) {
        console.error("Error creating exam:", insertError);
        showToast(`Fejl: Kunne ikke oprette eksamen. ${insertError.message}`);
        return;
      }
    }

    try {
      await syncClassAssociation(savedExamId);
    } catch (error: any) {
      console.error("Error updating class association:", error);
      const errorMessage =
        typeof error?.message === "string"
          ? error.message
          : "Kunne ikke opdatere klassens eksamener.";
      showToast(`Fejl: ${errorMessage}`);
      return;
    }

    showToast(successMessage);
    navigate("/exams");
  };

  const handleDelete = () => {
    if (!isEditMode) return;
    if (window.confirm("Er du sikker på, at du vil slette denne eksamen?")) {
      const deleteExam = async () => {
        const numericExamId = Number(examId);
        if (!Number.isNaN(numericExamId)) {
          try {
            await classExamRepository.deleteByExamId(numericExamId);
          } catch (relationError: any) {
            console.error("Error removing class association:", relationError);
            showToast(
              `Fejl: Kunne ikke fjerne klassens eksamen. ${relationError.message}`,
            );
            return;
          }
        }

        try {
          await examRepository.delete(Number(examId));
          showToast("Eksamen slettet!");
          navigate("/exams");
        } catch (error: any) {
          console.error("Error deleting exam:", error);
          showToast(`Fejl: Kunne ikke slette eksamen. ${error.message}`);
        }
      };

      deleteExam();
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link
            to="/exams"
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tilbage til eksamener"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? "Rediger Eksamen" : "Opret Eksamen"}
          </h1>
        </div>

        {/* Main form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Title field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Titel
                </div>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Indtast eksamenstitel"
                required
              />
            </div>

            {/* Description field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Beskrivelse af eksamen
                  </div>
                  {/*
                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    aria-label="Hjælp til eksamensopgave"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                      />
                    </svg>
                  </button>
                  */}
                </div>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Beskriv kort fagets eksamen"
              />
            </div>

            {/* Exam Mode Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-3">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Eksamenstype
                </div>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setType("generated-task")}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    type === "generated-task"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        checked={type === "generated-task"}
                        onChange={() => setType("generated-task")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="font-medium text-gray-900 cursor-pointer">
                        Genereret opgave
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        AI'en genererer en opgave som den studerende skal løse
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  onClick={() => setType("defense")}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    type === "defense"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        checked={type === "defense"}
                        onChange={() => setType("defense")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="font-medium text-gray-900 cursor-pointer">
                        Projekt forsvar
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        Den studerende uploader deres projekt (PDF, Word,
                        PowerPoint) og/eller et GitHub repo og forsvarer det til
                        eksamen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Examples - Only show for generated-task mode */}
            {type === "generated-task" && (
              <TaskExamplesInput
                examples={taskExamples}
                onChange={setTaskExamples}
              />
            )}

            {/* Task Generation Instructions - Only show for generated-task mode */}
            {type === "generated-task" && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Instruktioner til opgavegenerering (valgfrit)
                  </div>
                </label>
                <textarea
                  value={taskGenerationInstructions}
                  onChange={(e) =>
                    setTaskGenerationInstructions(e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-24 resize-y"
                  placeholder="Fx 'Brug aldrig async/await', 'Gør opgaven sjov og engagerende', 'Opgaven skal være meget svær'"
                />
              </div>
            )}

            {/* Learning Goals field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Konkrete læringsmål
                </div>
              </label>
              <textarea
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-y"
                placeholder="Fx - array - iterering, push, index og .length"
                required
              />
            </div>

            {/* Typical Questions field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Typiske Spørgsmål
                </div>
              </label>
              <textarea
                value={typicalQuestions}
                onChange={(e) => setTypicalQuestions(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Indtast typiske spørgsmål du ville stille under en eksamen"
              />
            </div>

            {/* Examiner Instructions - Always visible */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Instruktioner til eksaminator (valgfrit)
                </div>
              </label>
              <textarea
                value={examinerInstructions}
                onChange={(e) => setExaminerInstructions(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-24 resize-y"
                placeholder="Fx 'Vær meget streng', 'Giv hints hvis den studerende sidder fast', 'Stil mange opfølgende spørgsmål'"
              />
            </div>

            {/* Duration Slider */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Varighed: {duration} minut{duration !== 1 ? "ter" : ""}
                </div>
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Grade Criteria and Class Assignment - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Grade Criteria Dropdown */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Karakterkriterier
                  </div>
                </label>
                <select
                  value={gradeCriteria}
                  onChange={(e) => setGradeCriteria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                >
                  <option value="">Vælg karakterkriterium</option>
                  <option value="no-grade">Ingen karaktergivning</option>
                  <option value="7-skala">7-trinsskalaen</option>
                  <option value="bestået-ikke-bestået">
                    Bestået/ikke bestået
                  </option>
                </select>
              </div>

              {/* Tilknyt klasse */}
              {isTeacher && (
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Tilknyt klasse
                  </label>
                  {isLoadingClasses ? (
                    <div className="text-sm text-gray-500">
                      Henter klasser...
                    </div>
                  ) : teacherClasses.length > 0 ? (
                    <select
                      value={selectedClassId ?? ""}
                      onChange={(e) =>
                        setSelectedClassId(
                          e.target.value === "" ? null : e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                    >
                      <option value="">Ingen klasse</option>
                      {teacherClasses.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.title}
                        </option>
                      ))}
                    </select>
                  ) : hasLoadedClasses ? (
                    <div className="text-sm text-gray-500">
                      Du har ingen klasser endnu.{" "}
                      <Link
                        to="/classes"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Opret en klasse
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Henter klasser...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Feedback field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  Feedback
                </div>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Indtast hvordan feedback skal gives. Fx skal den være direkte, venlig, konstruktiv, rosende"
              />
            </div>

            {/* Is Public Checkbox */}
            <div className="mb-6">
              <label className="flex items-center text-gray-700 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={is_public}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Gør eksamen offentlig
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Hvis markeret, vil andre brugere kunne se og tage denne eksamen.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Annuller
              </Link>
              <div className="flex space-x-3">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-md transition-colors cursor-pointer"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Slet
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm cursor-pointer"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {isEditMode ? "Opdater Eksamen" : "Opret Eksamen"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Toast Notification */}
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-lg z-50 flex items-center transition-opacity duration-300 ${
            isToastVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <svg
            className="h-5 w-5 text-green-400 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {toastMessage}
        </div>

        {/* Help Modal */}
        {isHelpModalOpen && (
          <div className="fixed inset-0 bg-gray-50/75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Hjælp til eksamensbeskrivelse
                </h3>
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  I dette felt skal du beskrive eksamens overordnede kontekst og
                  formål. Inkludér gerne:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-gray-500 space-y-1">
                  <li>Fagområde og emner der dækkes</li>
                  <li>Niveau (fx 2. semester, bachelor, etc.)</li>
                  <li>Eksamensformat (mundtlig, skriftlig, praktisk)</li>
                  <li>Generel kontekst om hvad eksamen går ud på</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3 font-medium">
                  Bemærk: Dette er den overordnede beskrivelse. Hvis du vælger
                  "Genereret opgave", skal du efterfølgende tilføje konkrete
                  eksempler på opgaver.
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Eksempel:</strong> Eksamen i algoritmer og
                  datastrukturer for 2. semester datamatikere. Fokus på Big O
                  notation, søgning, sortering og grundlæggende datastrukturer.
                </p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  Forstået
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
