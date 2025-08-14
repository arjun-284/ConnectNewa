const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// --- 1. Approve a commission transaction ---
// Approve commission transaction by ID
router.put('/approve/:id', async (req, res) => {
  try {
    const t = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!t) return res.status(404).json({ success: false, error: "Transaction not found" });
    res.json({ success: true, transaction: t });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 2. Get all admin commission transactions ---
// GET /api/transactions/admin-commissions
router.get('/admin-commissions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ type: "organizer_to_admin" })
      .populate({ path: "from", model: "Employ", select: "name email" })   // Organizer info
      .populate({
        path: "ticket",
        populate: { path: "event", select: "title date" }
      });

    // Format for frontend
    res.json({
      transactions: transactions.map(tr => ({
        ...tr.toObject(),
        organizer: tr.from,
        event: tr.ticket?.event
      }))
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch admin commissions" });
  }
});

module.exports = router;
