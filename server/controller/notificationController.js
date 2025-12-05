const Notification = require('../schema/Notification');
const User = require('../schema/User');

// Placeholder for Firebase Admin SDK
// const admin = require('firebase-admin');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Register FCM Token (Mobile)
exports.registerDeviceToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }

        await User.findByIdAndUpdate(userId, { fcmToken });

        res.json({ success: true, message: 'Device token registered' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Internal Helper: Send Notification (In-App + Push)
exports.sendNotification = async ({ userId, title, message, type = 'info', data = {} }) => {
    try {
        // 1. Save to Database (In-App)
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            data
        });

        // 2. Send Push Notification (Mobile)
        const user = await User.findById(userId);
        if (user && user.fcmToken) {
            // TODO: Integrate Firebase Admin SDK here
            console.log(`[MOCK PUSH] To: ${user.email}, Title: ${title}, Msg: ${message}`);

            /* 
            // Example Firebase Implementation:
            await admin.messaging().send({
              token: user.fcmToken,
              notification: { title, body: message },
              data: { ...data, type }
            });
            */
        }

        return notification;
    } catch (error) {
        console.error('Failed to send notification:', error);
        // Don't throw, just log error so main flow doesn't break
    }
};
