// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectToDatabase = require('./config/data');
const Employ = require('./models/Employ');
const Booking = require('./models/Booking');


require('dotenv').config();

const app = express();

// --- Middleware
app.use(
  cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
  })
);
app.use(express.json()); // bodyParser not needed

// --- DB
connectToDatabase({ useNewUrlParser: true, useUnifiedTopology: true });

// --- Static (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes (ONLY server routes; no React files)
app.use('/api/employ', require('./routes/employ'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));
app.use("/api/users", require("./routes/users"));
app.use('/api/contributors', require('./routes/contributor'));
app.use('/api/explore', require('./routes/explore'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/participations', require('./routes/participations'));
app.use('/api/competitors', require('./routes/competitor'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/competitions', require('./routes/competitions'));

// --- Health + root
app.get('/health', (_req, res) => res.send('ok'));
app.get('/', (_req, res) => res.send('API Running'));

//
// --- Server
const PORT = process.env.PORT || 5000; // <-- use 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
