const http = require("http");
const mysql = require("mysql2/promise");
const crypto = require("crypto");

const PORT = 5000;

// เชื่อมต่อ DB
const pool = mysql.createPool({
  host: process.env.DB_HOST || "database",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "@Kan11113@05110405",
  database: process.env.DB_NAME || "ku-grade",
});

// helper อ่าน body
async function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// สร้าง server
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Register
  if (req.url === "/api/auth/register" && req.method === "POST") {
    try {
      const { email, password, name } = await getRequestBody(req);

      if (!email || !password) {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "Missing fields" }));
      }

      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      const conn = await pool.getConnection();
      await conn.query(
        "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
        [email, hashedPassword, name || null]
      );
      conn.release();

      res.writeHead(201);
      res.end(JSON.stringify({ message: "User registered" }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ message: "Error registering", error: err.message }));
    }
    return;
  }

  // Login
  if (req.url === "/api/auth/login" && req.method === "POST") {
    try {
      const { email, password } = await getRequestBody(req);

      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      const conn = await pool.getConnection();
      const [rows] = await conn.query(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, hashedPassword]
      );
      conn.release();

      if (rows.length > 0) {
        res.writeHead(200);
        res.end(JSON.stringify({ message: "Login successful" }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ message: "Invalid credentials" }));
      }
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ message: "Error logging in", error: err.message }));
    }
    return;
  }

  // Default
  res.writeHead(404);
  res.end(JSON.stringify({ message: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
