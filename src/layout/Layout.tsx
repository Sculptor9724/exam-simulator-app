import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/contexts/AuthContext";
import Navigation from "../navigation/Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center"
          >
            AI Voice Exam
          </Link>

          {/* Hamburger button - only visible on mobile */}
          <button
            className="focus:outline-none md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <Navigation
            user={user}
            userProfile={userProfile}
            handleLogout={handleLogout}
            variant="desktop"
          />
        </div>

        {/* Mobile navigation menu */}
        {isMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white border-t">
            <Navigation
              user={user}
              userProfile={userProfile}
              handleLogout={handleLogout}
              closeMenu={closeMenu}
              variant="mobile"
            />
          </div>
        )}
      </header>

      <main className="flex-grow relative">{children}</main>

    </div>
  );
}
