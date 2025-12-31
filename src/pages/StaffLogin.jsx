// src/pages/StaffLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import GoogleLogo from "../assets/icons8-google-logo-48.png";
import ChippyLogo from "../assets/image-removebg-preview.png";
import BgImage from "../assets/868ae689-5098-45a2-a634-ec7b996cf467.jpg";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

// ✅ API base URL from ENV
const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  console.error("❌ VITE_API_URL is missing");
}

// 📱 Mobile detection
const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const StaffLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  /* ---------------------------------------------------
     🔁 HANDLE REDIRECT RESULT (MOBILE RETURN)
     IMPORTANT: loader is UI only, never controls logic
     --------------------------------------------------- */
  useEffect(() => {
    const handleRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);

        // No redirect → normal load
        if (!result || !result.user) return;

        setIsSigningIn(true);
        await handleGoogleBackendLogin(result.user);
      } catch (err) {
        console.error("Google redirect error:", err);
        alert("Google login failed. Please try again.");
        setIsSigningIn(false);
      }
    };

    handleRedirectLogin();
  }, []);

  /* ---------------------------------------------------
     🔐 BACKEND GOOGLE LOGIN (SHARED)
     --------------------------------------------------- */
  const handleGoogleBackendLogin = async (user) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          googleId: user.uid,
        }),
      });

      const data = await res.json();

      if (res.status === 403) {
        alert(data.message);
        setIsSigningIn(false);
        return;
      }

      if (res.status === 201 && data.message?.includes("waiting")) {
        alert(data.message);
        setIsSigningIn(false);
        return;
      }

      if (data.needsPassword) {
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("currentStaff", JSON.stringify(data.user));
        navigate("/set-password");
        return;
      }

      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("currentStaff", JSON.stringify(data.user));
      navigate("/staff-dashboard");
    } catch (err) {
      console.error("Backend Google login error:", err);
      alert("Login failed. Try again.");
      setIsSigningIn(false);
    }
  };

  /* ---------------------------------------------------
     🔑 GOOGLE SIGN-IN (DESKTOP + MOBILE)
     --------------------------------------------------- */
  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;

    try {
      setIsSigningIn(true);

      if (isMobileDevice()) {
        // 📱 Mobile → Redirect
        await signInWithRedirect(auth, provider);
      } else {
        // 💻 Desktop → Popup
        const result = await signInWithPopup(auth, provider);
        await handleGoogleBackendLogin(result.user);
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed. Try again.");
      setIsSigningIn(false);
    }
  };

  /* ---------------------------------------------------
     ✉ EMAIL LOGIN (UNCHANGED)
     --------------------------------------------------- */
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("currentStaff", JSON.stringify(data.user));
      navigate("/staff-dashboard");
    } catch (err) {
      console.error("Email login error:", err);
      alert("Email login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden md:justify-center min-[1500px]:justify-start">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#473C1A]/10 md:bg-gradient-to-r md:from-[#473C1A]/10 md:to-transparent animate-pulse-slow"></div>
      </div>

      <div
        className="flex md:flex-[0_0_30%] flex-1 items-center justify-center p-8 z-10"
        style={{ backgroundColor: "#F0EADC" }}
      >
        <div className="relative w-full max-w-sm bg-white p-6 min-[1500px]:p-8 rounded-3xl shadow-xl border border-gray-300">

          {/* 🔒 Overlay (UI ONLY) */}
          {isSigningIn && (
            <div className="absolute inset-0 bg-[#F0EADC]/80 backdrop-blur-sm rounded-3xl z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-[#473C1A]">
                <span className="w-10 h-10 border-4 border-[#473C1A]/30 border-t-[#473C1A] rounded-full animate-spin"></span>
                <p className="text-sm tracking-wide">
                  Signing you in securely…
                </p>
              </div>
            </div>
          )}

          <img
            src={ChippyLogo}
            alt="Chippy Inn Logo"
            className="w-12 h-12 min-[1500px]:w-20 min-[1500px]:h-20 mx-auto mb-4 min-[1500px]:mb-6"
          />

          <h2 className="text-lg min-[1500px]:text-2xl font-normal text-black mb-4 min-[1500px]:mb-6 text-center">
            Log in to your account
          </h2>

          {/* 🌟 GOOGLE BUTTON — UNCHANGED */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className={`relative flex items-center justify-center w-full gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 mb-4
              ${
                isSigningIn
                  ? "bg-[#E8D7A1] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#FFB733] to-[#FFA500] hover:shadow-xl hover:scale-[1.03]"
              }
            `}
          >
            <img src={GoogleLogo} alt="Google" className="w-5 h-5" />
            <span className="tracking-wide text-black">
              Continue with Google
            </span>
          </button>

          <div className="flex items-center gap-2 my-4">
            <hr className="flex-1 border-gray-300" />
            <span className="text-black text-xs">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB733]"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB733]"
                required
              />
              <span
                className="absolute right-3 top-3 cursor-pointer text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>

            <div className="text-right -mt-2 mb-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FFB733] py-3 rounded-lg hover:bg-[#FFA500] transition"
            >
              Sign in
            </button>
          </form>

          <p className="text-center text-black text-sm mt-6">
            Only verified staff can access this portal.
          </p>
        </div>
      </div>

      <div
        className="hidden lg:flex flex-[0_0_70%] bg-cover bg-center relative z-10"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <div className="absolute inset-0 bg-[#473C1A]/30 animate-pulse-slow"></div>
      </div>

      <style>
        {`
          @keyframes pulse-slow {
            0%,100%{opacity:.3}
            50%{opacity:.15}
          }
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default StaffLogin;
