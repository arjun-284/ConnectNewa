const express = require('express');
const router = express.Router();
const ExploreItem = require('../models/ExploreItem');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use uploads/explore directory
const uploadPath = 'uploads/explore';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Create with file/image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, desc, category, year, popularity, type } = req.body;
    // Only this line changes:
    const image = req.file ? `/uploads/explore/${req.file.filename}` : "";
    if (!title || !desc || !category) return res.status(400).json({ error: "Required fields missing" });
    const item = new ExploreItem({ title, desc, image, category, year, popularity, type });
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update (edit) with file/image (optional)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, desc, category, year, popularity, type } = req.body;
    let update = { title, desc, category, year, popularity, type };
    if (req.file) update.image = `/uploads/explore/${req.file.filename}`;
    const updated = await ExploreItem.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all items (public)
router.get('/', async (req, res) => {
  const items = await ExploreItem.find().sort({ createdAt: -1 });
  res.json(items);
});

// Delete (admin only)
router.delete('/:id', async (req, res) => {
  await ExploreItem.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
