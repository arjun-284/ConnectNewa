
const mongoose = require('mongoose');

const ExploreSchema=mongoose.Schema ({
     title: {
    type: String,
    required: true,
  },
    desc: {
    type: String,
    required: true,
  },
    image: {
    type: String,
    required: true,
  },
    category: {
    type: String,
    required: true,
  },
    popularity: {
    type: String,
    required: true,
  },
    type: {
    type: String,
    required: true,
  },
    year: {
    type: String,
    required: true,
  },
})

const Explore = mongoose.model('Explore', ExploreSchema);
module.exports = Explore;