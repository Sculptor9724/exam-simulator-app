import React from "react";
import { Link } from "react-router-dom";
import { RecentExam } from "../../exams/repositories/ExamLogRepository";

interface ExamLogsListProps {
  exams: RecentExam[];
  loading: boolean;
}

export default function ExamLogsList({ exams, loading }: ExamLogsListProps) {
  const [expandedFeedback, setExpandedFeedback] = React.useState<Set<number>>(
    new Set()
  );

  const toggleFeedback = (examId: number) => {
    setExpandedFeedback((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(examId)) {
        newSet.delete(examId);
      } else {
        newSet.add(examId);
      }
      return newSet;
    });
  };
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Seneste eksamener
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Seneste eksamener
          </h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          Du har ikke taget nogen eksamener endnu.
          <br />
          <Link
            to="/exams"
            className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            Start din første eksamen →
          </Link>
        </div>
      </div>
    );
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
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Seneste eksamener
      </h2>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {exams.map((exam) => (
          <div key={exam.id}>
            <Link
              to={`/exam-finished?exam-log-id=${exam.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {exam.exam_title}
                  </h3>
                  {exam.class_title && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                      {exam.class_title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    {formatDate(exam.created_at)} kl.{" "}
                    {formatTime(exam.created_at)}
                  </span>
                  {exam.duration_minutes !== null && (
                    <>
                      <span>•</span>
                      <span>{Math.round(exam.duration_minutes)} min</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                {exam.grade && (
                  <span
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-base font-bold ${getGradeBadgeColor(
                      exam.grade
                    )}`}
                  >
                    {exam.grade}
                  </span>
                )}
                {exam.feedback && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFeedback(exam.id);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Vis feedback"
                  >
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedFeedback.has(exam.id) ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </Link>
            {expandedFeedback.has(exam.id) && exam.feedback && (
              <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                <div className="pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Feedback:
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {exam.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
