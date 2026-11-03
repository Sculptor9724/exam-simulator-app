import React, { useState } from "react";
import Layout from "../../../layout/Layout";
import { waitlistRepository } from "../repositories/WaitlistRepository";

const WaitlistPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await waitlistRepository.addToWaitlist(email);
      setIsSubmitted(true);
    } catch (error: any) {
      if (error.message === "EMAIL_ALREADY_EXISTS") {
        setError("Denne email er allerede på ventelisten");
      } else {
        setError("Der opstod en fejl. Prøv igen senere.");
        console.error("Waitlist error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    setError(""); // Clear error when user types
  }

  if (isSubmitted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md text-center">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Du er på ventelisten!
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Vi kontakter dig, når der er plads til flere brugere.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Kom på ventelisten
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Indtast din email for at få besked når vi åbner op for flere
              brugere.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Din email adresse"
                onChange={handleChange}
                value={email}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <circle
                        className="opacity-75"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"
                        strokeDasharray="16 48"
                      />
                    </svg>
                    Tilmelder...
                  </div>
                ) : (
                  "Kom på ventelisten"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default WaitlistPage;
