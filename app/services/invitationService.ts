import api from './api';

export const invitationService = {
    getUserInvitations: async (userId: string) => {
        const response = await api.get(`/invitations/user/${userId}`);
        return response.data;
    },

    getSquadJoinRequests: async (squadId: string) => {
        const response = await api.get(`/invitations/squad/${squadId}?type=join_request&status=pending`);
        return response.data;
    },

    sendInvitation: async (data: any) => {
        const response = await api.post('/invitations/send', data);
        return response.data;
    },

    acceptInvitation: async (invitationId: string) => {
        const response = await api.post(`/invitations/${invitationId}/accept`);
        return response.data;
    },

    declineInvitation: async (invitationId: string) => {
        const response = await api.post(`/invitations/${invitationId}/decline`);
        return response.data;
    },

    acceptJoinRequest: async (invitationId: string) => {
        const response = await api.post(`/invitations/${invitationId}/accept-join`);
        return response.data;
    },

    declineJoinRequest: async (invitationId: string) => {
        const response = await api.post(`/invitations/${invitationId}/decline-join`);
        return response.data;
    },

    cancelInvitation: async (invitationId: string) => {
        const response = await api.delete(`/invitations/${invitationId}`);
        return response.data;
    }
};
