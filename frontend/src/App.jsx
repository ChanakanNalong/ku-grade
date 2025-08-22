import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import api from "./api";
import { useEffect, useState } from "react";

export default function App() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        setMe(res.data.user);
      } catch { /* not logged in */ }
    })();
  }, []);

  const logout = async () => {
    await api.post("/auth/logout");
    setMe(null);
  };

  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 12, padding: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        {me && <button onClick={logout}>Logout</button>}
        <span style={{ marginLeft: "auto" }}>
          {me ? `👋 ${me.name || me.email}` : "ยังไม่ล็อกอิน"}
        </span>
      </nav>
      <Routes>
        <Route path="/" element={<div style={{ padding: 24 }}>หน้าแรก</div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
