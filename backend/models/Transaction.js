const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'Employ' },   // User or Organizer
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' },  // Organizer or Admin
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  amount: Number,
  type: String, // 'user_to_organizer', 'organizer_to_admin'
  commission: Number, // 0 or 13% value
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },  // <--- Add this line
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
