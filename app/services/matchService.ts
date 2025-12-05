import api from './api';

export const matchService = {
    getAllMatches: async (params?: any) => {
        const response = await api.get('/matches', { params });
        return response.data;
    },

    getMyMatches: async () => {
        const response = await api.get('/matches/my-matches');
        return response.data;
    },

    getMatchDetails: async (matchId: string) => {
        const response = await api.get(`/matches/${matchId}`);
        return response.data;
    },

    createMatch: async (matchData: any) => {
        const response = await api.post('/matches', matchData);
        return response.data;
    },

    updateMatch: async (matchId: string, matchData: any) => {
        const response = await api.put(`/matches/${matchId}`, matchData);
        return response.data;
    },

    deleteMatch: async (matchId: string) => {
        const response = await api.delete(`/matches/${matchId}`);
        return response.data;
    },

    joinMatch: async (matchId: string, data?: { userId: string; squadId?: string }) => {
        const response = await api.post(`/matches/${matchId}/join`, data);
        return response.data;
    },

    getMatchRegistrations: async (matchId: string) => {
        const response = await api.get(`/matches/${matchId}/registrations`);
        return response.data;
    },

    getCompletedMatches: async () => {
        const response = await api.get('/matches/completed');
        return response.data;
    },

    autoUpdateStatuses: async () => {
        const response = await api.post('/matches/auto-update-statuses');
        return response.data;
    },

    sendRoomDetails: async (matchId: string, roomId: string, roomPassword: string) => {
        const response = await api.post(`/matches/${matchId}/room-details`, { roomId, roomPassword });
        return response.data;
    }
};
