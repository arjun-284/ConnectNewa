// routes/employ.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const Employ = require('../models/Employ');

// ---------- helpers ----------
function bad(res, msg) {
  return res.status(400).json({ error: msg });
}
function sanitize(user) {
  // password select:false भए पनि future-proof
  const { password, __v, ...safe } = user.toObject ? user.toObject() : user;
  return safe;
}

// ---------- Register (all roles) ----------
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'user',
      competitionType = null, // for participant
      teamName = '',
      photoUrl = '',
    } = req.body;

    if (!name || !email || !password) {
      return bad(res, 'Name, email and password are required');
    }
    if (role === 'participant' && !competitionType) {
      return bad(res, 'competitionType is required for participant role');
    }

    const status = role === 'organizer' ? 'pending' : 'approved';

    const user = await Employ.create({
      name,
      email,
      password,
      role,
      status,
      competitionType, // ⬅️ IMPORTANT
      teamName,        // ⬅️ OPTIONAL
      photoUrl,
    });

    return res.status(201).json(sanitize(user));
  } catch (err) {
    // duplicate email
    if (err?.code === 11000) {
      return bad(res, 'Email already registered');
    }
    // mongoose validation
    if (String(err?.message || '').toLowerCase().includes('validation')) {
      return bad(res, err.message);
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---------- List (by role) ----------
router.get('/organizers', async (_req, res) => {
  const organizers = await Employ.find({ role: 'organizer' }).lean();
  res.json(organizers);
});

router.get('/users', async (_req, res) => {
  const users = await Employ.find({ role: 'user' }).lean();
  res.json(users);
});

router.get('/contributors', async (_req, res) => {
  const contributors = await Employ.find({ role: 'contributor' }).lean();
  res.json(contributors);
});

router.get('/participants', async (_req, res) => {
  const participants = await Employ.find({ role: 'participant' }).lean();
  res.json(participants);
});

// ---------- Approve / Reject organizer ----------
router.patch('/organizers/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return bad(res, 'Invalid status');
    }
    const organizer = await Employ.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!organizer) return res.status(404).json({ error: 'Organizer not found' });
    res.json(sanitize(organizer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Get by id (minimal) ----------
router.get('/byid/:id', async (req, res) => {
  try {
    const user = await Employ.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ name: user.name, role: user.role, competitionType: user.competitionType });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Competitors filter (for dashboard) ----------
// /api/employ/competitors?type=food
router.get('/competitors', async (req, res) => {
  try {
    const type = (req.query.type || '').toLowerCase();
    const filter = { role: 'participant' };
    if (type) filter.competitionType = type;
    const list = await Employ.find(filter).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Login ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    // need password for compare -> select('+password')
    const user = await Employ.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    // Optional: block organizers until approved
    if (user.role === 'organizer' && user.status !== 'approved') {
      return res.status(403).json({ message: `Organizer is ${user.status}` });
    }

    // Make a safe object (exclude password)
    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      competitionType: user.competitionType || null,
      teamName: user.teamName || '',
      photoUrl: user.photoUrl || '',
      createdAt: user.createdAt,
    };

    // (optional) issue JWT
    const token = jwt.sign(
      { id: safeUser.id, role: safeUser.role },
      JWT_SECRET,
      { expiresIn: '10h' }
    );

    return res.json({ message: 'Login successful', user: safeUser, token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
