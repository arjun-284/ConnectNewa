const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Event = require('../models/Event');



// File storage config (images saved to /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });


// Create event (organizer)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location, price, createdBy } = req.body;
    if (!title || !date || !createdBy) {
      return res.status(400).json({ error: "Title, date, and createdBy are required" });
    }
    const event = new Event({
      title,
      description,
      date,
      location,
      price,
      createdBy,
      status: 'pending',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : ''
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// List approved events (public)
router.get('/approved', async (req, res) => {
  const approved = await Event.find({ status: 'approved' });
  res.json(approved);
});

// List pending events (for admin)
router.get('/pending', async (req, res) => {
  const pending = await Event.find({ status: 'pending' });
  res.json(pending);
});

// Approve event (admin)
router.patch('/approve/:id', async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status: 'approved' },
    { new: true }
  );
  res.json(event);
});

// Reject event (admin)
router.patch('/reject/:id', async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected' },
    { new: true }
  );
  res.json(event);
});

// Serve uploaded images
router.use('/uploads', express.static('uploads'));

// List events created by organizer (for organizer dashboard)
router.get('/createdby/:organizerId', async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.params.organizerId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
