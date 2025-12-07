// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars immediately
dotenv.config();
const mongoose = require('mongoose');
const walletController = require('./controller/walletController'); // Kept for now if needed, but ideally remove if unused
const adminAuth = require('./middleware/adminAuth');
const userAuth = require('./middleware/userAuth');

// Routes
const matchRoutes = require('./routes/matchRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const squadRoutes = require('./routes/squadRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const walletRoutes = require('./routes/walletRoutes');
const notificationRoutes = require('./routes/notificationRoutes');



const app = express();

app.use(cors({ origin: true, credentials: false }));
// ❌ DO NOT do: app.options('*', cors())
app.use(express.json());

// (optional) tiny logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use("/api/otp", require("./controller/loginController"));


app.use('/api/auth', authRoutes);
app.use('/api/admin/users', userRoutes);

app.use('/api/squads', squadRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

app.use('/api/wallet', walletRoutes);

// Mount Routes
app.use('/api/matches', matchRoutes);

// Log all registered routes
console.log('Registered routes:');
console.log('- GET /api/health');
console.log('- GET /api/squads/user/:userId');
console.log('- POST /api/squads');
console.log('- POST /api/squads/:squadId/invite');
console.log('- DELETE /api/squads/:squadId/members/:userId');
console.log('- GET /api/matches');
console.log('- POST /api/matches');
console.log('- GET /api/matches/management');
console.log('- GET /api/matches/:matchId');
console.log('- PUT /api/matches/:matchId');
console.log('- POST /api/matches/:matchId/cancel');
console.log('- DELETE /api/matches/:matchId');
console.log('- GET /api/matches/completed');
console.log('- POST /api/matches/:matchId/results');
console.log('- GET /api/matches/:matchId/results');
console.log('- PATCH /api/matches/:matchId/status');
console.log('- POST /api/matches/auto-update-statuses');
console.log('- GET /api/auth/find');
console.log('- POST /api/auth/register');
console.log('- POST /api/auth/login');
console.log('- GET /api/auth/check-login-eligibility/:userId');
console.log('- POST /api/auth/admin/login');
console.log('- POST /api/auth/admin/create');

// db
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5050;

// Global Error Handler
app.use((err, req, res, next) => {
  console.log('🔥 Global Error:', err.stack);

  const statusCode = err.statusCode || 500; // Default to 500 if no status code
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
