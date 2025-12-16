// src/ReusableComp/ProfileDropdown.jsx
import React, { useEffect, useRef, useState } from "react";

const ProfileDropdown = ({ user, onLogout }) => {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger area */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="hidden sm:block text-gray-700 font-medium truncate">
          Welcome, {user?.name || "Staff"}
        </span>
        <div className="w-9 h-9 rounded-full bg-gray-700 text-white flex items-center justify-center font-semibold uppercase">
          {user?.name?.[0] || "S"}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-gray-800 text-gray-200 shadow-xl rounded-xl p-4 z-50 border border-gray-700 animate-fadeIn">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-700 text-white flex items-center justify-center text-2xl font-bold uppercase">
              {user?.name?.[0] || "S"}
            </div>
            <p className="mt-2 text-gray-200 font-semibold">{user?.name || "Staff"}</p>
          </div>

          <div className="border-t border-gray-600 my-2"></div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full text-left p-2 rounded-md hover:bg-red-700 transition text-red-400 font-semibold mt-2"
          >
            Logout
          </button>
        </div>
      )}

      {/* Fade animation */}
      <style>
        {`
          .animate-fadeIn {
            animation: fadeIn 0.15s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default ProfileDropdown;
