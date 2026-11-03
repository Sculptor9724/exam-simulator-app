import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "../../../layout/Layout";
import { useAuth } from "../../auth/contexts/AuthContext";
import ExamRatingModal from "../../ai-examiner/components/ExamRatingModal";
import { examRatingRepository } from "../repositories/ExamRatingRepository";
import { examLogRepository } from "../repositories/ExamLogRepository";

interface ExamFinishedData {
  id: number;
  exam_id: number;
  user_id: string;
  created_at: string;
  finished_at: string | null;
  grade: string | number | null;
  feedback: string | null;
  duration_minutes: number | null;
  exam_title: string;
  exam_type?: string | null;
  grade_criteria?: string | null;
  class_title?: string;
}

export default function ExamFinished() {
  const [searchParams] = useSearchParams();
  const examLogId = searchParams.get("exam-log-id");
  const { user } = useAuth();

  const [examData, setExamData] = useState<ExamFinishedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showRatingConfirmation, setShowRatingConfirmation] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examLogId || !user) {
        setError("Missing exam log ID or user not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Get the specific exam log by ID with class information
        const examLog = await examLogRepository.fetchByIdWithDetails(
          examLogId,
          user.id
        );

        if (!examLog) {
          throw new Error("Exam log not found");
        }

        // Calculate duration only if exam is finished
        let durationMinutes = null;
        if (examLog.finished_at) {
          const createdAt = new Date(examLog.created_at);
          const finishedAt = new Date(examLog.finished_at);
          durationMinutes = Math.max(
            0,
            Math.round(
              (finishedAt.getTime() - createdAt.getTime()) / (1000 * 60)
            )
          );
        }

        setExamData({
          ...examLog,
          duration_minutes: durationMinutes,
        });
      } catch (err) {
        console.error("Error fetching exam data:", err);
        setError("Failed to load exam results");
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examLogId, user]);

  const handleRatingSubmit = async (
    rating: number,
    goodFeedback: string,
    improveFeedback: string
  ) => {
    if (!examData || !user) return;

    try {
      await examRatingRepository.create({
        exam_id: examData.exam_id,
        user_id: user.id,
        rating,
        good_feedback: goodFeedback,
        improve_feedback: improveFeedback,
      });

      setShowRatingConfirmation(true);
      setTimeout(() => {
        setIsRatingModalOpen(false);
        setShowRatingConfirmation(false);
      }, 2000);
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}t ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !examData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Kunne ikke indlæse eksamenresultater
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const showGrade =
    examData.grade_criteria !== "no-grade" && examData.exam_type !== "no-grade";
  const resultGridColumns =
    showGrade && examData.duration_minutes !== null
      ? "md:grid-cols-2"
      : "md:grid-cols-1";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Eksamen afsluttet
            </h1>
          </div>
        </div>

        {/* Exam Results */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {examData.exam_title}
              {examData.class_title && (
                <span className="text-lg font-normal text-gray-600 block">
                  {examData.class_title}
                </span>
              )}
            </h2>
          </div>

          {(showGrade || examData.duration_minutes !== null) && (
            <div
              className={`grid grid-cols-1 ${resultGridColumns} gap-8 mb-8`}
            >
              {/* Grade */}
              {showGrade && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Karakter fra AI
                  </h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {examData.grade || "Ikke fundet"}
                  </div>
                </div>
              )}

              {/* Duration - only show if exam is finished */}
              {examData.duration_minutes !== null && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Varighed
                  </h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatDuration(examData.duration_minutes)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {examData.feedback && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Feedback fra AI
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {examData.feedback}
                </p>
              </div>
            </div>
          )}

          {/* Rate Your Experience Button */}
          <div className="text-center">
            <button
              onClick={() => setIsRatingModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              Bedøm Din Oplevelse
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center flex justify-center">
          <Link
            to={`/exam-statistics?exam-id=${examData.exam_id}`}
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors shadow-sm mr-4"
          >
            <svg
              className="h-5 w-5 mr-2"
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
            Se Statistik
          </Link>
          <Link
            to={`/live?id=${examData.exam_id}`}
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-sm"
          >
            Tag Eksamen Igen
          </Link>
        </div>
      </div>

      {/* Rating Modal */}
      <ExamRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        showConfirmation={showRatingConfirmation}
      />
    </Layout>
  );
}
