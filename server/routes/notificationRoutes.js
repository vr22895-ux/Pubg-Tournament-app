const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const userAuth = require('../middleware/userAuth');

// Protected User Routes
router.get('/', userAuth, notificationController.getUserNotifications);
router.patch('/:notificationId/read', userAuth, notificationController.markAsRead);
router.patch('/read-all', userAuth, notificationController.markAllAsRead);
router.post('/device-token', userAuth, notificationController.registerDeviceToken);

module.exports = router;
