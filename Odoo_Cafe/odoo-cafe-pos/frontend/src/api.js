import axios from "axios";
import { getToken, logout } from "./auth";

// Determine API base URL based on environment
// In development: http://localhost:8000
// In production: can be set via window.ODOO_API_URL or REACT_APP_API_URL env var
const getBaseURL = () => {
  // 1. Check window variable (can be set by index.html)
  if (typeof window !== "undefined" && window.ODOO_API_URL) {
    return window.ODOO_API_URL;
  }
  
  // 2. Check environment variable from build
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 3. Check if running on different port
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }
  
  // 4. Default to same host (for production)
  return `${window.location.protocol}//${window.location.host}`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err?.config?.url ?? "";
    if (err?.response?.status === 401 && !url.startsWith("/auth")) {
      // Debounce: only redirect once, not for every concurrent 401 response
      if (!window._loggingOut) {
        window._loggingOut = true;
        logout();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
export { getBaseURL };
