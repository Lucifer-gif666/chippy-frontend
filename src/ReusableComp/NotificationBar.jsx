import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/NotificationBar.css";

const NotificationBar = ({ isOpen, onClose, unreadCount, onMarkAsRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [readingId, setReadingId] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("currentStaff"));

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && user?._id) {
      fetchNotifications();
    }
  }, [isOpen, user?._id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/notifications?staffId=${user._id}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);

    if (notification.url) {
      navigate(notification.url);
    } else {
      navigate(`/ticket-details/${notification.ticketId}`);
    }

    onClose();
  };

  const markAsRead = async (notificationId) => {
    try {
      setReadingId(notificationId);

      await axios.patch(`/api/notifications/${notificationId}/read`, {
        staffId: user._id,
      });

      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );

      if (onMarkAsRead) onMarkAsRead();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    } finally {
      setReadingId(null);
    }
  };

  // Clear all (frontend loop – safe fallback)
  const clearAllNotifications = async () => {
    try {
      setClearingAll(true);

      for (const notification of notifications) {
        await axios.patch(`/api/notifications/${notification._id}/read`, {
          staffId: user._id,
        });
      }

      setNotifications([]);
      if (onMarkAsRead) onMarkAsRead("all");
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    } finally {
      setClearingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="notification-dropdown">
      {/* HEADER */}
      <div className="notification-header">
        <h3>Notifications ({notifications.length})</h3>

        {notifications.length > 0 && (
          <button
            className="clear-all-btn"
            onClick={clearAllNotifications}
            disabled={clearingAll}
          >
            {clearingAll ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>

      {/* BODY */}
      <div className="notification-body">
        {loading ? (
          <div className="notification-state">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-state">No unread notifications</div>
        ) : (
          notifications.map((notification) => (
            <div key={notification._id} className="notification-item">
              <div
                className="notification-message"
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.message}
              </div>

              <button
                className="mark-read-btn"
                onClick={() => markAsRead(notification._id)}
                disabled={readingId === notification._id}
              >
                {readingId === notification._id
                  ? "Marking..."
                  : "Mark as Read"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationBar;
