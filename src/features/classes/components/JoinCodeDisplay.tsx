import React, { useState } from "react";
import { JoinCodeDisplayProps } from "../../../types";
import QRCodeDisplay from "./QRCodeDisplay";

const JoinCodeDisplay: React.FC<JoinCodeDisplayProps> = ({
  joinCode,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  // Generate the full join URL
  const joinUrl = `${window.location.origin}/join/${joinCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy join URL:", err);
    }
  };

  return (
    <div className={`bg-gray-50 p-4 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 mr-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Deltag-link
          </h4>
          <div className="bg-white p-3 rounded border">
            <code className="text-sm break-all text-blue-600">{joinUrl}</code>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Del dette link med dine studenter
          </p>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm cursor-pointer"
          >
            {copied ? "Kopieret!" : "Kopier link"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <QRCodeDisplay joinCode={joinCode} />
      </div>
    </div>
  );
};

export default JoinCodeDisplay;
