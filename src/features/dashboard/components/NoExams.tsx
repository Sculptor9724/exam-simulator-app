import React from "react";
import { Link } from "react-router-dom";

const EmptyState = () => {
  return (
    <div className="text-center py-6">
    <div className="mb-6 flex justify-center">
      <svg
        className="h-24 w-24 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-6">
      Ingen eksamener fundet.
    </h3>
    <Link
      to="/create"
      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition-colors shadow-md"
    >
      Opret Din Første Eksamen
    </Link>
  </div>  
)};

export default EmptyState;
