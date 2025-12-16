// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import logo from "../assets/image-removebg-preview.png";
import ProfileDropdown from "../ReusableComp/ProfileDropdown";
import NotificationBar from "../ReusableComp/NotificationBar";

const Header = ({ toggleSidebar, hamburgerRef, unreadCount = 0, onNotificationClick, onMarkAsRead }) => {
  const [user, setUser] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("currentStaff");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const unread = Number(unreadCount) || 0;

  const handleNotificationClick = (e) => {
    e?.preventDefault?.();
    setIsNotificationOpen((prev) => !prev);
  };

  const handleMarkAsRead = () => {
    if (typeof onMarkAsRead === "function") onMarkAsRead();
  };

  const handleLogout = () => {
    localStorage.removeItem("currentStaff");
    setUser(null);
    navigate("/staff-login");
    window.location.reload(); // Force reload to clear state
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md shadow-md">
      <div className="flex items-center gap-3">
        <button
          ref={hamburgerRef}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="hamburger-button p-2 rounded-md bg-black hover:bg-gray-800 transition-colors duration-200 focus:outline-none z-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/staff-dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Chippy Inn Logo" className="w-10 h-10 object-contain" />
          <span className="text-xl font-semibold text-gray-800 tracking-tight truncate">
            Chippy Inn
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={handleNotificationClick}
            aria-label={`Notifications (${unread} unread)`}
            className="relative cursor-pointer focus:outline-none"
          >
            <FaBell size={22} className="text-gray-700" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1 leading-4">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          <NotificationBar
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            unreadCount={unread}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>

        {/* Profile Dropdown */}
        <ProfileDropdown user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
};

export default Header;
