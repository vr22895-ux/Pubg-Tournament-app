const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  entryFee: { type: Number, required: true, min: 0 },
  prizePool: { type: Number, required: true, min: 0 },
  maxPlayers: { type: Number, required: true, min: 1, max: 100 },
  map: { type: String, required: true, enum: ["Erangel", "Sanhok", "Miramar", "Vikendi"] },
  startTime: { type: Date, required: true },
  prizeDistribution: {
    rankRewards: {
      total: { type: Number, required: true, min: 0 },
      ranks: [{
        rank: { type: String, required: true, enum: ["1st Place", "2nd Place", "3rd Place", "4th Place", "5th Place"] },
        amount: { type: Number, required: true, min: 0 },
      }],
    },
    killRewards: {
      total: { type: Number, required: true, min: 0 },
      perKill: { type: Number, required: true, min: 0 },
      maxKills: { type: Number, required: true, min: 0 },
    },
    customRewards: [{
      name: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0 },
    }],
    summary: {
      totalDistributed: { type: Number, required: true, min: 0 },
      rankRewardsTotal: { type: Number, required: true, min: 0 },
      killRewardsTotal: { type: Number, required: true, min: 0 },
      customRewardsTotal: { type: Number, required: true, min: 0 },
    },
  },
  status: { type: String, default: "upcoming", enum: ["upcoming", "live", "completed", "cancelled"] },

  // Player Registrations
  registeredPlayers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    pubgId: { type: String, required: true },
    squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' },
    squadName: { type: String },
    registrationTime: { type: Date, default: Date.now },
    entryFeePaid: { type: Boolean, default: false },
    paymentReference: { type: String },
    status: { type: String, enum: ['registered', 'confirmed', 'cancelled'], default: 'registered' }
  }],

  // Match Results
  results: {
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    squadRankings: [{
      rank: { type: Number, required: true, min: 1, max: 100 },
      squadName: { type: String, required: true, trim: true },
      kills: { type: Number, required: true, min: 0 },
      damage: { type: Number, min: 0 },
      survivalTime: { type: Number, min: 0 }, // in seconds
      prizeAmount: { type: Number, required: true, min: 0 },
      players: [{
        pubgId: { type: String, required: true, trim: true },
        kills: { type: Number, min: 0 },
        damage: { type: Number, min: 0 },
        survivalTime: { type: Number, min: 0 },
        individualPrize: { type: Number, min: 0 },
      }],
    }],
    totalParticipants: { type: Number, min: 0 },
    matchDuration: { type: Number, min: 0 }, // in seconds
    specialAwards: [{
      name: { type: String, required: true, trim: true },
      recipient: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0 },
    }],
    notes: { type: String, trim: true },
  },
}, { timestamps: true });

// Validate distribution & timestamps
matchSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  const rankRewardsTotal = (this.prizeDistribution.rankRewards.ranks || [])
    .reduce((s, r) => s + (r.amount || 0), 0);
  const customRewardsTotal = (this.prizeDistribution.customRewards || [])
    .reduce((s, r) => s + (r.amount || 0), 0);
  const killRewardsTotal = this.prizeDistribution.killRewards.total || 0;

  if (rankRewardsTotal !== this.prizeDistribution.rankRewards.total)
    return next(new Error("Rank rewards total mismatch"));

  if (customRewardsTotal !== this.prizeDistribution.summary.customRewardsTotal)
    return next(new Error("Custom rewards total mismatch"));

  const totalDistributed = rankRewardsTotal + customRewardsTotal + killRewardsTotal;
  if (totalDistributed !== this.prizeDistribution.summary.totalDistributed)
    return next(new Error("Total distributed amount mismatch"));

  if (totalDistributed > this.prizePool)
    return next(new Error("Total distributed amount exceeds prize pool"));

  next();
});

// Indexes for efficient queries
matchSchema.index({ status: 1 });
matchSchema.index({ startTime: 1 });
matchSchema.index({ "registeredPlayers.userId": 1 });
matchSchema.index({ "registeredPlayers.status": 1 });

module.exports = mongoose.model("Match", matchSchema);
