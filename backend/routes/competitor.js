// backend/routes/competitor.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// If Competitor is merged inside Employ.js (as we set earlier):
const { Competitor } = require('../models/Employ');
// OR: const Competitor = require('../models/Competitor');

/* -------------------- helpers -------------------- */
const isValidId = (v) => mongoose.Types.ObjectId.isValid(String(v));

function toArrayCSV(v) {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
function toDateArray(v) {
  return toArrayCSV(v).map((d) => new Date(d));
}

// Map UI labels → backend enum ['food','dance','music','art','other']
function mapUiToEnum(ui) {
  const v = String(ui || '').trim().toLowerCase();
  if (['food', 'foods', 'chef', 'cook'].includes(v)) return 'food';
  if (v === 'dance') return 'dance';
  if (v === 'music' || v === 'band') return 'music';
  if (v === 'drama' || v === 'comedy' || v === 'art') return 'art';
  return 'other';
}

/* -------------------- CREATE -------------------- */
// POST /api/competitors
// Body must include: createdBy (Employ._id), groupName, etc.
// Enforces: ONE competitor per createdBy.
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};

    // 1) require & validate createdBy
    const createdBy = b.createdBy;
    if (!createdBy || !isValidId(createdBy)) {
      return res.status(400).json({ error: 'createdBy (valid user id) is required' });
    }

    // 2) enforce single profile per user
    const existing = await Competitor.findOne({ createdBy });
    if (existing) {
      return res.status(409).json({
        error: 'Competitor profile already exists for this user',
        existing,
      });
    }

    // 3) normalize arrays / enums
    // Accept either "competitionTypes" array directly or UI "category"/"competitions" strings
    let competitionTypes = [];
    if (b.competitionTypes) {
      competitionTypes = toArrayCSV(b.competitionTypes).map(mapUiToEnum);
    } else if (b.category) {
      competitionTypes = [mapUiToEnum(b.category)];
    }
    // also merge optional comma list "competitions"
    if (b.competitions) {
      competitionTypes = [
        ...new Set([...competitionTypes, ...toArrayCSV(b.competitions).map(mapUiToEnum)]),
      ];
    }

    const payload = {
      createdBy,
      groupName: b.groupName,
      teamName: b.teamName || '',
      description: b.description || '',
      competitionTypes,

      functions: toArrayCSV(b.functions),
      performances: toArrayCSV(b.performances),

      members: Number(b.members || 1),
      location: b.location || '',
      contact: b.contact || '',
      rate: Number(b.rate || 0),

      availableDates: Array.isArray(b.availableDates)
        ? b.availableDates.map((d) => new Date(d))
        : toDateArray(b.availableDates),

      status: b.status || 'active',
      photoUrl: b.photoUrl || '',
      socialLinks: b.socialLinks || undefined,
    };

    const doc = await Competitor.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    // friendly duplicate key message (e.g., unique index on createdBy)
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Competitor already exists for this user', key: err.keyValue });
    }
    res.status(400).json({ error: err.message });
  }
});

/* -------------------- LIST (with filters) -------------------- */
// GET /api/competitors?q=...&category=...&location=...&minRate=...&maxRate=...
// category can be UI label; we map to enum before filtering.
router.get('/', async (req, res) => {
  try {
    const { q, category, location, minRate, maxRate } = req.query;
    const query = {};

    if (q) {
      query.$or = [
        { groupName: { $regex: q, $options: 'i' } },
        { teamName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { functions: { $regex: q, $options: 'i' } },
        { performances: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      const enumVal = mapUiToEnum(category);
      // stored as array field `competitionTypes`
      query.competitionTypes = enumVal;
    }

    if (location) query.location = { $regex: location, $options: 'i' };

    if (minRate || maxRate) {
      query.rate = {};
      if (minRate) query.rate.$gte = Number(minRate);
      if (maxRate) query.rate.$lte = Number(maxRate);
    }

    const list = await Competitor.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- READ: my profile by user -------------------- */
// GET /api/competitors/by-user/:userId
// Returns single competitor doc for a given createdBy (or 404 if none)
router.get('/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const doc = await Competitor.findOne({ createdBy: userId });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* -------------------- READ ONE -------------------- */
// GET /api/competitors/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Competitor.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* -------------------- UPDATE -------------------- */
// PATCH /api/competitors/:id
// (Optional) You can add auth check here to ensure only owner (createdBy) updates.
router.patch('/:id', async (req, res) => {
  try {
    const b = req.body || {};
    const updates = { ...b };

    // normalize known array fields if present
    if (b.competitionTypes !== undefined)
      updates.competitionTypes = toArrayCSV(b.competitionTypes).map(mapUiToEnum);
    if (b.functions !== undefined) updates.functions = toArrayCSV(b.functions);
    if (b.performances !== undefined) updates.performances = toArrayCSV(b.performances);
    if (b.availableDates !== undefined) {
      updates.availableDates = Array.isArray(b.availableDates)
        ? b.availableDates.map((d) => new Date(d))
        : toDateArray(b.availableDates);
    }
    if (b.category && (!b.competitionTypes || !b.competitionTypes.length)) {
      // allow UI 'category' to update competitionTypes when competitionTypes missing
      updates.competitionTypes = [mapUiToEnum(b.category)];
    }

    const doc = await Competitor.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* -------------------- DELETE -------------------- */
// DELETE /api/competitors/:id
// (Optional) Add auth check to allow only owner to delete.
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Competitor.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, deletedId: doc._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
