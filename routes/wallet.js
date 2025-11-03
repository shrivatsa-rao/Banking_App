import express from "express";
import { pool } from "../db.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

// POST /api/wallets
router.post("/", async (req, res) => {
  const { name, initialBalance } = req.body;
  if (!name) return res.status(400).json({ message: "Wallet name required" });

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.execute(
      "INSERT INTO wallets (userId, name, balance) VALUES (?, ?, ?)",
      [req.user.id, name, Number(initialBalance || 0)]
    );
    const walletId = result.insertId;
    const [rows] = await conn.execute("SELECT * FROM wallets WHERE id = ?", [
      walletId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

// GET /api/wallets
router.get("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT id, name, balance FROM wallets WHERE userId = ?",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

// DELETE /api/wallets/:walletId
router.delete("/:walletId", async (req, res) => {
  const walletId = Number(req.params.walletId);
  const conn = await pool.getConnection();
  try {
    // Ensure wallet belongs to user
    const [w] = await conn.execute(
      "SELECT id FROM wallets WHERE id = ? AND userId = ?",
      [walletId, req.user.id]
    );
    if (!w.length) return res.status(404).json({ message: "Wallet not found" });

    // Delete wallet (cascade will remove transactions)
    await conn.execute("DELETE FROM wallets WHERE id = ?", [walletId]);
    res.json({ message: "Wallet deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
