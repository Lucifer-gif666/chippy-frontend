import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // keep this
});

// ✅ ATTACH TOKEN TO EVERY REQUEST
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

// ✅ AUTO LOGOUT ON 401 (KEEP THIS)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("currentStaff");
      localStorage.removeItem("token");
      window.location.replace("/staff-login");
    }
    return Promise.reject(error);
  }
);

export default api;
