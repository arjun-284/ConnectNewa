const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema(
  {
    performerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employ', required: true },

    // overall request status
    // requested -> accepted -> pay_pending -> paid -> scheduled (or -> rejected)
    status: {
      type: String,
      enum: ['requested', 'accepted', 'pay_pending', 'paid', 'scheduled', 'rejected'],
      default: 'requested',
      index: true,
    },

    // Organizer defines amount -> pending
    // Performer adds ref -> still pending
    // Organizer confirms -> confirmed
    payment: {
      amount: { type: Number, default: 0 },
      method: {
        type: String,
        enum: ['cash', 'esewa', 'khalti', 'mypay', 'bank', 'other'],
        default: 'cash',
      },
      ref: { type: String, default: '' },
      status: { type: String, enum: [null, 'pending', 'confirmed'], default: null },
      paidAt: { type: Date },
      submittedByPerformerAt: { type: Date },
    },

    // final schedule (allowed only after paid:confirmed)
    schedule: {
      date: { type: Date },
      stage: { type: String, default: '' },
      note: { type: String, default: '' },
    },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true, index: true },
    location: { type: String, default: '' },
    price: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employ', required: true, index: true },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },

    participationRequests: { type: [ParticipationSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
