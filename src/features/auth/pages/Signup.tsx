import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "../../../config/supabaseClient";
import Layout from "../../../layout/Layout"; // Import Layout

const SIGNUP_ACCESS_ERROR =
  "Du kan desværre ikke oprette en konto på AI Voice Exam. Kontakt den ansvarlige for denne installation, hvis du ønsker adgang";

const SignUp = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    role: "student", // Default to student
    email: "",
    password: "",
    school: "",
    educationName: "",
    semester: "",
  });

  function validateEmail(email: string) {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;

    if (name === "email") {
      setEmailError(""); // Clear error when user types
    }

    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  }

  function handleRoleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prevFormData) => ({
      ...prevFormData,
      role: event.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalizedEmail = formData.email.trim().toLowerCase();

    // Validate email
    if (!validateEmail(normalizedEmail)) {
      setEmailError("Indtast en gyldig email adresse");
      return;
    }

    setIsLoading(true);

    try {
      const { data: isSignupAllowed, error: signupAccessError } =
        await supabase.rpc("is_signup_email_allowed", {
          signup_email: normalizedEmail,
        });

      if (signupAccessError) {
        throw signupAccessError;
      }

      if (!isSignupAllowed) {
        setEmailError(SIGNUP_ACCESS_ERROR);
        alert(SIGNUP_ACCESS_ERROR);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo:
            `${window.location.origin}/login?userVerified=true`,
          data: {
            full_name: formData.fullName,
            school: formData.school,
            education_name: formData.educationName,
            semester: formData.semester,
            is_student: formData.role === "student",
          },
        },
      });
      if (error) throw error;
      alert("Check your email for verification link");
      navigate("/login"); // Navigate to login page
    } catch (error) {
      alert(error instanceof Error ? error.message : error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Opret en konto
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Fulde navn
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Fulde navn"
                  onChange={handleChange}
                  value={formData.fullName}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email adresse
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:z-10 sm:text-sm ${
                    emailError
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder="Email adresse"
                  onChange={handleChange}
                  value={formData.email}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Adgangskode
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Adgangskode"
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>
              <div>
                <label htmlFor="school" className="sr-only">
                  Skole (Fx KEA eller DTU)
                </label>
                <input
                  id="school"
                  name="school"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Skole (Fx KEA eller DTU)"
                  onChange={handleChange}
                  value={formData.school}
                />
              </div>
              <div>
                <label htmlFor="educationName" className="sr-only">
                  Uddannelsesnavn (Fx Datamatiker)
                </label>
                <input
                  id="educationName"
                  name="educationName"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Uddannelsesnavn (Fx Datamatiker)"
                  onChange={handleChange}
                  value={formData.educationName}
                />
              </div>
              <div>
                <label htmlFor="semester" className="sr-only">
                  Semester
                </label>
                <input
                  id="semester"
                  name="semester"
                  type="number"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Semester"
                  onChange={handleChange}
                  value={formData.semester}
                />
              </div>
              <div className="border border-gray-300 px-3 py-3 bg-white rounded-b-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jeg er
                </label>
                <div className="flex gap-6">
                  <div className="flex items-center">
                    <input
                      id="role-student"
                      name="role"
                      type="radio"
                      value="student"
                      checked={formData.role === "student"}
                      onChange={handleRoleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="role-student"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Studerende
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="role-teacher"
                      name="role"
                      type="radio"
                      value="teacher"
                      checked={formData.role === "teacher"}
                      onChange={handleRoleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="role-teacher"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Underviser
                    </label>
                  </div>
                </div>
              </div>
            </div>

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
                    Opretter konto...
                  </div>
                ) : (
                  "Opret konto"
                )}
              </button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-gray-600">Har du allerede en konto? </span>
            <Link
              to="/login" // Changed link to /login
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Log ind
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignUp;
