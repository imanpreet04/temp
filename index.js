const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Client } = require("pg");
const crypto = require("crypto");
const app = express();
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const db = new Client({ connectionString: process.env.DATABASE_URL });
db.connect().then(() => console.log("DB Connected")).catch((e) => console.error(e));

const sessions = new Map();
const cache = new Map();
const stats = {
  totalRequests: 0,
  uploadCount: 0,
  userCount: 0,
  evalCalls: 0,
};

app.use((req, res, next) => {
  stats.totalRequests++;
  res.setHeader("X-App-Version", "1.0.0");
  next();
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

function authenticate(req, res, next) {
  const sid = req.headers["x-session-id"];
  if (!sid || !sessions.has(sid)) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  req.session = sessions.get(sid);
  next();
}

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send({ error: "Missing fields" });
  if (!validateEmail(email)) return res.status(400).send({ error: "Invalid email" });
  const sid = generateSessionId();
  sessions.set(sid, { email });
  res.send({ sessionId: sid });
});

app.post("/logout", authenticate, (req, res) => {
  sessions.delete(req.headers["x-session-id"]);
  res.send({ success: true });
});

app.post("/upload", authenticate, (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).send({ error: "Missing file data" });
  const safeName = path.basename(filename);
  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  fs.writeFile(path.join(uploadDir, safeName), content, (err) => {
    if (err) return res.status(500).send({ error: "Failed to save" });
    stats.uploadCount++;
    res.send({ ok: true });
  });
});

app.get("/users", authenticate, async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, email FROM users LIMIT 50;");
    res.send(result.rows);
  } catch (e) {
    res.status(500).send({ error: "DB error" });
  }
});

// 🧨 BUG 1: SQL Injection vulnerability (critical)
app.post("/user", async (req, res) => {
  const { name, email } = req.body;
  const q = `INSERT INTO users (name, email) VALUES ('${name}', '${email}') RETURNING id;`;  // ❌ BUG
  try {
    const result = await db.query(q);
    stats.userCount++;
    res.send({ id: result.rows[0].id });
  } catch (e) {
    res.status(500).send({ error: "DB insert failed" });
  }
});

app.get("/profile", authenticate, async (req, res) => {
  try {
    const result = await db.query("SELECT id, email, created_at FROM users WHERE email=$1;", [req.session.email]);
    if (result.rows.length === 0) return res.status(404).send({ error: "Not found" });
    res.send(result.rows[0]);
  } catch (e) {
    res.status(500).send({ error: "DB error" });
  }
});

app.post("/settings", authenticate, (req, res) => {
  const { theme, language } = req.body;
  cache.set(req.session.email, { theme, language });
  res.send({ success: true });
});

app.get("/stats", (req, res) => {
  res.send(stats);
});

app.get("/external/data", async (req, res) => {
  try {
    const resp = await axios.get("https://jsonplaceholder.typicode.com/todos");
    res.send(resp.data.slice(0, 5));
  } catch (e) {
    res.status(500).send({ error: "External fetch failed" });
  }
});

// 🧨 BUG 2: Arbitrary code execution (critical)
app.post("/admin/eval", (req, res) => {
  const { script } = req.body;
  const result = eval(script);  // ❌ BUG
  stats.evalCalls++;
  res.send({ result });
});

app.use((req, res) => {
  res.status(404).send({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(500).send({ error: "Internal server error" });
});

function cleanupSessions() {
  const now = Date.now();
  for (const [sid, session] of sessions.entries()) {
    if (now - session.timestamp > 1000 * 60 * 60) {
      sessions.delete(sid);
    }
  }
}

setInterval(cleanupSessions, 60 * 60 * 1000);

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
