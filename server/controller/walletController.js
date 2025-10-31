const Wallet = require('../schema/Wallet');
const User = require('../schema/User');
const crypto = require('crypto');

// Cashfree API configuration
const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY,
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg',
  webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET
};

// Get user's wallet
const getUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallet = await Wallet.findOne({ userId, status: 'active' });
    
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    res.json({ success: true, data: wallet });
  } catch (error) {
    console.error('Error in getUserWallet:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Create new wallet
const createWallet = async (req, res) => {
  try {
    const { userId, userName, userEmail } = req.body;
    
    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ userId });
    if (existingWallet) {
      return res.status(400).json({ success: false, error: 'Wallet already exists for this user' });
    }
    
    // Create new wallet
    const wallet = new Wallet({
      userId,
      userName,
      userEmail,
      balance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      status: 'active'
    });
    
    await wallet.save();
    
    res.json({ success: true, data: wallet });
  } catch (error) {
    console.error('Error in createWallet:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }
    
    // Sort transactions by creation date (newest first)
    const sortedTransactions = wallet.transactions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: wallet.transactions.length,
        pages: Math.ceil(wallet.transactions.length / limit)
      }
    });
  } catch (error) {
    console.error('Error in getWalletTransactions:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Initiate add money (Cashfree payment)
const initiateAddMoney = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { amount, userId, userEmail, userPhone } = req.body;
    
    console.log('Add money request:', { walletId, amount, userId, userEmail, userPhone });
    
    // Validate required fields
    if (!amount || amount < 1 || amount > 50000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be between ₹1 and ₹50,000' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    if (!userEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'User email is required' 
      });
    }
    
    // Get wallet
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }
    
    // Verify user owns this wallet
    if (wallet.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this wallet' });
    }
    
    // Generate unique order ID
    const orderId = `WALLET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create pending transaction
    wallet.transactions.push({
      type: 'credit',
      amount: amount,
      description: `Add money to wallet - Order: ${orderId}`,
      status: 'pending',
      referenceId: orderId,
      paymentMethod: 'cashfree',
      metadata: {
        orderId: orderId,
        paymentType: 'wallet_recharge'
      }
    });
    
    await wallet.save();
    
    // Prepare Cashfree payment request
    const paymentData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_email: userEmail,
        customer_phone: userPhone || "9999999999"
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet?order_id=${orderId}`
      }
    };
    
  // For development/testing - bypass Cashfree and simulate success
  // NOTE: signature generation depends on a configured CASHFREE secret key.
  // Generate the signature only when performing real Cashfree requests to avoid
  // runtime errors in development/test mode when the secret key is missing.
  if (true) { // Always skip payment for testing
      // Simulate successful payment for testing - don't open real payment URL
      const paymentUrl = `http://localhost:3000/wallet?test_payment=true&order_id=${orderId}&amount=${amount}`;
      
      res.json({
        success: true,
        message: 'Payment initiated successfully (TEST MODE)',
        data: {
          orderId: orderId,
          paymentSessionId: `test_${orderId}`,
          paymentUrl: paymentUrl,
          amount: amount
        },
        paymentUrl: paymentUrl
      });
      return;
    }

    // Generate signature for Cashfree (only for real payment requests)
    const signature = CASHFREE_CONFIG.secretKey
      ? generateCashfreeSignature(paymentData, CASHFREE_CONFIG.secretKey)
      : null;

    // Make request to Cashfree
    const cashfreeResponse = await fetch(`${CASHFREE_CONFIG.apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_CONFIG.appId,
        'x-client-secret': CASHFREE_CONFIG.secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(paymentData)
    });
    
    const cashfreeData = await cashfreeResponse.json();
    
    if (cashfreeData.payment_session_id) {
      // Generate payment URL
      const paymentUrl = `${CASHFREE_CONFIG.apiUrl}/order/${orderId}/pay?payment_session_id=${cashfreeData.payment_session_id}`;
      
      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          orderId: orderId,
          paymentSessionId: cashfreeData.payment_session_id,
          paymentUrl: paymentUrl,
          amount: amount
        },
        paymentUrl: paymentUrl
      });
    } else {
      // Update transaction status to failed
      const transaction = wallet.transactions.find(t => t.referenceId === orderId);
      if (transaction) {
        transaction.status = 'failed';
        await wallet.save();
      }
      
      res.status(400).json({
        success: false,
        error: 'Failed to initiate payment',
        details: cashfreeData
      });
    }
    
  } catch (error) {
    console.error('Error in initiateAddMoney:', error);
    // In development include the actual error message to aid debugging.
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ success: false, error: isProd ? 'Server error' : (error.message || 'Server error') });
  }
};

// Cashfree webhook handler
const handleCashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_CONFIG.webhookSecret)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
    
    const { order_id, order_amount, order_status, payment_mode } = req.body;
    
    console.log('Cashfree webhook received:', { order_id, order_amount, order_status });
    
    // Find wallet with this transaction
    const wallet = await Wallet.findOne({
      'transactions.referenceId': order_id
    });
    
    if (!wallet) {
      console.error('Wallet not found for order:', order_id);
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }
    
    // Update transaction status
    const transaction = wallet.transactions.find(t => t.referenceId === order_id);
    if (transaction) {
      if (order_status === 'PAID') {
        transaction.status = 'success';
        // Update wallet balance
        wallet.balance += order_amount;
        wallet.totalDeposits += order_amount;
        wallet.lastTransactionAt = new Date();
      } else if (order_status === 'FAILED') {
        transaction.status = 'failed';
      }
      
      await wallet.save();
      console.log('Wallet updated for order:', order_id);
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Error in handleCashfreeWebhook:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Check payment status
const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find wallet with this transaction
    const wallet = await Wallet.findOne({
      'transactions.referenceId': orderId
    });
    
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    const transaction = wallet.transactions.find(t => t.referenceId === orderId);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    res.json({
      success: true,
      data: {
        status: transaction.status,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error in checkPaymentStatus:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Deduct money for match entry
const deductMatchEntryFee = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { amount, matchId, matchName } = req.body;
    
    // Get wallet
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }
    
    // Check if user can afford the entry fee
    if (!wallet.canAfford(amount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance',
        required: amount,
        available: wallet.balance
      });
    }
    
    // Deduct money
    await wallet.deductMoney(amount, `Match entry fee - ${matchName}`, `MATCH_${matchId}_${Date.now()}`);
    
    res.json({
      success: true,
      message: 'Entry fee deducted successfully',
      data: {
        newBalance: wallet.balance,
        deductedAmount: amount,
        matchId: matchId
      }
    });
    
  } catch (error) {
    console.error('Error in deductMatchEntryFee:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallet = await Wallet.findOne({ userId, status: 'active' });
    
    if (!wallet) {
      return res.json({ success: true, data: { balance: 0, canCreateWallet: true } });
    }
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        canCreateWallet: false,
        walletId: wallet._id
      }
    });
    
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Helper function to generate Cashfree signature
const generateCashfreeSignature = (payload, secretKey) => {
  const data = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('hex');
};

module.exports = {
  getUserWallet,
  createWallet,
  getWalletTransactions,
  initiateAddMoney,
  handleCashfreeWebhook,
  checkPaymentStatus,
  deductMatchEntryFee,
  getWalletBalance
};
