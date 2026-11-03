import React from "react";
import { Link } from "react-router-dom";
import { RecentExam } from "../../exams/repositories/ExamLogRepository";

interface ContinueWhereYouLeftOffProps {
  lastExam: RecentExam | null;
  loading: boolean;
}

export default function ContinueWhereYouLeftOff({
  lastExam,
  loading,
}: ContinueWhereYouLeftOffProps) {
  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Din seneste eksamen
        </h2>
        <div className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!lastExam) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("da-DK", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGradeBadgeColor = (grade: string | null) => {
    if (!grade) return "bg-gray-100 text-gray-700";
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade)) return "bg-gray-100 text-gray-700";
    if (numGrade >= 10) return "bg-green-100 text-green-700";
    if (numGrade >= 7) return "bg-blue-100 text-blue-700";
    if (numGrade >= 4) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Din seneste eksamen
      </h2>
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {lastExam.exam_title}
              </h3>
              {lastExam.class_title && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                  {lastExam.class_title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                {formatDate(lastExam.created_at)} kl.{" "}
                {formatTime(lastExam.created_at)}
              </span>
              {lastExam.duration_minutes !== null && (
                <>
                  <span>•</span>
                  <span>{Math.round(lastExam.duration_minutes)} min</span>
                </>
              )}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex items-center gap-3">
            {lastExam.grade && (
              <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-base font-bold ${getGradeBadgeColor(
                  lastExam.grade
                )}`}
              >
                {lastExam.grade}
              </span>
            )}
            <Link
              to={`/live?id=${lastExam.exam_id}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Prøv igen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
