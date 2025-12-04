import api from './api';

export const authService = {
    login: async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    adminLogin: async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/admin/login', credentials);
        return response.data;
    },

    register: async (userData: any) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await api.put('/auth/profile/update', data);
        return response.data;
    },

    getAvailablePlayers: async (params?: any) => {
        const response = await api.get('/auth/players', { params });
        return response.data;
    },

    sendOtp: async (payload: { countryCode: string; mobileNumber: string; flowType: string; otpLength: number }) => {
        const response = await api.post('/otp/send', payload);
        return response.data;
    },

    verifyOtp: async (params: { verificationId: string; code: string }) => {
        const response = await api.get('/otp/verify', { params });
        return response.data;
    }
};
