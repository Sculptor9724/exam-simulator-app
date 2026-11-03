import React from "react";
import { UserExamStats } from "../../exams/repositories/ExamLogRepository";

interface StatsOverviewProps {
  stats: UserExamStats;
  loading: boolean;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
  // Format time display: minutes if < 60, otherwise hours
  const formatTime = (minutes: number): { value: string; unit: string } => {
    if (minutes < 60) {
      return { value: minutes.toString(), unit: "min" };
    }
    const hours = Math.round((minutes / 60) * 10) / 10;
    return { value: hours.toString(), unit: "timer" };
  };

  const timeDisplay = formatTime(stats.totalMinutes);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
      {/* Total Exams */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Eksamener taget
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalExams}
            </p>
          </div>
          <div className="bg-blue-100 rounded-full p-3">
            <svg
              className="w-8 h-8 text-blue-600"
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
          </div>
        </div>
      </div>

      {/* Average Grade */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Gennemsnitlig karakter
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.averageGrade !== null ? stats.averageGrade : "N/A"}
            </p>
          </div>
          <div className="bg-green-100 rounded-full p-3">
            <svg
              className="w-8 h-8 text-green-600"
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
          </div>
        </div>
      </div>

      {/* Total Time */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Samlet eksamenstid
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {timeDisplay.value}{" "}
              <span className="text-lg font-normal text-gray-600">
                {timeDisplay.unit}
              </span>
            </p>
          </div>
          <div className="bg-purple-100 rounded-full p-3">
            <svg
              className="w-8 h-8 text-purple-600"
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
          </div>
        </div>
      </div>
    </div>
  );
}
