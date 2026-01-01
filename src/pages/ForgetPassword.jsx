import React, { useState } from "react";
import axios from "axios";

// ✅ API base URL from Vite env
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // 🔥 NEW

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔒 Prevent multiple submits
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email }
      );

      setMessage(res.data.message);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">
          Forgot Password
        </h2>

        <p className="text-center text-gray-600 mb-6">
          Enter your email to reset your password
        </p>

        {message && (
          <p className="text-green-600 mb-4 text-center">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={loading} // 🔒 lock input while sending
          />

          <button
            type="submit"
            disabled={loading} // 🔒 disable button
            className={`w-full py-2 rounded transition transform
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]"
              }`}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
