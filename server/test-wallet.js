const mongoose = require('mongoose');
const Wallet = require('./schema/Wallet');
const User = require('./schema/User');

// Test wallet functionality
async function testWallet() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pubg_tournament');
    console.log('Connected to MongoDB');
    
    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      pubgId: 'TestPlayer123',
      phone: '9999999999'
    });
    
    await testUser.save();
    console.log('Test user created:', testUser._id);
    
    // Create a test wallet
    const testWallet = new Wallet({
      userId: testUser._id,
      userName: testUser.name,
      userEmail: testUser.email,
      balance: 1000, // Start with ₹1000
      totalDeposits: 1000,
      totalWithdrawals: 0,
      status: 'active'
    });
    
    await testWallet.save();
    console.log('Test wallet created:', testWallet._id);
    console.log('Initial balance:', testWallet.balance);
    
    // Test adding money
    await testWallet.addMoney(500, 'Test deposit', 'TEST_DEPOSIT_001');
    console.log('After adding ₹500, balance:', testWallet.balance);
    
    // Test deducting money
    await testWallet.deductMoney(200, 'Test withdrawal', 'TEST_WITHDRAWAL_001');
    console.log('After deducting ₹200, balance:', testWallet.balance);
    
    // Test insufficient balance
    try {
      await testWallet.deductMoney(2000, 'Should fail', 'TEST_FAIL_001');
    } catch (error) {
      console.log('Expected error for insufficient balance:', error.message);
    }
    
    // Display final wallet state
    console.log('\nFinal wallet state:');
    console.log('Balance:', testWallet.balance);
    console.log('Total deposits:', testWallet.totalDeposits);
    console.log('Total withdrawals:', testWallet.totalWithdrawals);
    console.log('Transaction count:', testWallet.transactionCount);
    
    // Display transactions
    console.log('\nTransactions:');
    testWallet.transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type.toUpperCase()} - ₹${tx.amount} - ${tx.description} - ${tx.status}`);
    });
    
    // Clean up test data
    await Wallet.findByIdAndDelete(testWallet._id);
    await User.findByIdAndDelete(testUser._id);
    console.log('\nTest data cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testWallet();
}

module.exports = { testWallet };
