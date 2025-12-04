import api from './api';

export const walletService = {
    getMyWallet: async () => {
        const response = await api.get('/wallet/my-wallet');
        return response.data;
    },

    getBalance: async (userId: string) => {
        const response = await api.get(`/wallet/balance/${userId}`);
        return response.data;
    },

    createWallet: async (data: any) => {
        const response = await api.post('/wallet', data);
        return response.data;
    },

    initiateAddMoney: async (data: { amount: number; userEmail?: string; userPhone?: string }) => {
        const response = await api.post('/wallet/add-money', data);
        return response.data;
    },

    checkPaymentStatus: async (orderId: string) => {
        const response = await api.get(`/wallet/payment-status/${orderId}`);
        return response.data;
    },

    withdrawFunds: async (amount: number, upiId: string) => {
        // Note: withdraw route is not in walletRoutes.js, might be missing in backend or different path
        // For now keeping as is but marking as potential issue if backend doesn't support it
        const response = await api.post('/wallet/withdraw', { amount, upiId });
        return response.data;
    },

    getTransactions: async (walletId: string) => {
        const response = await api.get(`/wallet/${walletId}/transactions`);
        return response.data;
    }
};
