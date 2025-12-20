import axios from "axios";

// NOTE:
// - All API calls in this frontend are written like: api.get('/api/...')
// - Therefore baseURL MUST be the server root (NOT ending with /api)
//   to avoid /api/api/... duplication.
const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("qr_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
