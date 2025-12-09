const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

// Public Auth
router.get('/find', authController.findByPhone);
router.get('/find-user', authController.findByEmailOrPubgId);
router.get('/players', authController.getAvailablePlayers);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/check-login-eligibility/:userId', authController.checkLoginEligibility);

// Admin Auth
router.post('/admin/login', authController.adminLogin);
router.post('/admin/create', authController.createAdmin);

// Profile Management
router.put('/profile/update', authController.updateProfile);
router.post('/profile/verify-phone', authController.verifyPhoneNumber);

// Password Management
router.post('/reset-password', authController.resetPassword); // Public (uses OTP)
// Note: change-password should be protected usually, but here we attach userAuth in server.js or inside controller?
// Actually routes here are mounted at /api/auth. server.js doesn't apply userAuth to /api/auth globally.
// We need to apply userAuth for change-password.
const userAuth = require('../middleware/userAuth');
router.post('/change-password', userAuth, authController.changePassword);

module.exports = router;
