import axios from "axios";

// 🚨 prevent multiple redirects
let isLoggingOut = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ✅ ATTACH TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ AUTO LOGOUT ON SESSION TIMEOUT / 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 && !isLoggingOut) {
      isLoggingOut = true;

      // 🧹 clear session
      localStorage.removeItem("currentStaff");
      localStorage.removeItem("token");

      // 📢 optional flag for toast
      localStorage.setItem("sessionExpired", "true");

      // 🧭 SPA-friendly redirect
      setTimeout(() => {
        window.location.href = "/staff-login";
      }, 100);
    }

    return Promise.reject(error);
  }
);

export default api;
