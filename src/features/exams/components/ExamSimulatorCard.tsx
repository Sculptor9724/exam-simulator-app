import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";

// Duration formatter
const formatDuration = (minutes: number): string => {
  if (!minutes) return "Ingen varighed sat";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}t ${remainingMinutes}m` : `${hours}t`;
};

interface ExamSimulatorCardProps {
  sim: ExamSimulator;
  showToast: (message: string) => void;
  createdByUser: boolean;
  classTitle?: string;
}

function ExamSimulatorCard({
  sim,
  showToast,
  createdByUser,
  classTitle,
}: ExamSimulatorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent menu close from click outside
    try {
      const fullUrl = `${window.location.origin}/live?id=${sim.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setMenuOpen(false);
      showToast("Link kopieret til udklipsholder!");
    } catch (err) {
      showToast("Kunne ikke kopiere link");
    }
  };

  return (
    <div
      className={`relative p-5 bg-white rounded-lg shadow-md transition-all duration-200 flex flex-col justify-between h-full border border-gray-100 ${
        isHovered ? "shadow-lg transform -translate-y-1" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header with Title and Menu */}
      <div className="flex justify-between items-start mb-3">
        {createdByUser ? (
          <Link to={`/exam?id=${sim.id}`} className="group">
            <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              {sim.title}
            </h2>
          </Link>
        ) : (
          <h2 className="text-xl font-bold text-gray-800">{sim.title}</h2>
        )}

        {/* Three-dots Menu Button */}
        {createdByUser && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              <svg
                className="h-5 w-5 text-gray-500"
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
              <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-48 py-1 overflow-hidden">
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
                  to={`/exam?id=${sim.id}`}
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
      </div>

      {classTitle && (
        <div className="mb-3">
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1">
            {classTitle}
          </span>
        </div>
      )}

      {/* Card Content */}
      <div className="flex-grow">
        {/* Task Description */}
        <p className="text-gray-600 line-clamp-3 mb-3">{sim.description}</p>

        {/* Exam Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          {sim.duration > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="h-4 w-4 mr-1"
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
              {formatDuration(sim.duration)}
            </div>
          )}

          {sim.type && (
            <div className="flex items-center text-sm text-gray-500">
              {sim.is_public ? (
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  Offentlig
                </div>
              ) : (
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Privat
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <Link
            to={`/live?id=${sim.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Simulator
          </Link>
          <Link
            to={`/exam-statistics?exam-id=${sim.id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            title="Se statistik"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ExamSimulatorCard;
