// backend/routes/bookings.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Employ = require('../models/Employ');
const { Competitor } = require('../models/Employ'); // or: const Competitor = require('../models/Competitor');
const Booking = require('../models/Booking');        // ✅ singular file name
const Competition = require('../models/Competition');

function toDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/* Create booking (organizer -> competitor) */
router.post('/', async (req, res) => {
  try {
    const { organizerId, competitorId, date, amount = 0, notes = '' } = req.body || {};
    if (!organizerId || !competitorId || !date) {
      return res.status(400).json({ error: 'organizerId, competitorId and date are required' });
    }

    const when = toDate(date);
    if (!when) return res.status(400).json({ error: 'Invalid date' });

    // Optional FK checks
    const [org, comp] = await Promise.all([
      Employ.findById(organizerId).select('_id'),
      Competitor.findById(competitorId).select('_id'),
    ]);
    if (!org)  return res.status(404).json({ error: 'Organizer not found' });
    if (!comp) return res.status(404).json({ error: 'Competitor not found' });

    // prevent double-booking same competitor same day while pending/accepted
    const start = new Date(when); start.setHours(0,0,0,0);
    const end   = new Date(when); end.setHours(23,59,59,999);
    const clash = await Booking.findOne({
      competitorId,
      date:   { $gte: start, $lte: end },
      status: { $in: ['pending', 'accepted'] },
    });
    if (clash) return res.status(409).json({ error: 'Competitor already has a booking for that date' });

    const created = await Booking.create({
      organizerId,
      competitorId,
      date: when,
      amount: Number(amount) || 0,
      notes: String(notes || ''),
      status: 'pending',
      matched: false,
      competitionId: null,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('POST /bookings error:', err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

/* List bookings (filter by organizerId or competitorId) */
router.get('/', async (req, res) => {
  try {
    const { organizerId, competitorId } = req.query || {};
    const q = {};
    if (organizerId)  q.organizerId  = new mongoose.Types.ObjectId(String(organizerId));
    if (competitorId) q.competitorId = new mongoose.Types.ObjectId(String(competitorId));

    const list = await Booking.find(q).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error('GET /bookings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Competitor responds (accept / reject)
 * NOTE: this path MUST be '/:id' (router mounted at '/bookings').
 * Also contains the pairing logic (create Competition when two accepted).
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 1) update status
    const b = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!b) return res.status(404).json({ error: 'Booking not found' });

    // 2) on acceptance, try to pair & create a competition
    if (status === 'accepted' && !b.matched) {
      const other = await Booking.findOne({
        _id:          { $ne: b._id },
        organizerId:  b.organizerId,
        status:       'accepted',
        matched:      false,
        competitorId: { $ne: b.competitorId }, // ensure different competitor
      }).sort({ createdAt: 1 });

      if (other) {
        const comp = await Competition.create({
          organizerId: b.organizerId,
          competitor1: b.competitorId,
          competitor2: other.competitorId,
          date:        b.date || other.date || new Date(),
          status:      'pending',
          prize:       0,
        });

        await Booking.updateMany(
          { _id: { $in: [b._id, other._id] } },
          { matched: true, competitionId: comp._id }
        );
      }
    }

    res.json(b);
  } catch (e) {
    console.error('PATCH /bookings/:id error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
