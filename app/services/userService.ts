import api from './api';

export const userService = {
    getUsers: async (params?: any) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getUserDetails: async (userId: string) => {
        const response = await api.get(`/users/${userId}/details`);
        return response.data;
    },

    updateUserStatus: async (userId: string, status: string, reason: string, banDuration?: string) => {
        const response = await api.put(`/users/${userId}/status`, { status, reason, banDuration });
        return response.data;
    },

    banUserByPubgId: async (pubgId: string, reason: string, duration: string, adminNotes: string) => {
        const response = await api.post('/users/ban-by-pubgid', { pubgId, reason, duration, adminNotes });
        return response.data;
    },

    bulkBanUsers: async (userIds: string[], reason: string, duration: string, adminNotes: string) => {
        const response = await api.post('/users/bulk-ban', { userIds, reason, duration, adminNotes });
        return response.data;
    }
};
