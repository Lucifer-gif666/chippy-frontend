// src/api/axiosPatch.js
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true; // optional

export default axios;
