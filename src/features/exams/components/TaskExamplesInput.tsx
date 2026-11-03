import React from "react";
import { MAX_TASK_EXAMPLES } from "../constants/examConstants";

interface TaskExamplesInputProps {
  examples: string[];
  onChange: (examples: string[]) => void;
  maxExamples?: number;
}

export default function TaskExamplesInput({
  examples,
  onChange,
  maxExamples = MAX_TASK_EXAMPLES,
}: TaskExamplesInputProps) {
  const validExamplesCount = examples.filter((ex) => ex.trim()).length;

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    onChange(newExamples);
  };

  const handleRemoveExample = (index: number) => {
    const newExamples = examples.filter((_, i) => i !== index);
    onChange(newExamples);
  };

  const handleAddExample = () => {
    onChange([...examples, ""]);
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-2 text-gray-500"
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
            Opgave eksempler
            <span className="ml-2 text-xs text-gray-500">
              ({validExamplesCount}/{maxExamples} - anbefalet 3+)
            </span>
          </div>
        </div>
      </label>
      <p className="text-sm text-gray-600 mb-3">
        Tilføj konkrete eksempler på opgaver som AI'en skal generere til den
        studerende. AI'en genererer opgaver der minder om dem du skriver her
      </p>
      <div className="space-y-3">
        {examples.map((example, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              value={example}
              onChange={(e) => handleExampleChange(index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
              placeholder={`Eksempel ${index + 1}: `}
              rows={3}
            />
            {examples.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveExample(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                aria-label="Fjern eksempel"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      {examples.length < maxExamples && (
        <button
          type="button"
          onClick={handleAddExample}
          className="mt-3 flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors font-medium"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tilføj nyt eksempel
        </button>
      )}
    </div>
  );
}
