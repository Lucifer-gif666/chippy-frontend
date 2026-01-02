import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB0N22KvaDiRJuXq_bB-JWzNT2-L1eEm-M",
  authDomain: "chippyinn-4d031.firebaseapp.com",
  projectId: "chippyinn-4d031",
  messagingSenderId: "64488962751",
  appId: "1:64488962751:web:437264a36a27e4be93e40a"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "👉 YOUR_PUBLIC_VAPID_KEY 👈"
    });

    console.log("✅ FCM TOKEN:", token);
    return token;
  } catch (err) {
    console.error("❌ FCM token error:", err);
    return null;
  }
};

export const onForegroundMessage = (callback) =>
  onMessage(messaging, callback);
