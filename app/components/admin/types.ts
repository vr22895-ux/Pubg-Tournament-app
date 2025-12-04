export type MapName = "Erangel" | "Livik" | "Sanhok" | "Miramar" | "Vikendi";

export type RankRewardItem = {
    rank: "1st Place" | "2nd Place" | "3rd Place" | "4th Place" | "5th Place";
    amount: number;
};

export type PrizeDistribution = {
    rankRewards: { total: number; ranks: RankRewardItem[] };
    killRewards: { total: number; perKill: number; maxKills: number };
    customRewards: { name: string; amount: number }[];
    summary: { totalDistributed: number; rankRewardsTotal: number; killRewardsTotal: number; customRewardsTotal: number };
};

export function summarizePrize(pd: Omit<PrizeDistribution, "summary">): PrizeDistribution {
    const rankRewardsTotal = pd.rankRewards.ranks.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const customRewardsTotal = pd.customRewards.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const killRewardsTotal = Number(pd.killRewards.total) || 0;
    const totalDistributed = rankRewardsTotal + customRewardsTotal + killRewardsTotal;
    return {
        ...pd,
        rankRewards: { ...pd.rankRewards, total: rankRewardsTotal },
        summary: {
            totalDistributed,
            rankRewardsTotal,
            killRewardsTotal,
            customRewardsTotal,
        },
    };
}
