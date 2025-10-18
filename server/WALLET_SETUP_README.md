# Wallet System Setup Guide

## Overview
This wallet system integrates with Cashfree Payment Gateway to allow users to add money to their wallets and participate in PUBG tournaments with entry fees.

## Features
- ✅ Add money to wallet via Cashfree
- ✅ View transaction history
- ✅ Automatic balance deduction for match entry fees
- ✅ Secure payment processing
- ✅ Real-time balance updates

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the server directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pubg_tournament

# Server Configuration
PORT=5050
NODE_ENV=development

# Cashfree API Configuration
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend URL (for payment return URLs)
FRONTEND_URL=http://localhost:3000
```

### 2. Cashfree API Setup
1. Sign up for a Cashfree account at [cashfree.com](https://cashfree.com)
2. Get your App ID and Secret Key from the Cashfree dashboard
3. Set up webhook endpoints in your Cashfree dashboard:
   - Webhook URL: `https://yourdomain.com/api/wallet/webhook/cashfree`
   - Webhook Secret: Generate a secure secret and add it to your .env file

### 3. API Endpoints

#### Wallet Management
- `GET /api/wallet/user/:userId` - Get user's wallet
- `POST /api/wallet` - Create new wallet
- `GET /api/wallet/balance/:userId` - Get wallet balance

#### Transactions
- `GET /api/wallet/:walletId/transactions` - Get transaction history
- `POST /api/wallet/:walletId/add-money` - Initiate add money payment
- `GET /api/wallet/payment-status/:orderId` - Check payment status

#### Match Entry
- `POST /api/wallet/:walletId/deduct-entry-fee` - Deduct match entry fee

#### Webhooks
- `POST /api/wallet/webhook/cashfree` - Cashfree payment webhook

### 4. Frontend Integration
The wallet system is integrated into the main app with:
- Wallet screen component (`app/components/WalletScreen.tsx`)
- Automatic wallet creation for new users
- Real-time balance updates
- Transaction history display

### 5. Match Entry Fee Integration
When users join matches:
1. System checks if user has sufficient balance
2. Automatically deducts entry fee from wallet
3. Creates transaction record
4. Updates wallet balance in real-time

## Security Features
- Webhook signature verification
- User authorization checks
- Secure payment processing
- Transaction logging and audit trail

## Testing
- Use Cashfree sandbox environment for testing
- Test webhook endpoints with Cashfree's webhook testing tools
- Verify payment flows end-to-end

## Production Deployment
1. Update environment variables for production
2. Use production Cashfree API endpoints
3. Set up proper SSL certificates
4. Configure production webhook URLs
5. Monitor webhook delivery and payment processing

## Support
For issues or questions about the wallet system, check:
1. Server logs for error messages
2. Cashfree dashboard for payment status
3. MongoDB for transaction records
4. Network tab for API call failures
