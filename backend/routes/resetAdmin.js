// backend/routes/resetAdmin.js
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// ✅ import model from ../models/Employ.js (one level up from routes/)
const Employ = require(path.join(__dirname, '..', 'models', 'Employ'));

(async () => {
  try {
    const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/Newa';
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

    const email = 'admin@gmail.com';
    const password = 'admin@123';

    // delete any existing admin with same email
    await Employ.deleteOne({ email });

    // create new admin (password will be hashed by your pre-save hook)
    const admin = await Employ.create({
      name: 'Admin',
      email,
      password,
      role: 'admin',
      status: 'approved',
    });

    console.log('✅ Admin reset successfully:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting admin:', err);
    process.exit(1);
  }
})();
