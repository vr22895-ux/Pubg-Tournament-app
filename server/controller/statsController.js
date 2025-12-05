const Match = require('../schema/matchSchema');

// Get Leaderboard Stats
exports.getLeaderboard = async (req, res) => {
    try {
        const { type = 'kills', limit = 50 } = req.query;

        // Define sort criteria based on type
        let sortStage = {};
        if (type === 'kills') sortStage = { totalKills: -1 };
        else if (type === 'wins') sortStage = { totalWins: -1 };
        else if (type === 'money') sortStage = { totalPrize: -1 };
        else sortStage = { totalKills: -1 }; // Default

        const pipeline = [
            // 1. Filter only completed matches
            { $match: { "status": "completed" } },

            // 2. Unwind squad rankings to get each squad's result
            { $unwind: "$results.squadRankings" },

            // 3. Unwind players to get individual stats
            { $unwind: "$results.squadRankings.players" },

            // 4. Group by PUBG ID to aggregate stats
            {
                $group: {
                    _id: "$results.squadRankings.players.pubgId",
                    playerName: { $first: "$results.squadRankings.players.pubgId" }, // Using PUBG ID as name for now, or could fetch User name if joined
                    totalKills: { $sum: "$results.squadRankings.players.kills" },
                    totalPrize: { $sum: "$results.squadRankings.players.individualPrize" },
                    matchesPlayed: { $sum: 1 },
                    // Count wins: if rank is 1, add 1, else 0
                    totalWins: {
                        $sum: {
                            $cond: [{ $eq: ["$results.squadRankings.rank", 1] }, 1, 0]
                        }
                    }
                }
            },

            // 5. Sort based on requested type
            { $sort: sortStage },

            // 6. Limit results
            { $limit: parseInt(limit) }
        ];

        const leaderboard = await Match.aggregate(pipeline);

        res.json({
            success: true,
            data: leaderboard
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
