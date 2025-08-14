// backend/models/Competition.js
const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema(
  {
    competitor1: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true },
    competitor2: { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employ',     required: true },
    date:      { type: Date,   required: true },
    location:  { type: String, default: '' },
    status:    { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    winner:    { type: mongoose.Schema.Types.ObjectId, ref: 'Competitor', default: null },
    prize:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Competition', CompetitionSchema);
