import React from "react";
import { Link } from "react-router-dom";
import { ClassWithExams } from "../../classes/repositories/ClassRepository";

interface ClassesOverviewProps {
  classes: ClassWithExams[];
  loading: boolean;
}

export default function ClassesOverview({
  classes,
  loading,
}: ClassesOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Mine klasser</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Mine klasser</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          Du er ikke tilmeldt nogen klasser endnu.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Mine klasser</h2>
      <div className="space-y-4">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="bg-white rounded-lg shadow border border-gray-200"
          >
            {/* Class header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 rounded-t-lg">
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
                  {classItem.title}
                </h3>
                <span className="text-sm text-gray-600 ml-2">
                  — {classItem.exams.length}{" "}
                  {classItem.exams.length === 1 ? "eksamen" : "eksamener"}
                </span>
              </div>
            </div>

            {/* Exams content */}
            <div className="p-6 bg-gray-50">
              {classItem.exams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classItem.exams.map((exam) => (
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
        ))}
      </div>
    </div>
  );
}
