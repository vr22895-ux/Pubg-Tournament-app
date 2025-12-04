const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const adminAuth = require('../middleware/adminAuth');

// All routes here are protected by adminAuth
router.use(adminAuth);

router.get('/', userController.getUsers);
router.get('/:userId', userController.getUserDetails);
router.patch('/:userId/status', userController.updateUserStatus);
router.get('/:userId/reports', userController.getUserReports);
router.post('/:userId/ban', userController.banUser);
router.post('/:userId/unban', userController.unbanUser);

module.exports = router;
