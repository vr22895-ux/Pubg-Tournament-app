const mongoose = require('mongoose');

const SquadMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  pubgId: { type: String, required: true, trim: true },
  role: { type: String, enum: ['leader', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 }
  }
});

const SquadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [SquadMemberSchema],
  maxMembers: { type: Number, default: 4, min: 2, max: 8 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  stats: {
    totalMatches: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
    rank: { type: Number, default: 0 }
  }
}, { timestamps: true });

SquadSchema.index({ name: 1 });
SquadSchema.index({ leader: 1 });
SquadSchema.index({ 'members.userId': 1 });

module.exports = mongoose.models.Squad || mongoose.model('Squad', SquadSchema);
