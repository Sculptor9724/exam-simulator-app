import React from "react";
import { Link } from "react-router-dom";

interface UnsupportedBrowserModalProps {
  isOpen: boolean;
}

const UnsupportedBrowserModal: React.FC<UnsupportedBrowserModalProps> = ({
  isOpen,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-gray-600/80 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md m-5">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 w-16 h-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Browser ikke understøttet
          </h2>
          <p className="text-gray-700 mb-6">
            For at tage en eksamen skal du bruge en Chrome baseret browser.
            Andre browsere understøttes ikke lige nu.
          </p>
          <p className="text-gray-600 mb-6 text-sm">
            Download Chrome fra{" "}
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              google.com/chrome
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition duration-200 shadow-md"
            >
              Gå til Dashboard
            </Link>
            <Link
              to="/exams"
              className="px-6 py-3 bg-gray-700 text-white font-semibold rounded hover:bg-gray-800 transition duration-200 shadow-md"
            >
              Gå til Eksamener
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsupportedBrowserModal;
