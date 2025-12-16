// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getMessaging } from "firebase/messaging"; // ✅ Add this for push notifications

const firebaseConfig = {
  apiKey: "AIzaSyB0N22KvaDiRJuXq_bB-JWzNT2-L1eEm-M",
  authDomain: "chippyinn-4d031.firebaseapp.com",
  projectId: "chippyinn-4d031",
  storageBucket: "chippyinn-4d031.appspot.com",
  messagingSenderId: "64488962751",
  appId: "1:64488962751:web:437264a36a27e4be93e40a"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Auth setup (existing)
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Messaging setup (new)
const messaging = getMessaging(app);

// Export everything
export { auth, provider, signInWithPopup, messaging };
