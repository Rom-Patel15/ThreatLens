import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tl_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);
