import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const SALT_ROUNDS = 10;

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email and password required" });

  const conn = await pool.getConnection();
  try {
    // check user exists
    const [rows] = await conn.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length)
      return res.status(409).json({ message: "Email already Present" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await conn.execute(
      "INSERT INTO users (email, passwordHash) VALUES (?, ?)",
      [email, passwordHash]
    );
    const userId = result.insertId;

    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  } finally {
    conn.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT id, passwordHash FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid Creds" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid Creds" });

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
