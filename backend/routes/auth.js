import { Router } from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,          // เปิด true เมื่อใช้ HTTPS ใน production
    sameSite: isProd ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    path: "/",
  });
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });

  try {
    const [dup] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (dup.length) return res.status(409).json({ message: "email already used" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name || null, email, hash]
    );

    const user = { id: result.insertId, name: name || null, email };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });

  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: "invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "invalid credentials" });

    const payload = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);
    res.json({ user: payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "unauthenticated" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: payload });
  } catch {
    res.status(401).json({ message: "invalid token" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "logged out" });
});

export default router;
