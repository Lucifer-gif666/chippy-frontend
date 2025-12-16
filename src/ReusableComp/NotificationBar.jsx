import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NotificationBar = ({ isOpen, onClose, unreadCount, onMarkAsRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    // Mark as read first
    await markAsRead(notification._id);
    // Navigate to the URL or ticket details
    if (notification.url) {
      navigate(notification.url);
    } else {
      // Default to ticket details page
      navigate(`/ticket-details/${notification.ticketId}`);
    }
    onClose();
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`, {
        staffId: user._id,
      });
      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
      // Notify parent to update unread count
      if (onMarkAsRead) onMarkAsRead();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Notifications ({notifications.length})
        </h3>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No unread notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className="p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div
                className="text-sm text-gray-800 cursor-pointer mb-2"
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.message}
              </div>
              <button
                onClick={() => markAsRead(notification._id)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Mark as Read
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationBar;
