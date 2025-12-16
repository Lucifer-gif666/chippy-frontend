// src/pages/StaffLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import GoogleLogo from "../assets/icons8-google-logo-48.png";
import ChippyLogo from "../assets/image-removebg-preview.png";
import BgImage from "../assets/868ae689-5098-45a2-a634-ec7b996cf467.jpg";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const StaffLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ⭐ Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const res = await fetch("http://localhost:5000/api/auth/google-login", {
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
        return;
      }

      if (res.status === 201 && data.message.includes("waiting")) {
        alert(data.message); // Staff not verified yet
        return;
      }

      // ✅ Use the new needsPassword flag
      if (data.needsPassword) {
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("currentStaff", JSON.stringify(data.user));
        navigate("/set-password");
        return;
      }

      // Normal login flow
      if (res.status === 200 || res.status === 201) {
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("currentStaff", JSON.stringify(data.user));
        navigate("/staff-dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Google login failed. Try again.");
    }
  };

  // ⭐ Handle Email Login
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(  `${import.meta.env.VITE_API_URL}/api/auth/login`, {
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
      console.error(err);
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
        <div className="w-full max-w-sm bg-white p-6 min-[1500px]:p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transform transition duration-300 border border-gray-300">
          <img src={ChippyLogo} alt="Chippy Inn Logo" className="w-12 h-12 min-[1500px]:w-20 min-[1500px]:h-20 mx-auto mb-4 min-[1500px]:mb-6" />
          <h2 className="text-lg min-[1500px]:text-2xl font-normal text-black mb-4 min-[1500px]:mb-6 text-center">
            Log in to your account
          </h2>

          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center w-full gap-2 min-[1500px]:gap-3 px-4 min-[1500px]:px-6 py-2 min-[1500px]:py-3 border border-gray-300 rounded-lg bg-[#FFB733] hover:bg-[#FFA500] text-black font-medium text-sm min-[1500px]:text-base hover:scale-105 transition transform mb-4"
          >
            <img src={GoogleLogo} alt="Google logo" className="w-5 h-5 min-[1500px]:w-6 min-[1500px]:h-6" />
            <span>Sign in with Google</span>
          </button>

          <div className="flex items-center gap-2 my-4">
            <hr className="flex-1 border-gray-300" />
            <span className="text-black text-xs min-[1500px]:text-sm">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4 relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB733] text-black"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB733] text-black"
                required
              />
              <span
                className="absolute right-3 top-3 cursor-pointer text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
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
              className="w-full bg-[#FFB733] text-black py-3 rounded-lg font-medium hover:bg-[#FFA500] hover:scale-105 transition transform"
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
        className="hidden lg:flex flex-[0_0_70%] bg-cover bg-center relative z-10 transition-transform duration-500 hover:scale-102"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <div className="absolute inset-0 bg-[#473C1A]/30 animate-pulse-slow"></div>
        <div className="absolute bottom-13 left-10 text-white">
          <h3 className="text-3xl font-bold mb-2">Welcome to Chippy Inn</h3>
          <p className="max-w-xs text-White-00">
            Securely manage your tickets, staffs and zones.
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.15; }
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
