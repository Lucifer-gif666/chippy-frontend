import { messaging } from "../firebase";
import { getToken } from "firebase/messaging";

/**
 * Requests browser notification permission and gets FCM token
 * @param {string} userId - Logged-in user's ID
 * @returns {string|null} FCM token
 */
export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Get FCM token
      const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY_HERE" });
      console.log("FCM Token:", token);

      // Send token to backend to associate with this user


      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return null;
  }
};
