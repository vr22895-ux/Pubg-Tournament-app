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

module.exports = router;
