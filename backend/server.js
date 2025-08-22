const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
import cookieParser from "cookie-parser";
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ตั้งค่า database connection
const db = mysql.createConnection({
  host: "localhost",     // ถ้าใช้ Docker อาจเป็น "mysql"
  user: "root",          // user ของคุณ
  password: "@Kan11113@05110405",  // ใส่รหัสจริงของ root
  database: "ku_grade"
});

// Route สมัครสมาชิก
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.query(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, hashedPassword],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "User registered!" });
    }
  );
});

// Route Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, "secretkey", {
      expiresIn: "1h"
    });

    res.json({ message: "Login successful", token });
  });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
