const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Employ = require('../models/Employ');

// ---- Performer browse: approved events (keep path here) ----
router.get('/events/approved', async (_req, res) => {
  try {
    const list = await Event.find({ status: 'approved' })
      .select('title location date price imageUrl createdBy');
    res.json(list);
  } catch (err) {
    console.error('GET /participations/events/approved:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Performer sends participation request ----
// body: { eventId, performerId }
router.post('/request', async (req, res) => {
  try {
    const { eventId, performerId } = req.body;
    if (!eventId || !performerId) {
      return res.status(400).json({ message: 'eventId and performerId required' });
    }

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    if (ev.status !== 'approved') return res.status(400).json({ message: 'Event not approved' });

    if (!Array.isArray(ev.participationRequests)) ev.participationRequests = [];

    const exists = ev.participationRequests.find(r => String(r.performerId) === String(performerId));
    if (exists) return res.status(200).json({ ok: true, message: 'Already requested' });

    ev.participationRequests.push({ performerId, status: 'requested' });
    await ev.save();
    res.status(201).json({ ok: true, message: 'Request sent' });
  } catch (err) {
    console.error('POST /participations/request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Organizer: list requests for my events (flatten) ----
router.get('/requests/for-organizer/:organizerId', async (req, res) => {
  try {
    const orgId = req.params.organizerId;
    const events = await Event.find({ createdBy: orgId }).lean();

    const out = [];
    const pids = new Set();

    for (const ev of events) {
      const reqs = Array.isArray(ev.participationRequests) ? ev.participationRequests : [];
      for (const r of reqs) {
        const pid = r.performerId ? String(r.performerId) : null;
        if (pid) pids.add(pid);
        out.push({
          eventId: String(ev._id),
          eventTitle: ev.title,
          performerId: pid,
          status: r.status,
          payment: r.payment,
          schedule: r.schedule,
        });
      }
    }

    const performers = pids.size
      ? await Employ.find({ _id: { $in: [...pids] } })
          .select('name email role competitionType')
          .lean()
      : [];
    const pmap = new Map(performers.map(p => [String(p._id), p]));

    res.json(
      out.map(x => ({ ...x, performer: x.performerId ? pmap.get(x.performerId) || null : null }))
    );
  } catch (err) {
    console.error('GET /participations/requests/for-organizer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Organizer: accept performer ----
router.patch('/:eventId/:performerId/accept', async (req, res) => {
  try {
    const { eventId, performerId } = req.params;
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (!Array.isArray(ev.participationRequests)) ev.participationRequests = [];
    const r = ev.participationRequests.find(x => String(x.performerId) === String(performerId));
    if (!r) return res.status(404).json({ message: 'Request not found' });

    r.status = 'accepted';
    await ev.save();
    res.json({ ok: true, message: 'Accepted' });
  } catch (err) {
    console.error('PATCH accept:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Organizer: define payment (sets pending) ----
// body: { amount, method, ref }
router.patch('/:eventId/:performerId/pay', async (req, res) => {
  try {
    const { eventId, performerId } = req.params;
    const { amount = 0, method = 'cash', ref = '' } = req.body;

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (!Array.isArray(ev.participationRequests)) ev.participationRequests = [];
    const r = ev.participationRequests.find(x => String(x.performerId) === String(performerId));
    if (!r) return res.status(404).json({ message: 'Request not found' });

    r.payment = {
      ...(r.payment || {}),
      amount: Number(amount),
      method,
      ref,
      status: 'pending',           // NEW: pending until organizer confirms
      paidAt: null,
    };
    r.status = 'pay_pending';       // NEW: overall step
    await ev.save();
    res.json({ ok: true, message: 'Payment set to pending' });
  } catch (err) {
    console.error('PATCH pay:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Performer: submit payment proof (kept pending) ----
// body: { method, ref }
router.patch('/:eventId/:performerId/submit-payment', async (req, res) => {
  try {
    const { eventId, performerId } = req.params;
    const { method = 'esewa', ref = '' } = req.body;

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (!Array.isArray(ev.participationRequests)) ev.participationRequests = [];
    const r = ev.participationRequests.find(x => String(x.performerId) === String(performerId));
    if (!r) return res.status(404).json({ message: 'Request not found' });

    if (!r.payment) r.payment = {};
    // do not change amount here; organizer already defined it
    r.payment.method = method || r.payment.method || 'esewa';
    r.payment.ref = ref || r.payment.ref || '';
    r.payment.status = r.payment.status || 'pending';
    r.payment.submittedByPerformerAt = new Date();

    // keep overall status as pay_pending
    if (r.status !== 'paid' && r.status !== 'scheduled') {
      r.status = 'pay_pending';
    }

    await ev.save();
    res.json({ ok: true, message: 'Payment proof submitted (pending confirmation).' });
  } catch (err) {
    console.error('PATCH submit-payment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Organizer: confirm payment (final -> paid) ----
router.patch('/:eventId/:performerId/confirm-pay', async (req, res) => {
  try {
    const { eventId, performerId } = req.params;

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (!Array.isArray(ev.participationRequests)) ev.participationRequests = [];
    const r = ev.participationRequests.find(x => String(x.performerId) === String(performerId));
    if (!r) return res.status(404).json({ message: 'Request not found' });

    if (!r.payment || r.payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment is not pending' });
    }

    r.payment.status = 'confirmed';
    r.payment.paidAt = new Date();
    r.status = 'paid';
    await ev.save();
    res.json({ ok: true, message: 'Payment confirmed' });
  } catch (err) {
    console.error('PATCH confirm-pay:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Organizer: set final schedule (only after paid confirmed) ----
// body: { datetimeISO, stage, note }
router.patch('/:eventId/:performerId/schedule', async (req, res) => {
  try {
    const { eventId, performerId } = req.params;
    const { datetimeISO, stage, note } = req.body;

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (!Array.isArray(ev.participationRequests)) ev.participationRequests = [];
    const r = ev.participationRequests.find(x => String(x.performerId) === String(performerId));
    if (!r) return res.status(404).json({ message: 'Request not found' });

    if (!r.payment || r.payment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Cannot schedule before payment confirmation' });
    }

    r.schedule = { date: new Date(datetimeISO), stage, note };
    r.status = 'scheduled';
    await ev.save();
    res.json({ ok: true, message: 'Scheduled' });
  } catch (err) {
    console.error('PATCH schedule:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Performer: my participations ----
router.get('/for-performer/:performerId', async (req, res) => {
  try {
    const pid = req.params.performerId;
    const events = await Event.find({ 'participationRequests.performerId': pid }).lean();

    const rows = [];
    for (const ev of events) {
      const reqs = Array.isArray(ev.participationRequests) ? ev.participationRequests : [];
      const me = reqs.find(p => String(p.performerId) === String(pid));
      if (me) {
        rows.push({
          event: { _id: ev._id, title: ev.title, location: ev.location },
          status: me.status,
          payment: me.payment,
          schedule: me.schedule,
        });
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('GET /participations/for-performer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Organizer: list all performer payments (for Sales page) ----
router.get('/payments/for-organizer/:organizerId', async (req, res) => {
  try {
    const orgId = req.params.organizerId;

    const events = await Event.find({ createdBy: orgId })
      .select('_id title participationRequests')
      .lean();

    const rows = [];
    const performerIds = new Set();

    for (const ev of events) {
      const reqs = Array.isArray(ev.participationRequests) ? ev.participationRequests : [];
      for (const r of reqs) {
        if (r?.payment && (r.payment.amount ?? 0) > 0) {
          const pid = r?.performerId ? String(r.performerId) : null;
          if (pid) performerIds.add(pid);
          rows.push({
            eventId: String(ev._id),
            eventTitle: ev.title,
            performerId: pid,
            status: r.status,
            payment: {
              amount: r.payment.amount || 0,
              method: r.payment.method || 'cash',
              status: r.payment.status || 'pending',
              paidAt: r.payment.paidAt || null,
              ref: r.payment.ref || '',
              submittedByPerformerAt: r.payment.submittedByPerformerAt || null,
            },
          });
        }
      }
    }

    const performers = performerIds.size
      ? await Employ.find({ _id: { $in: [...performerIds] } })
          .select('name email competitionType')
          .lean()
      : [];
    const pmap = new Map(performers.map(p => [String(p._id), p]));

    const out = rows
      .map(r => ({
        ...r,
        performer: r.performerId ? (pmap.get(r.performerId) || null) : null,
      }))
      .sort((a, b) => {
        const ad = a.payment.paidAt ? new Date(a.payment.paidAt).getTime() : 0;
        const bd = b.payment.paidAt ? new Date(b.payment.paidAt).getTime() : 0;
        return bd - ad;
      });

    res.json(out);
  } catch (err) {
    console.error('GET /participations/payments/for-organizer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
