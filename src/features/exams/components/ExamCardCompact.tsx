import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";

// Format duration
const formatDuration = (minutes: number): string => {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}t ${remainingMinutes}m` : `${hours}t`;
};

interface ExamCardCompactProps {
  exam: ExamSimulator;
  classTitle?: string;
  showStatistics?: boolean;
  isOwner?: boolean;
  onCopyLink?: (message: string) => void;
}

export default function ExamCardCompact({
  exam,
  classTitle,
  showStatistics = false,
  isOwner = false,
  onCopyLink,
}: ExamCardCompactProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const fullUrl = `${window.location.origin}/live?id=${exam.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setMenuOpen(false);
      onCopyLink?.("Link kopieret til udklipsholder!");
    } catch (err) {
      onCopyLink?.("Kunne ikke kopiere link");
    }
  };

  return (
    <div className="flex-shrink-0 w-72 md:w-80">
      <div className="relative h-52 md:h-56 rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        {/* Owner menu (3 dots) */}
        {isOwner && (
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
                <circle cx="12" cy="5" r="1" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-20 w-48 py-1 overflow-hidden">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors cursor-pointer"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Kopier Link
                </button>
                <Link
                  to={`/exam?id=${exam.id}`}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  onClick={() => setMenuOpen(false)}
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Rediger Eksamen
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Class badge */}
        {classTitle && (
          <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 truncate max-w-[120px]">
            {classTitle}
          </span>
        )}

        {/* Title and description */}
        <div className="flex-grow">
          {isOwner ? (
            <Link to={`/exam?id=${exam.id}`} className="group">
              <h3 className="text-gray-800 font-semibold text-base leading-tight line-clamp-2 pr-8 group-hover:text-blue-600 transition-colors">
                {exam.title}
              </h3>
            </Link>
          ) : (
            <h3 className="text-gray-800 font-semibold text-base leading-tight line-clamp-2 pr-20">
              {exam.title}
            </h3>
          )}
          {exam.description && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-2">
              {exam.description}
            </p>
          )}
        </div>

        {/* Duration */}
        {exam.duration > 0 && (
          <div className="flex items-center text-gray-400 text-sm mb-3">
            <svg
              className="w-4 h-4 mr-1.5"
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
            {formatDuration(exam.duration)}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Link
            to={`/live?id=${exam.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm font-medium"
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start
          </Link>
          {showStatistics && (
            <Link
              to={`/exam-statistics?exam-id=${exam.id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
              title="Se statistik"
            >
              <svg
                className="h-4 w-4"
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
          )}
        </div>
      </div>
    </div>
  );
}
