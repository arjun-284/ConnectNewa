const express = require('express');
const router = express.Router();

const Employ = require('../models/Employ');
const Organizer = require('../models/Organizer');

// List all approved organizers
router.get('/approved-organizers', async (req, res) => {
  const organizers = await Organizer.find({ status: 'approved' });
  res.json(organizers);
});

// Register new organizer (signup)
router.post('/register', async (req, res) => {
  try {
    const org = new Organizer(req.body);
    await org.save();
    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve organizer (admin)
router.patch('/approve/:id', async (req, res) => {
  const org = await Organizer.findByIdAndUpdate(
    req.params.id,
    { status: 'approved' },
    { new: true }
  );
  res.json(org);
});

// Reject organizer (admin)
router.patch('/reject/:id', async (req, res) => {
  const org = await Organizer.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected' },
    { new: true }
  );
  res.json(org);
});
// /api/tickets/organizer/:organizerId
router.get('/organizer/:organizerId', async (req, res) => {
  const events = await Event.find({ createdBy: req.params.organizerId });
  const eventIds = events.map(ev => ev._id);
  const tickets = await Ticket.find({ event: { $in: eventIds } })
    .populate('user')
    .populate('event');

  // Get related commission transactions
  const transactions = await Transaction.find({
    ticket: { $in: tickets.map(t => t._id) },
    type: 'organizer_to_admin'
  });

  // Map each ticket with its commission transaction
  const data = tickets.map(ticket => ({
    ticket,
    user: ticket.user,
    event: ticket.event,
    transaction: transactions.find(tr => String(tr.ticket) === String(ticket._id)) || {}
  }));

  res.json({ tickets: data });
});




module.exports = router;
