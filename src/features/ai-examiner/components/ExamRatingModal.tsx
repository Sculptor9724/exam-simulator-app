import React, { useState } from "react";

interface ExamRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    rating: number,
    goodFeedback: string,
    improveFeedback: string
  ) => void;
  showConfirmation?: boolean;
}

const ExamRatingModal: React.FC<ExamRatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  showConfirmation,
}) => {
  const [rating, setRating] = useState(0);
  const [goodFeedback, setGoodFeedback] = useState("");
  const [improveFeedback, setImproveFeedback] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, goodFeedback, improveFeedback);
  };

  if (!isOpen) {
    return null;
  }

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-gray-600/80 overflow-y-auto h-full w-full flex justify-center items-center">
        <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md m-5 text-center">
          <svg
            className="mx-auto mb-4 w-16 h-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
          <h2 className="text-xl font-semibold mb-4">Thank You!</h2>
          <p className="text-gray-700">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-gray-600/80 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-2xl m-5">
        <h2 className="text-xl text-gray-700 font-semibold mb-4">Bedøm din eksamen</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Bedøm (0-5 stjerner)
          </label>
          <div className="flex">
            {[...Array(5)].map((_, index) => (
              <button
                key={index}
                onClick={() => setRating(index)}
                className={`text-2xl cursor-pointer ${
                  index <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="goodFeedback"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Hvad gik godt?
          </label>
          <textarea
            id="goodFeedback"
            value={goodFeedback}
            onChange={(e) => setGoodFeedback(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="improveFeedback"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Hvad kan forbedres?
          </label>
          <textarea
            id="improveFeedback"
            value={improveFeedback}
            onChange={(e) => setImproveFeedback(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded cursor-pointer mr-2"
          >
            Annuller
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamRatingModal;
