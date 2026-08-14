import axios from "axios";

const getBackendUrl = () => {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.VITE_BACKEND_URL || "http://localhost:4000";
  }
  return "http://localhost:4000";
};

export const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});
