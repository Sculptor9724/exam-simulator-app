import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

interface UserMenuProps {
  user: any;
  userProfile: any;
  handleLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  userProfile,
  handleLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get first letter of name or email
  const getInitial = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
        aria-label="User menu"
      >
        {getInitial()}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* Account section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Konto
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center flex-shrink-0">
                {getInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userProfile?.full_name || "Bruger"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={handleMenuItemClick}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Min profil
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={() => {
                handleLogout();
                handleMenuItemClick();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Log ud
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
