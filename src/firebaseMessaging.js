import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase"; // ✅ reuse initialized app

// 🔔 Request permission + get FCM token
export const requestFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "PASTE_YOUR_PUBLIC_VAPID_KEY_HERE",
    });

    console.log("✅ FCM TOKEN:", token);
    return token;
  } catch (err) {
    console.error("❌ FCM token error:", err);
    return null;
  }
};

// 🔔 Handle foreground notifications
export const onForegroundMessage = (callback) =>
  onMessage(messaging, callback);
