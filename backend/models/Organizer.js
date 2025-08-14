const mongoose = require('mongoose');
const OrganizerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true }, // (no `index: true`)

  password: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});
module.exports = mongoose.model('Organizer', OrganizerSchema);
