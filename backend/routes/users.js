const express = require('express');
const mongoose = require('mongoose');
const Employ = require('../models/Employ');
const router = express.Router();




// Only return users, not organizers, contributors, or admins
router.get('/', async (req, res) => {
  const users = await Employ.find({ role: { $in: ["user", "organizer", "contributor"] } });
  res.json(users);
});



const PUBLIC_FIELDS = '-password -__v';

/* List */
router.get('/', async (req, res) => {
  try {
    const users = await Employ.find().select(PUBLIC_FIELDS).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    console.error('GET /api/users error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Read one */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const u = await Employ.findById(id).select(PUBLIC_FIELDS);
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* Update (PATCH) */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  // whitelist updatable fields
  const { name, email, role, photoUrl, isActive } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = String(name).trim();
  if (email !== undefined) update.email = String(email).trim().toLowerCase();
  if (role !== undefined) update.role = String(role).trim();
  if (photoUrl !== undefined) update.photoUrl = String(photoUrl).trim();
  if (isActive !== undefined) update.isActive = !!isActive;

  try {
    const updated = await Employ.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true, context: 'query' }
    ).select(PUBLIC_FIELDS);

    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: updated });
  } catch (e) {
    console.error('PATCH /api/users/:id error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Delete */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    const deleted = await Employ.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, id, message: 'User deleted' });
  } catch (e) {
    console.error('DELETE /api/users/:id error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

