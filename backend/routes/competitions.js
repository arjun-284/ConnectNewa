// backend/routes/competitions.js
const express = require('express');
const mongoose = require('mongoose');
const Competition = require('../models/Competition');

const router = express.Router();

/** GET /competitions?organizerId=... */
router.get('/', async (req, res) => {
  try {
    const organizerId = req.query.organizerId || req.query.organizer || req.query.createdBy;
    const q = organizerId ? { organizerId: new mongoose.Types.ObjectId(String(organizerId)) } : {};

    const comps = await Competition.find(q)
      .sort({ createdAt: -1 })
      .populate('competitor1 competitor2 winner');

    res.json(comps);
  } catch (e) {
    console.error('GET /competitions failed:', e);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

/** PATCH /competitions/:id/winner { winnerId, prize } */
router.patch('/:id/winner', async (req, res) => {
  try {
    const { winnerId, prize = 0 } = req.body || {};
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Competition not found' });

    comp.winner = winnerId || null;
    comp.prize = Number(prize) || 0;
    comp.status = 'completed';

    await comp.save();
    const populated = await Competition.findById(comp._id)
      .populate('competitor1 competitor2 winner');

    res.json(populated);
  } catch (e) {
    console.error('PATCH /competitions/:id/winner failed:', e);
    res.status(500).json({ error: 'Failed to update winner' });
  }
});

module.exports = router;
