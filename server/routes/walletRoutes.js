const express = require('express');
const router = express.Router();
const walletController = require('../controller/walletController');
const userAuth = require('../middleware/userAuth');

// Secure routes
router.get('/my-wallet', userAuth, walletController.getMyWallet);
router.post('/', userAuth, walletController.createWallet);
router.post('/add-money', userAuth, walletController.initiateAddMoney);

// Public/Mixed routes (Some might need protection in future)
router.get('/user/:userId', walletController.getUserWallet);
router.get('/balance/:userId', walletController.getWalletBalance);
router.get('/:walletId/transactions', walletController.getWalletTransactions);
router.post('/:walletId/add-money', walletController.initiateAddMoney); // Legacy/Alternative
router.post('/:walletId/deduct-entry-fee', walletController.deductMatchEntryFee);
router.get('/payment-status/:orderId', walletController.checkPaymentStatus);
router.post('/webhook/cashfree', walletController.handleCashfreeWebhook);

module.exports = router;
