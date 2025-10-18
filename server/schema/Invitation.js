const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  squadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Squad',
    required: true
  },
  squadName: {
    type: String,
    required: true
  },
  invitedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedByName: {
    type: String,
    required: true
  },
  invitedByPubgId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['invitation', 'join_request'],
    default: 'invitation'
  }
}, {
  timestamps: true
});

// Index for efficient queries
invitationSchema.index({ invitedUserId: 1, status: 1 });
invitationSchema.index({ squadId: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Auto-expire invitations (TTL index)
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invitation', invitationSchema);
