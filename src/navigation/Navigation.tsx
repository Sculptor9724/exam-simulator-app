import React from "react";
import { Link } from "react-router-dom";
import UserMenu from "./UserMenu";

interface NavigationProps {
  user: any;
  userProfile: any;
  handleLogout: () => void;
  closeMenu?: () => void;
  variant?: "desktop" | "mobile";
}

// Shared nav links configuration
const navLinks = [
  { to: "/dashboard", label: "Hjem", requiresAuth: true },
  { to: "/exams", label: "Eksamener", requiresAuth: true },
  { to: "/classes", label: "Klasser", requiresAuth: true },
];

const guestLinks = [{ to: "/login", label: "Log ind" }];

const Navigation: React.FC<NavigationProps> = ({
  user,
  userProfile,
  handleLogout,
  closeMenu = () => {},
  variant = "mobile",
}) => {
  const isDesktop = variant === "desktop";

  if (isDesktop) {
    return (
      <nav className="hidden md:!flex items-center space-x-6">
        {user ? (
          <>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <UserMenu
              user={user}
              userProfile={userProfile}
              handleLogout={handleLogout}
            />
          </>
        ) : (
          <>
            {guestLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    );
  }

  // Mobile variant
  return (
    <ul className="space-y-3">
      {user ? (
        <>
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="block text-gray-600 hover:text-gray-900"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/profile"
              className="block text-gray-600 hover:text-gray-900"
              onClick={closeMenu}
            >
              Min profil
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className="block text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Log ud
            </button>
          </li>
        </>
      ) : (
        <>
          {guestLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="block text-gray-600 hover:text-gray-900"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </>
      )}
    </ul>
  );
};

export default Navigation;
