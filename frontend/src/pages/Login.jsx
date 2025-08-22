import { useState } from "react";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await api.post("/auth/login", form);
      setMsg(`สวัสดี ${res.data.user.name || res.data.user.email}`);
      // ไม่ต้องเก็บ token: อยู่ใน httpOnly cookie แล้ว
    } catch (err) {
      setMsg(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={onChange} required />
        </div>
        <button type="submit">Login</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
