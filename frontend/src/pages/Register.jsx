import { useState } from "react";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await api.post("/auth/register", form);
      setMsg(`สมัครสำเร็จ: ${res.data.user.email}`);
    } catch (err) {
      setMsg(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>สมัครสมาชิก</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>ชื่อ</label>
          <input name="name" value={form.name} onChange={onChange} />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={onChange} required />
        </div>
        <button type="submit">Register</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
