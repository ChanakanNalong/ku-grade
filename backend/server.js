require("dotenv").config();

const http = require("http");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 5000;

// ---- config / secrets from env only (no hardcoded credentials) ----
if (!process.env.DB_PASSWORD) {
  console.error("FATAL: DB_PASSWORD is not set (check backend/.env or compose env)");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "database",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "ku-grade",
});

// ---- hardening knobs ----
const MAX_BODY_BYTES = 10 * 1024; // 10 KB — kills oversized-body DoS
const BCRYPT_ROUNDS = 10;
const RL_MAX = 5; // max login attempts...
const RL_WINDOW_MS = 60 * 1000; // ...per IP per 60s
// dummy hash so "user not found" takes the same time as "wrong password"
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

// ---- in-memory rate limiter (per client IP) ----
const attempts = new Map(); // ip -> { count, first }
function rateLimited(ip) {
  const now = Date.now();
  let rec = attempts.get(ip);
  if (!rec || now - rec.first > RL_WINDOW_MS) {
    rec = { count: 0, first: now };
    attempts.set(ip, rec);
  }
  rec.count += 1;
  return rec.count > RL_MAX;
}

// ---- body reader with hard size cap ----
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    let aborted = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        aborted = true;
        const e = new Error("Payload too large");
        e.code = "TOO_LARGE";
        req.destroy();
        reject(e);
        return;
      }
      body += chunk.toString();
    });
    req.on("end", () => {
      if (aborted) return;
      try {
        resolve(JSON.parse(body));
      } catch {
        const e = new Error("Bad JSON");
        e.code = "BAD_JSON";
        reject(e);
      }
    });
    req.on("error", (e) => !aborted && reject(e));
  });
}

function send(res, code, obj) {
  res.writeHead(code);
  res.end(JSON.stringify(obj));
}

// Reject oversized uploads up front using the declared Content-Length,
// so a huge body is refused with a clean 413 before we read/buffer it.
function tooLargeByHeader(req, res) {
  const len = parseInt(req.headers["content-length"] || "0", 10);
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
    send(res, 413, { message: "Payload too large" });
    req.destroy();
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const ip = req.socket.remoteAddress || "unknown";

  // ---------- Register ----------
  if ((req.url === "/api/auth/register" || req.url === "/api/register") && req.method === "POST") {
    if (tooLargeByHeader(req, res)) return;
    try {
      const { email, password, name } = await getRequestBody(req);
      if (!email || !password) return send(res, 400, { message: "Missing fields" });

      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      try {
        const conn = await pool.getConnection();
        await conn.query(
          "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
          [email, hashed, name || null]
        );
        conn.release();
      } catch (dbErr) {
        // Anti-enumeration: a duplicate email returns the SAME response as success.
        if (dbErr.code !== "ER_DUP_ENTRY") throw dbErr;
      }
      // identical response whether the email was new or already existed
      return send(res, 201, { message: "User registered" });
    } catch (err) {
      if (err.code === "TOO_LARGE") return send(res, 413, { message: "Payload too large" });
      if (err.code === "BAD_JSON") return send(res, 400, { message: "Invalid request" });
      console.error("register error:", err.message); // logged, never sent to client
      return send(res, 500, { message: "Internal server error" });
    }
  }

  // ---------- Login ----------
  if ((req.url === "/api/auth/login" || req.url === "/api/login") && req.method === "POST") {
    if (tooLargeByHeader(req, res)) return;
    if (rateLimited(ip)) {
      res.setHeader("Retry-After", "60");
      return send(res, 429, { message: "Too many attempts, try again later" });
    }
    try {
      const { email, password } = await getRequestBody(req);
      if (!email || !password) return send(res, 400, { message: "Missing fields" });

      const conn = await pool.getConnection();
      const [rows] = await conn.query("SELECT password FROM users WHERE email = ?", [email]);
      conn.release();

      const hash = rows.length > 0 ? rows[0].password : DUMMY_HASH;
      const ok = await bcrypt.compare(password, hash);

      if (rows.length > 0 && ok) return send(res, 200, { message: "Login successful" });
      return send(res, 401, { message: "Invalid credentials" });
    } catch (err) {
      if (err.code === "TOO_LARGE") return send(res, 413, { message: "Payload too large" });
      if (err.code === "BAD_JSON") return send(res, 400, { message: "Invalid request" });
      console.error("login error:", err.message);
      return send(res, 500, { message: "Internal server error" });
    }
  }

  return send(res, 404, { message: "Not Found" });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
