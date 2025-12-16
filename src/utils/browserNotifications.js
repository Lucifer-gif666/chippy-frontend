// src/utils/browserNotifications.js
import logo from "../assets/image-removebg-preview.png"; // correct path to your logo

export const showBrowserNotification = (title, message) => {
  // Check if browser supports notifications
  if (!("Notification" in window)) return;

  // Permission granted → show notification
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: logo, // ✅ use imported image URL
    });
  } 
  // Permission not denied → request permission first
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body: message,
          icon: logo, // ✅ use imported image URL
        });
      }
    });
  }
};
