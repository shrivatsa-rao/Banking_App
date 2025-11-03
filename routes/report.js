import express from "express";
import { pool } from "../db.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateJWT);

router.get("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT income, expense, month FROM sample_report WHERE userId = ? ORDER BY id DESC LIMIT 1",
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "No report data found" });

    const { income, expense, month } = rows[0];
    const savings = income - expense;

    res.json({
      month,
      totalIncome: income,
      totalExpense: expense,
      netSavings: savings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
