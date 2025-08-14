// backend/models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    organizerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employ',     required: true, index: true },
    competitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true, index: true },
    date:   { type: Date, required: true },
    amount: { type: Number, default: 0, min: 0 },
    notes:  { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },

    // pairing helpers
    matched:       { type: Boolean, default: false, index: true },
    competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', default: null },
  },
  { timestamps: true }
);

BookingSchema.index({ competitorId: 1, date: 1 });

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
