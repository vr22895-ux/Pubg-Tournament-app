const mongoose = require('mongoose');
const Match = require('../schema/matchSchema');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const seedLeaderboard = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a completed match with results
        const match = new Match({
            name: "PUBG Mobile India Series 2024 - Grand Finals",
            entryFee: 100,
            prizePool: 10000,
            maxPlayers: 100,
            map: "Erangel",
            startTime: new Date(Date.now() - 86400000), // Yesterday
            status: "completed",
            prizeDistribution: {
                rankRewards: {
                    total: 5000,
                    ranks: [
                        { rank: "1st Place", amount: 2500 },
                        { rank: "2nd Place", amount: 1500 },
                        { rank: "3rd Place", amount: 1000 },
                        { rank: "4th Place", amount: 0 },
                        { rank: "5th Place", amount: 0 }
                    ]
                },
                killRewards: { total: 4000, perKill: 50, maxKills: 80 },
                customRewards: [{ name: "MVP", amount: 1000 }],
                summary: {
                    totalDistributed: 10000,
                    rankRewardsTotal: 5000,
                    killRewardsTotal: 4000,
                    customRewardsTotal: 1000
                }
            },
            results: {
                isCompleted: true,
                completedAt: new Date(),
                totalParticipants: 80,
                matchDuration: 35,
                squadRankings: [
                    {
                        rank: 1,
                        squadName: "Team Soul",
                        kills: 25,
                        damage: 3500,
                        survivalTime: 1800,
                        prizeAmount: 3750, // 2500 rank + 1250 kills
                        players: [
                            { pubgId: "Mortal", kills: 10, individualPrize: 500 },
                            { pubgId: "Viper", kills: 5, individualPrize: 250 },
                            { pubgId: "Regaltos", kills: 6, individualPrize: 300 },
                            { pubgId: "Scout", kills: 4, individualPrize: 200 }
                        ]
                    },
                    {
                        rank: 2,
                        squadName: "GodLike",
                        kills: 20,
                        damage: 3000,
                        survivalTime: 1750,
                        prizeAmount: 2500, // 1500 rank + 1000 kills
                        players: [
                            { pubgId: "Jonathan", kills: 12, individualPrize: 600 },
                            { pubgId: "ClutchGod", kills: 3, individualPrize: 150 },
                            { pubgId: "Zgod", kills: 3, individualPrize: 150 },
                            { pubgId: "Neyoo", kills: 2, individualPrize: 100 }
                        ]
                    },
                    {
                        rank: 3,
                        squadName: "Team XSpark",
                        kills: 15,
                        damage: 2500,
                        survivalTime: 1600,
                        prizeAmount: 1750, // 1000 rank + 750 kills
                        players: [
                            { pubgId: "Mavi", kills: 5, individualPrize: 250 },
                            { pubgId: "Gill", kills: 4, individualPrize: 200 },
                            { pubgId: "Ultron", kills: 3, individualPrize: 150 },
                            { pubgId: "Pukar", kills: 3, individualPrize: 150 }
                        ]
                    }
                ],
                specialAwards: [
                    { name: "MVP", recipient: "Jonathan", amount: 1000 }
                ]
            }
        });

        // Bypass validation for registeredPlayers requirement if any (schema says required but let's see)
        // Actually registeredPlayers.userId is required. We need dummy ObjectIds.
        const dummyId = new mongoose.Types.ObjectId();
        match.registeredPlayers = [
            { userId: dummyId, userName: "Mortal", pubgId: "Mortal", entryFeePaid: true, status: 'confirmed' }
        ];

        await match.save();
        console.log('Seed match created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedLeaderboard();
