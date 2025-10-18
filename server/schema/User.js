const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: false,        // Not required for admin users
      unique: false,          // Allow users to re-register with same phone
      index: true,
      trim: true,
      sparse: true,           // Allow multiple null values for admin users
    },
    pubgId: {
      type: String,
      required: false,        // required at registration; kept optional to allow pre-creation
      unique: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,        // Required for user authentication
      unique: true,          // Enforce unique emails for users
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,        // Required for user authentication
      trim: true,
    },

    // Admin fields
    role: { 
      type: String, 
      enum: ['user', 'admin'], 
      default: 'user', 
      index: true 
    },
    adminEmail: {
      type: String,
      required: false,
      unique: true,
      sparse: true,           // Allow multiple null values for regular users
      lowercase: true,
      trim: true,
    },
    adminPassword: {
      type: String,
      required: false,
      trim: true,
    },

    // optional profile & status fields
    name: { 
      type: String, 
      required: true,  // Required for user accounts
      trim: true,
      index: true
    },
    status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active', index: true },
    
    // User management fields
    banReason: { type: String, trim: true },
    banExpiry: { type: Date },
    adminNotes: { type: String, trim: true },
    statusHistory: [{
      status: { type: String, enum: ['active', 'suspended', 'banned'], required: true },
      reason: { type: String, trim: true, required: true },
      adminNotes: { type: String, trim: true },
      changedAt: { type: Date, default: Date.now }
    }],

    // Squad fields
    squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' },
    squadRole: { type: String, enum: ['leader', 'member'], default: 'member' },
    
    // audit
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// If you plan to allow email duplicates, keep as-is; otherwise ensure unique index.
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
