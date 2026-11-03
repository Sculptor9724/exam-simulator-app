import React from "react";
import { Link } from "react-router-dom";
import { ClassWithExams } from "../repositories/ClassRepository";

interface ClassCardProps {
  classData: ClassWithExams;
  isStudent: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({ classData, isStudent }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-12">
      {/* Class header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              {classData.title}
            </h3>
            <span className="text-sm text-gray-600 ml-2">
              — {classData.exams.length}{" "}
              {classData.exams.length === 1 ? "eksamen" : "eksamener"}
            </span>
          </div>
          {/* Settings button for teachers */}
          {!isStudent && (
            <Link
              to={`/class/${classData.id}`}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              title="Administrer klasse"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Administrer</span>
            </Link>
          )}
        </div>
      </div>

      {/* Exams content */}
      <div className="p-6 bg-gray-50">
        {classData.exams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classData.exams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white"
              >
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {exam.title}
                  </h4>
                  {exam.duration && (
                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="w-3 h-3 mr-1"
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
                      {Math.round(exam.duration)} minutter
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/live?id=${exam.id}`}
                    className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
                  >
                    Start eksamen
                  </Link>
                  <Link
                    to={`/exam-statistics?exam-id=${exam.id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded transition-colors text-sm flex items-center justify-center"
                    title="Se statistik"
                  >
                    <svg
                      className="w-4 h-4"
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
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Ingen eksamener tilføjet til denne klasse endnu
          </p>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
