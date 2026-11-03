import React from "react";
import { Link } from "react-router-dom";

const EmptyState = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div
          className="p-5 bg-white rounded-lg shadow-md border border-gray-100 flex flex-col justify-between h-full"
        >
          {/* Ghost Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="w-3/4 h-7 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>

          {/* Ghost Content */}
          <div className="flex-grow">
            {/* Ghost Description */}
            <div className="space-y-2 mb-3">
              <div className="w-full h-4 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="w-5/6 h-4 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="w-4/6 h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            {/* Ghost Details */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-1 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 mr-1 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Ghost Action Button */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
