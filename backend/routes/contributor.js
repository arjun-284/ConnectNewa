const express = require('express');
const router = express.Router();
const ContributorSubmission = require('../models/ContributorSubmission');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// At the top
const uploadPath = 'uploads/contributor';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Then in your route...
router.post('/submit', upload.single('media'), async (req, res) => {
  try {
    const { title, body, submittedBy, type, references } = req.body;
    if (!title || !body || !submittedBy) {
      return res.status(400).json({ error: "title, body, and submittedBy are required" });
    }
    const mediaUrl = req.file ? `/uploads/contributor/${req.file.filename}` : undefined;
    const submission = new ContributorSubmission({
      title, body, mediaUrl, submittedBy, type, references
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// All posts with populated users for submittedBy, comments, and replies
router.get('/all', async (req, res) => {
  try {
    const posts = await ContributorSubmission.find() // <--- fetch ALL submissions
      .populate("submittedBy", "name email")
      .populate("comments.user", "name")
      .populate("comments.replies.user", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get('/byuser/:id', async (req, res) => {
  try {
    const submissions = await ContributorSubmission.find({ submittedBy: req.params.id });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Propose update to existing content
router.post('/propose-update', async (req, res) => {
  try {
    const { title, body, references, submittedBy } = req.body;
    if (!title || !body || !submittedBy) {
      return res.status(400).json({ error: "title, body, and submittedBy are required" });
    }
    const submission = new ContributorSubmission({
      title, body, references, submittedBy, type: 'update'
    });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/reject a submission (admin only)
router.patch('/review/:id', async (req, res) => {
  try {
    const { status, reviewComment } = req.body;
    const submission = await ContributorSubmission.findByIdAndUpdate(
      req.params.id,
      { status, reviewComment, updatedAt: new Date() },
      { new: true }
    );
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit submission (by owner, only if pending)
router.patch('/edit/:id', upload.single('media'), async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    if (req.file) {
      updates.mediaUrl = `/uploads/contributor/${req.file.filename}`;
    }
    // Only allow edit if status is pending
    const submission = await ContributorSubmission.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', submittedBy: req.body.submittedBy },
      updates,
      { new: true }
    );
    if (!submission) return res.status(403).json({ error: "Not allowed" });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete submission (by owner, only if pending)
router.delete('/delete/:id', async (req, res) => {
  try {
    const { submittedBy } = req.body;
    const submission = await ContributorSubmission.findOneAndDelete({
      _id: req.params.id,
      status: 'pending',
      submittedBy
    });
    if (!submission) return res.status(403).json({ error: "Not allowed" });
    res.json({ message: "Deleted", submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like/dislike (one action per user)
router.post('/like/:id', async (req, res) => {
  const { userId } = req.body;
  const post = await ContributorSubmission.findById(req.params.id);
  if (!post.likes.includes(userId) && !post.dislikes.includes(userId)) {
    post.likes.push(userId);
    await post.save();
  }
  res.json({ likes: post.likes.length });
});
router.post('/dislike/:id', async (req, res) => {
  const { userId } = req.body;
  const post = await ContributorSubmission.findById(req.params.id);
  if (!post.dislikes.includes(userId) && !post.likes.includes(userId)) {
    post.dislikes.push(userId);
    await post.save();
  }
  res.json({ dislikes: post.dislikes.length });
});

// Add comment
router.post('/comment/:id', async (req, res) => {
  const { userId, text } = req.body;
  try {
    const post = await ContributorSubmission.findById(req.params.id);
    post.comments.push({ user: userId, text });
    await post.save();
    await post.populate("comments.user", "name");
    await post.populate("comments.replies.user", "name");
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add reply to a comment (index is sent)
router.post('/reply/:id', async (req, res) => {
  const { commentIndex, userId, text } = req.body;
  try {
    const post = await ContributorSubmission.findById(req.params.id);
    if (!post.comments[commentIndex]) return res.status(404).json({ error: "Comment not found" });
    post.comments[commentIndex].replies.push({ user: userId, text });
    await post.save();
    await post.populate("comments.user", "name");
    await post.populate("comments.replies.user", "name");
    res.json(post.comments[commentIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
