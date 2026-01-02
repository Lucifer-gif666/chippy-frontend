import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

// 🔔 Request permission + get FCM token
export const requestFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BMXQtEru2rP04XBBef4aR3OIgCii02O5xnhL1s08W8iKFFxsQGEGdhGwT7GXZVdn63OHD3h0h9Sa70ujATCqiLg",
    });

    console.log("✅ FCM TOKEN:", token);

    const backendURL = import.meta.env.VITE_API_URL;
    if (!backendURL) {
      console.error("❌ VITE_API_URL missing");
      return token;
    }

    const res = await fetch(`${backendURL}/api/save-fcm-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      console.error("❌ Failed to save FCM token:", res.status);
      return token;
    }

    console.log("✅ FCM token saved to backend");
    return token;
  } catch (err) {
    console.error("❌ FCM token error:", err);
    return null;
  }
};

// 🔔 Foreground notification listener
export const onForegroundMessage = (callback) =>
  onMessage(messaging, callback);
