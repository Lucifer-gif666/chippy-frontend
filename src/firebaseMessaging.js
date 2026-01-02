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
      vapidKey: "BMXQtEru2rP04XBBef4aR3OIgCii02O5xnhL1s08W8iKFFxsQGEGdhGwT7GXZVdn63OHD3h0h9Sa70ujATCqiLg",
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
