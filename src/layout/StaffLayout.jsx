// src/layout/StaffLayout.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/StaffDashboard.css";
import "../styles/StaffLayout.css";

const IDLE_TIMEOUT = 15 * 60 * 1000; // ⏱️ 15 minutes

const StaffLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);
  const idleTimerRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("currentStaff"));
  const location = useLocation();

  // ✅ ADMIN + SUPER ADMIN
  const isPrivileged = ["admin", "super_admin"].includes(user?.role);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 🔐 Auto logout function
  const handleAutoLogout = () => {
    localStorage.removeItem("currentStaff");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // 🕒 Idle logout logic
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        alert("You were logged out due to inactivity.");
        handleAutoLogout();
      }, IDLE_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) =>
      window.addEventListener(event, resetIdleTimer)
    );

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, []);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Fetch unread notifications
  const fetchUnreadNotifications = async () => {
    try {
      if (!user?._id) return;

      const res = await axios.get(
        `/api/notifications?staffId=${user._id}`
      );

      const notifications = Array.isArray(res.data) ? res.data : [];
      const unread = notifications.filter(
        (n) => !n.readBy?.includes(user._id)
      ).length;

      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationRead = () => {
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <Header
        toggleSidebar={toggleSidebar}
        hamburgerRef={hamburgerRef}
        unreadCount={unreadCount}
        onMarkAsRead={handleNotificationRead}
      />

      <div className="layout-body">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`sidebar ${
            isSidebarOpen ? "open" : "closed"
          }`}
        >
          <ul className="menu-list">
            <li>
              <Link
                to="/staff-dashboard"
                className={
                  location.pathname === "/staff-dashboard" ? "active" : ""
                }
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                to="/raise-ticket"
                className={
                  location.pathname === "/raise-ticket" ? "active" : ""
                }
              >
                Raise Ticket
              </Link>
            </li>

            <li>
              <Link
                to="/all-tickets"
                className={
                  location.pathname === "/all-tickets" ? "active" : ""
                }
              >
                All Tickets
              </Link>
            </li>

            {isPrivileged && (
              <li>
                <Link
                  to="/assign-tickets"
                  className={
                    location.pathname === "/assign-tickets" ? "active" : ""
                  }
                >
                  Assign Tickets
                </Link>
              </li>
            )}

            <li>
              <Link
                to="/my-tickets"
                className={
                  location.pathname === "/my-tickets" ? "active" : ""
                }
              >
                My Tickets
              </Link>
            </li>

            <li>
              <Link
                to="/ticket-history"
                className={
                  location.pathname === "/ticket-history" ? "active" : ""
                }
              >
                Ticket History
              </Link>
            </li>

            {isPrivileged && (
              <>
                <li>
                  <Link
                    to="/staff-management"
                    className={
                      location.pathname === "/staff-management"
                        ? "active"
                        : ""
                    }
                  >
                    Staff Management
                  </Link>
                </li>

                <li>
                  <Link
                    to="/zone-management"
                    className={
                      location.pathname === "/zone-management"
                        ? "active"
                        : ""
                    }
                  >
                    Zone Management
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Main content */}
        <div className="main-content">
          {React.Children.map(children, (child) =>
            React.isValidElement(child) && typeof child.type !== "string"
              ? React.cloneElement(child, {
                  handleNotificationRead,
                  onUpdateUnread: setUnreadCount,
                })
              : child
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StaffLayout;
