// src/pages/SetPassword.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import ChippyLogo from "../assets/image-removebg-preview.png";
import BgImage from "../assets/868ae689-5098-45a2-a634-ec7b996cf467.jpg";

const SetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  // Get logged-in user from localStorage (Google login)
  const user = JSON.parse(localStorage.getItem("currentStaff"));

  useEffect(() => {
    if (!user) {
      setMessage("No user found. Redirecting to login...");
      setTimeout(() => navigate("/staff-login"), 2000);
    } else if (user.password) {
      navigate("/staff-dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/set-password`, {
        email: user.email,
        password,
      });

      setMessage(res.data.message);

      // Update localStorage user
      const updatedUser = { ...user, password: "set" };
      localStorage.setItem("currentStaff", JSON.stringify(updatedUser));

      // Redirect to login after 2s
      setTimeout(() => navigate("/staff-login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <div
      className="staff-login-page min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundImage: `url(${BgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#473C1A]/20 animate-pulse-slow"></div>

      {/* Center Card */}
      <div className="login-card relative z-10 w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-300 transition transform hover:scale-105">
        <img src={ChippyLogo} alt="Chippy Logo" className="w-20 h-20 mx-auto mb-6" />

        <h2 className="text-3xl font-bold text-center text-black mb-2">
          Hi {user?.name || "User"}!
        </h2>

        <p className="text-center text-gray-700 mb-4">
          Please set a password to securely access your{" "}
          <span className="font-semibold">
            {user?.role === "admin" ? "admin" : "staff"} account
          </span>{" "}
          and manage tickets.
        </p>

        {message && <p className="text-red-600 text-center mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
         {/* Password */}
<div className="password-wrapper relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Enter new password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB733] text-black"
    required
  />
  <span
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-3 cursor-pointer text-gray-600"
  >
    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
  </span>
  {/* Professional hint */}
  {password.length < 8 && (
    <p className="mt-1 text-sm text-gray-500">
      Password must be at least 8 characters.
    </p>
  )}
</div>


          {/* Confirm Password */}
          <div className="password-wrapper relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB733] text-black"
              required
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
            >
              {showConfirm ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FFB733] text-black py-3 rounded-lg font-medium hover:bg-[#FFA500] hover:scale-105 transition transform"
          >
            Save Password
          </button>
        </form>
      </div>

      {/* Pulse animation */}
      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.15; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }

          @media (max-width: 768px) {
            .login-card {
              max-width: 90%;
              padding: 2rem;
            }
            .staff-login-page h2 {
              font-size: 2rem;
            }
            .staff-login-page p {
              font-size: 0.95rem;
            }
          }
        `}
      </style>
    </div>
  );
};

export default SetPassword;
