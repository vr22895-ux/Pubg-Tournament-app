import api from './api';

export const squadService = {
    getSquads: async (params?: any) => {
        const response = await api.get('/squads', { params });
        return response.data;
    },

    getSquadDetails: async (squadId: string) => {
        const response = await api.get(`/squads/${squadId}`);
        return response.data;
    },

    createSquad: async (squadData: any) => {
        const response = await api.post('/squads', squadData);
        return response.data;
    },

    deleteSquad: async (squadId: string) => {
        const response = await api.delete(`/squads/${squadId}`);
        return response.data;
    },

    joinSquad: async (squadId: string) => {
        const response = await api.post(`/squads/${squadId}/join-request`);
        return response.data;
    },

    leaveSquad: async (squadId: string) => {
        const response = await api.post(`/squads/${squadId}/leave`);
        return response.data;
    },

    getMySquad: async () => {
        const response = await api.get('/squads/my-squad');
        return response.data;
    }
};
