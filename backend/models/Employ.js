// models/Employ.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ===== Enums ===== */
const COMPETITION_ENUM = ['food', 'dance', 'music', 'art', 'other'];
const ROLE_ENUM        = ['admin', 'organizer', 'contributor', 'user', 'participant'];
const STATUS_ENUM      = ['pending', 'approved', 'rejected'];

/* =============================================================================
 * EMPLOY (unchanged)
 * ===========================================================================*/
const EmploySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,           // ✅ keep this
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
        message: 'Please provide a valid email',
      },
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    role: {
      type: String,
      required: true,
      enum: ROLE_ENUM,
      default: 'user',
      index: true,
    },

    photoUrl: { type: String, default: '', trim: true },

    competitionType: {
      type: String,
      enum: COMPETITION_ENUM,
      default: null,
      index: true,
    },

    teamName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },

    status: {
      type: String,
      enum: STATUS_ENUM,
      default: function () {
        return this.role === 'organizer' ? 'pending' : 'approved';
      },
      index: true,
    },

    approvedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Require competitionType if role is participant
EmploySchema.path('competitionType').validate(function (value) {
  if (this.role === 'participant') return !!value;
  return true;
}, 'competitionType is required for participant role');

// Hash password if modified
EmploySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sync approvedAt/rejectedAt
EmploySchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'approved') {
      this.approvedAt = this.approvedAt || new Date();
      this.rejectedAt = undefined;
    } else if (this.status === 'rejected') {
      this.rejectedAt = this.rejectedAt || new Date();
      this.approvedAt = undefined;
    } else {
      this.approvedAt = undefined;
      this.rejectedAt = undefined;
    }
  }
  next();
});

// Compare password
EmploySchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Helpful compound index
EmploySchema.index({ role: 1, competitionType: 1, status: 1 });

/* =============================================================================
 * COMPETITOR (updated: createdBy = required + unique)
 * ===========================================================================*/
const phoneRegex = /^\+?[0-9\-()\s]{7,20}$/;

const CompetitorSchema = new mongoose.Schema(
  {
    // who created this competitor profile (link to Employ)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employ',
      required: true,      // ✅ now required
      unique: true,        // ✅ 1 user = 1 competitor
      index: true,
    },

    // names
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name must be at most 100 characters'],
      index: true,
    },
    teamName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description too long'],
    },

    // types they compete in (aligned with your COMPETITION_ENUM)
    competitionTypes: {
      type: [String],
      enum: COMPETITION_ENUM,
      default: [],
      index: true,
    },

    // what functions/events they do (wedding, corporate, school fest, etc.)
    functions: { type: [String], default: [] },

    // styles/performances (HipHop, Folk, Standup, Band, etc.)
    performances: { type: [String], default: [] },

    members: { type: Number, min: [1, 'Members cannot be < 1'], default: 1 },

    location: { type: String, trim: true, maxlength: 120, default: '', index: true },

    contact: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || phoneRegex.test(v),
        message: 'Please provide a valid contact number',
      },
    },

    // per-event rate (NPR)
    rate: { type: Number, min: [0, 'Rate cannot be negative'], default: 0, index: true },

    availableDates: [{ type: Date }],

    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },

    // optional media/socials
    photoUrl: { type: String, trim: true, default: '' },
    socialLinks: {
      facebook: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
      tiktok: { type: String, trim: true, default: '' },
    },

    // lightweight rating aggregate
    rating: {
      avg: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
    toObject: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
  }
);

// prevent easy duplicates & speed common queries
CompetitorSchema.index({ groupName: 1, teamName: 1 });
// createdBy already unique, below compound index optional
// CompetitorSchema.index({ createdBy: 1, groupName: 1 });

// extra safety: ensure unique index is created at DB
CompetitorSchema.index({ createdBy: 1 }, { unique: true });

// handy computed property
CompetitorSchema.virtual('nextAvailable').get(function () {
  if (!this.availableDates || this.availableDates.length === 0) return null;
  const future = this.availableDates.filter(d => new Date(d) >= new Date());
  if (future.length === 0) return null;
  return future.sort((a, b) => new Date(a) - new Date(b))[0];
});

/* =============================================================================
 * MODELS + EXPORT
 * ===========================================================================*/
const Employ      = mongoose.models.Employ     || mongoose.model('Employ', EmploySchema);
const Competitor  = mongoose.models.Competitor || mongoose.model('Competitor', CompetitorSchema);

// default export = Employ (backward compatibility)
module.exports = Employ;
// named export
module.exports.Competitor = Competitor;
