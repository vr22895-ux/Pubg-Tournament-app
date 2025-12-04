import api from './api';

export const resultsService = {
    uploadResults: async (matchId: string, payload: any) => {
        const response = await api.post(`/matches/${matchId}/results`, payload);
        return response.data;
    }
};
