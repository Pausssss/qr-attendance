import axios from "axios";

// Ưu tiên env: VITE_API_BASE_URL
// Nếu không có env:
// - local dev: http://localhost:8080 (Spring Boot)
// - production: Render backend mặc định (đổi lại nếu bạn deploy backend nơi khác)
const inferredBaseUrl =
  typeof window !== "undefined" && window.location?.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://qr-attendance-s4jr.onrender.com";

const baseURL = (import.meta.env.VITE_API_BASE_URL || inferredBaseUrl).replace(
  /\/+$/,
  ""
);

const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("qr_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
