import React from "react";
import { Link } from "react-router-dom";

const NoClasses: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto max-w-md">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Ingen klasser
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Du har ikke oprettet nogen klasser endnu. Kom i gang ved at oprette
          din første klasse.
        </p>
        <div className="mt-6">
          <Link
            to="/class-editor"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Opret første klasse
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoClasses;
