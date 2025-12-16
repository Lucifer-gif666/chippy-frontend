// src/layout/StaffLayout.jsx
import React, { useState, useRef, useEffect } from "react"; 
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/StaffDashboard.css";
import "../styles/StaffLayout.css";

const StaffLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("currentStaff"));
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto close on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Fetch unread notifications safely
  const fetchUnreadNotifications = async () => {
    try {
      if (!user?._id) return;
      const res = await axios.get(`/api/notifications?staffId=${user._id}`);
      const notifications = Array.isArray(res.data) ? res.data : [];
      const unread = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);

      // Optional: show browser notification pop-up for latest unread
      notifications
        .filter((n) => !n.isRead)
        .forEach((n) => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Chippy Inn", { body: n.message });
          }
        });
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Handler to decrease unread count when a notification is read
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
      {/* Fixed Header with Notification Icon */}
      <Header
        toggleSidebar={toggleSidebar}
        hamburgerRef={hamburgerRef}
        unreadCount={unreadCount}
        onMarkAsRead={handleNotificationRead}
      />

      {/* Body wrapper: sidebar + main content */}
      <div className="layout-body">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`sidebar transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "open" : "closed"
          }`}
        >
          <ul className="menu-list">
            <li>
              <Link
                to="/staff-dashboard"
                className={location.pathname === "/staff-dashboard" ? "active" : ""}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/raise-ticket"
                className={location.pathname === "/raise-ticket" ? "active" : ""}
              >
                Raise Ticket
              </Link>
            </li>
            <li>
              <Link
                to="/all-tickets"
                className={location.pathname === "/all-tickets" ? "active" : ""}
              >
                All Tickets
              </Link>
            </li>

            {user?.role === "admin" && (
              <li>
                <Link
                  to="/assign-tickets"
                  className={location.pathname === "/assign-tickets" ? "active" : ""}
                >
                  Assign Tickets
                </Link>
              </li>
            )}

            <li>
              <Link
                to="/my-tickets"
                className={location.pathname === "/my-tickets" ? "active" : ""}
              >
                My Tickets
              </Link>
            </li>

            <li>
              <Link
                to="/ticket-history"
                className={location.pathname === "/ticket-history" ? "active" : ""}
              >
                Ticket History
              </Link>
            </li>

            {user?.role === "admin" && (
              <>
                <li>
                  <Link
                    to="/staff-management"
                    className={location.pathname === "/staff-management" ? "active" : ""}
                  >
                    Staff Management
                  </Link>
                </li>
                <li>
                  <Link
                    to="/zone-management"
                    className={location.pathname === "/zone-management" ? "active" : ""}
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
              ? React.cloneElement(child, { handleNotificationRead, onUpdateUnread: setUnreadCount })
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
