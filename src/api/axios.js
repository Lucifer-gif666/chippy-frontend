import axios from "axios";

let isLoggingOut = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false, // ✅ FIXED
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;

      localStorage.removeItem("token");
      localStorage.removeItem("currentStaff");
      localStorage.setItem("sessionExpired", "true");

      window.location.href = "/staff-login";
    }

    return Promise.reject(error);
  }
);

export default api;
