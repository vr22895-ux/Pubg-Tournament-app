const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  referenceId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'cashfree'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const WalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposits: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  transactions: [TransactionSchema],
  lastTransactionAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
WalletSchema.index({ userId: 1 });
WalletSchema.index({ userEmail: 1 });
WalletSchema.index({ status: 1 });
WalletSchema.index({ 'transactions.createdAt': -1 });

// Virtual for transaction count
WalletSchema.virtual('transactionCount').get(function() {
  return this.transactions.length;
});

// Method to add money
WalletSchema.methods.addMoney = function(amount, description, referenceId) {
  this.balance += amount;
  this.totalDeposits += amount;
  this.transactions.push({
    type: 'credit',
    amount: amount,
    description: description,
    status: 'success',
    referenceId: referenceId,
    paymentMethod: 'cashfree'
  });
  this.lastTransactionAt = new Date();
  return this.save();
};

// Method to deduct money
WalletSchema.methods.deductMoney = function(amount, description, referenceId) {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.totalWithdrawals += amount;
  this.transactions.push({
    type: 'debit',
    amount: amount,
    description: description,
    status: 'success',
    referenceId: referenceId,
    paymentMethod: 'system'
  });
  this.lastTransactionAt = new Date();
  return this.save();
};

// Method to check if user can afford entry fee
WalletSchema.methods.canAfford = function(amount) {
  return this.balance >= amount;
};

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
