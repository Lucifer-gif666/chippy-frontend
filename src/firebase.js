// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB0N22KvaDiRJuXq_bB-JWzNT2-L1eEm-M",
  authDomain: "chippyinn-4d031.firebaseapp.com",
  projectId: "chippyinn-4d031",
  storageBucket: "chippyinn-4d031.appspot.com",
  messagingSenderId: "64488962751",
  appId: "1:64488962751:web:437264a36a27e4be93e40a",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 🔐 Auth setup (FIXED FOR MOBILE REDIRECT)
const auth = getAuth(app);

// 🔥 THIS LINE FIXES MOBILE GOOGLE LOGIN
setPersistence(auth, browserLocalPersistence);

// Google provider
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

// 🔔 Messaging (unchanged)
const messaging = getMessaging(app);

// Exports
export { auth, provider, messaging };
