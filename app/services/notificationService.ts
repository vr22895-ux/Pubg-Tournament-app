import axios from 'axios';

const API_URL = 'http://localhost:5050/api/notifications';

// Get auth token helper
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const notificationService = {
    // Get user notifications
    getNotifications: async (page = 1, limit = 20) => {
        try {
            const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`, getAuthHeader());
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Failed to fetch notifications' };
        }
    },

    // Mark single notification as read
    markAsRead: async (notificationId: string) => {
        try {
            const response = await axios.patch(`${API_URL}/${notificationId}/read`, {}, getAuthHeader());
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Failed to mark as read' };
        }
    },

    // Mark all as read
    markAllAsRead: async () => {
        try {
            const response = await axios.patch(`${API_URL}/read-all`, {}, getAuthHeader());
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Failed to mark all as read' };
        }
    },

    // Register device token (for future mobile app or web push)
    registerDeviceToken: async (fcmToken: string) => {
        try {
            const response = await axios.post(`${API_URL}/device-token`, { fcmToken }, getAuthHeader());
            return response.data;
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'Failed to register token' };
        }
    }
};
