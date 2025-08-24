import axios from "axios";

// กำหนด base URL ของ backend
// สำหรับ develop: browser เรียก localhost:5000
const API_BASE_URL = "http://localhost:5000/api/auth";

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    // return data จาก backend
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    // return error message
    if (error.response) {
      // backend ส่ง response กลับ
      return { error: error.response.data.message || "Login failed" };
    } else {
      // network หรือ connection error
      return { error: "Cannot connect to server" };
    }
  }
};
