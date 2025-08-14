// models/ContributorSubmission.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Employ" },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Employ" },
  text: String,
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
});

const ContributorSubmissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  mediaUrl: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employ', required: true },
  type: { type: String, enum: ['article', 'image', 'video', 'update'], default: 'article' },
  references: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewComment: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employ' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employ' }],
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContributorSubmission', ContributorSubmissionSchema);
