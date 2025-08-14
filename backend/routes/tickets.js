const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Employ = require('../models/Employ'); // User model

const ADMIN_ID = "685bae93a17d9e3f54f1c768"; // Set your actual Admin MongoDB ObjectId

// --- 1. Book a Ticket ---
router.post('/book', async (req, res) => {
  try {
    const { eventId, userId, qty, price } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Calculate total amount and commission FIRST
    const totalAmount = price * qty;
    const commission = totalAmount * 0.13;

    // 1. Create ticket
    const ticket = new Ticket({
      event: eventId,
      user: userId,
      qty,
      amount: totalAmount,
    });
    await ticket.save();

    // 2. Organizer
    const organizerId = event.createdBy;

    // 3. Transaction: User → Organizer
    await new Transaction({
      from: userId,
      to: organizerId,
      ticket: ticket._id,
      amount: totalAmount,
      type: "user_to_organizer",
      commission: 0,
    }).save();

    // 4. Transaction: Organizer → Admin
    await new Transaction({
      from: organizerId,
      to: ADMIN_ID,
      ticket: ticket._id,
      amount: commission,
      type: "organizer_to_admin",
      commission,
    }).save();

    res.json({ success: true, ticket, message: "Booking successful. Invoice/transaction created." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. Get a Single Ticket by Ticket ID ---
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ ticket });
  } catch {
    res.status(404).json({ error: "Ticket not found" });
  }
});

// --- 3. Get All Tickets by User ID ---
router.get('/user/:id', async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.params.id })
      .populate('event');
    res.json({ tickets });
  } catch {
    res.status(500).json({ error: "Failed to get tickets" });
  }
});

// --- 4. Get All Tickets Sold for Organizer (with commission transaction) ---
router.get('/organizer/:id', async (req, res) => {
  try {
    // 1. Find all events created by this organizer
    const events = await Event.find({ createdBy: req.params.id }).select('_id');
    const eventIds = events.map(e => e._id);

    // 2. Find all tickets for those events
    const tickets = await Ticket.find({ event: { $in: eventIds } })
      .populate('event')
      .populate('user');

    // 3. For each ticket, find the corresponding commission transaction
    const results = await Promise.all(
      tickets.map(async (ticket) => {
        // Find commission transaction for this ticket (organizer_to_admin)
        const transaction = await Transaction.findOne({
          ticket: ticket._id,
          type: "organizer_to_admin"
        });
        return {
          ticket,
          user: ticket.user,
          event: ticket.event,
          transaction: transaction || { status: "pending" }
        };
      })
    );

    res.json({ tickets: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get tickets for organizer" });
  }
});

module.exports = router;
