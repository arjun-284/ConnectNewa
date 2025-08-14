const mongoose = require('mongoose');
const ExploreItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  image: String, // URL or path
  category: { type: String, required: true }, // Festivals, Food, History, etc.
  year: String,
  popularity: String, // most, trending, classic
  type: String, // article, video, etc.
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ExploreItem', ExploreItemSchema);
