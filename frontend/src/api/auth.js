// frontend/src/api/auth.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: false
});

export async function register(email, password, name) {
  try {
    const res = await api.post("/api/auth/register", { email, password, name });
    return res.data;
  } catch (err) {
    // ป้องกัน undefined error
    const msg = err.response?.data?.message || err.message || "Register failed";
    throw new Error(msg);
  }
}

export async function login(email, password) {
  try {
    const res = await api.post("/api/auth/login", { email, password });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Login failed";
    throw new Error(msg);
  }
}
