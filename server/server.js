// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authController = require('./controller/authController');
const matchController = require('./controller/matchController');
const userController = require('./controller/userController');
const squadController = require('./controller/squadController');
const invitationController = require('./controller/invitationController');
const walletController = require('./controller/walletController');
const adminAuth = require('./middleware/adminAuth');
const userAuth = require('./middleware/userAuth');

dotenv.config();

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


// ✅ Auth (user registration/login) — using controller directly
app.get('/api/auth/find', authController.findByPhone);
app.get('/api/auth/find-user', authController.findByEmailOrPubgId);
app.get('/api/auth/players', authController.getAvailablePlayers);
app.post('/api/auth/register', authController.register);  // { phone, pubgId, email }
app.post('/api/auth/login', authController.login);        // { email, password }
app.get('/api/auth/check-login-eligibility/:userId', authController.checkLoginEligibility);

// Admin auth routes
app.post('/api/auth/admin/login', authController.adminLogin);        // { email, password }
app.post('/api/auth/admin/create', authController.createAdmin);      // { email, password, name }

// Profile management routes
app.put('/api/auth/profile/update', authController.updateProfile);
app.post('/api/auth/profile/verify-phone', authController.verifyPhoneNumber);

// Admin user management routes
app.get('/api/admin/users', adminAuth, userController.getUsers);
app.get('/api/admin/users/:userId', adminAuth, userController.getUserDetails);
app.patch('/api/admin/users/:userId/status', adminAuth, userController.updateUserStatus);
app.get('/api/admin/users/:userId/reports', adminAuth, userController.getUserReports);
app.post('/api/admin/users/:userId/ban', adminAuth, userController.banUser);
app.post('/api/admin/users/:userId/unban', adminAuth, userController.unbanUser);

// Squad routes
app.get('/api/squads/my-squad', userAuth, squadController.getMySquad); // Secure route first
app.get('/api/squads/user/:userId', squadController.getUserSquad);
app.get('/api/squads', squadController.getAllSquads);
app.get('/api/squads/:squadId', squadController.getSquadById);
app.post('/api/squads', userAuth, squadController.createSquad);
app.put('/api/squads/:squadId', squadController.updateSquad);
app.post('/api/squads/:squadId/invite', userAuth, squadController.inviteToSquad);
app.post('/api/squads/:squadId/join-request', userAuth, squadController.requestToJoinSquad);
app.post('/api/squads/:squadId/leave', userAuth, squadController.leaveSquad);
app.delete('/api/squads/:squadId/members/:userId', userAuth, squadController.removeFromSquad);
app.delete('/api/squads/:squadId', squadController.deleteSquad);

// Invitation routes
app.get('/api/invitations/user/:userId', invitationController.getUserInvitations);
app.post('/api/invitations/send', userAuth, invitationController.sendInvitation);
app.post('/api/invitations/:invitationId/accept', userAuth, invitationController.acceptInvitation);
app.post('/api/invitations/:invitationId/decline', userAuth, invitationController.declineInvitation);
app.post('/api/invitations/:invitationId/accept-join', userAuth, invitationController.acceptJoinRequest);
app.post('/api/invitations/:invitationId/decline-join', userAuth, invitationController.declineJoinRequest);
app.delete('/api/invitations/:invitationId', userAuth, invitationController.cancelInvitation);

// Wallet routes
app.get('/api/wallet/my-wallet', userAuth, walletController.getMyWallet); // Secure route first
app.get('/api/wallet/user/:userId', walletController.getUserWallet);
app.get('/api/wallet/balance/:userId', walletController.getWalletBalance);
app.post('/api/wallet', userAuth, walletController.createWallet);
app.get('/api/wallet/:walletId/transactions', walletController.getWalletTransactions);
app.post('/api/wallet/add-money', userAuth, walletController.initiateAddMoney); // Generic secure route
app.post('/api/wallet/:walletId/add-money', walletController.initiateAddMoney); // Keep legacy for now if needed, or remove
app.post('/api/wallet/:walletId/deduct-entry-fee', walletController.deductMatchEntryFee);
app.get('/api/wallet/payment-status/:orderId', walletController.checkPaymentStatus);
app.post('/api/wallet/webhook/cashfree', walletController.handleCashfreeWebhook);

// routes
app.get('/api/matches', matchController.getAllMatches);
app.post('/api/matches', matchController.createMatch);

// Match management routes - specific routes first
app.get('/api/matches/management', matchController.getAllMatchesForManagement);
app.get('/api/matches/completed', matchController.getCompletedMatches);
app.post('/api/matches/auto-update-statuses', matchController.autoUpdateMatchStatuses);

// Parameterized routes last
app.get('/api/matches/:matchId', matchController.getMatchDetails);
app.put('/api/matches/:matchId', matchController.updateMatch);
app.post('/api/matches/:matchId/cancel', matchController.cancelMatch);
app.delete('/api/matches/:matchId', matchController.deleteMatch);
app.post('/api/matches/:matchId/results', matchController.uploadResults);
app.get('/api/matches/:matchId/results', matchController.getMatchResults);
app.patch('/api/matches/:matchId/status', matchController.updateMatchStatus);

// Match registration routes
app.post('/api/matches/:matchId/join', matchController.joinMatch);
app.post('/api/matches/:matchId/leave', matchController.leaveMatch);
app.get('/api/matches/:matchId/registrations', matchController.getMatchRegistrations);

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
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
