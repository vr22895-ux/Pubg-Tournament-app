import api from './api';

export interface LeaderboardEntry {
    _id: string; // PUBG ID
    playerName: string;
    totalKills: number;
    totalPrize: number;
    totalWins: number;
    matchesPlayed: number;
}

export const statsService = {
    getLeaderboard: async (type: 'kills' | 'wins' | 'money' = 'kills', limit: number = 50) => {
        const response = await api.get(`/stats/leaderboard?type=${type}&limit=${limit}`);
        return response.data;
    }
};
