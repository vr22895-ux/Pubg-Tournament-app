# Wallet Feature Setup Guide

This guide will help you set up the wallet feature with Cashfree payment integration for the PUBG Tournament App.

## 🚀 Features Implemented

### ✅ Wallet Management
- **Digital Wallet**: Each user gets a personal wallet for tournament transactions
- **Balance Tracking**: Real-time balance display with transaction history
- **Transaction Management**: Complete transaction history with status tracking

### ✅ Cashfree Payment Integration
- **Add Money**: Users can add money to their wallet using Cashfree payment gateway
- **Secure Payments**: Production-ready payment processing with webhook support
- **Transaction Tracking**: All payments are tracked with unique reference IDs

### ✅ Match Integration
- **Entry Fee Deduction**: Automatic deduction of match entry fees from wallet
- **Balance Validation**: Prevents joining matches with insufficient balance
- **Real-time Updates**: Wallet balance updates immediately after transactions

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pubg-tournament

# Server Configuration
PORT=5050
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Cashfree Payment Gateway Configuration
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Cashfree Configuration

You'll need to configure your Cashfree credentials from the merchant panel:
- **App ID**: Get this from your Cashfree merchant dashboard
- **Secret Key**: Get this from your Cashfree merchant dashboard

### 3. Database Setup

The wallet system uses the following MongoDB collections:
- **Wallets**: Stores user wallet information and balances
- **Transactions**: Embedded in wallet documents for transaction history

### 4. API Endpoints

#### Wallet Management
- `GET /api/wallet/user/:userId` - Get user's wallet
- `POST /api/wallet` - Create new wallet
- `GET /api/wallet/balance/:userId` - Get wallet balance
- `GET /api/wallet/:walletId/transactions` - Get transaction history

#### Payment Processing
- `POST /api/wallet/:walletId/add-money` - Initiate add money payment
- `GET /api/wallet/payment-status/:orderId` - Check payment status
- `POST /api/wallet/webhook/cashfree` - Cashfree webhook handler

#### Match Integration
- `POST /api/wallet/:walletId/deduct-entry-fee` - Deduct match entry fee

## 🎮 How to Use

### For Users

1. **Access Wallet**: Click on the "Wallet" tab in the bottom navigation
2. **Add Money**: 
   - Click "Add Money" button
   - Enter amount (minimum ₹100, maximum ₹50,000)
   - Complete payment on Cashfree gateway
   - Money is added instantly to wallet
3. **Join Matches**: 
   - Select a match from the home screen
   - Click "Join Solo" or "Join with Squad"
   - Entry fee is automatically deducted from wallet
4. **View Transactions**: Check transaction history in the wallet screen

### For Developers

#### Frontend Components
- `app/components/WalletScreen.tsx` - Main wallet interface
- `app/home.tsx` - Match joining with wallet integration

#### Backend Controllers
- `server/controller/walletController.js` - Wallet and payment logic
- `server/schema/Wallet.js` - Wallet data model

## 🔒 Security Features

- **Webhook Verification**: All Cashfree webhooks are verified using HMAC signatures
- **User Authorization**: Wallet operations are restricted to wallet owners
- **Transaction Validation**: All transactions are validated before processing
- **Balance Checks**: Prevents overdrafts and invalid transactions

## 📱 User Interface

### Wallet Screen Features
- **Balance Display**: Large, prominent balance display
- **Quick Actions**: Add money and view transactions
- **Transaction History**: Detailed transaction list with status indicators
- **Payment Process**: Step-by-step payment guidance

### Integration Points
- **Home Screen**: Wallet balance in header, match joining with fee deduction
- **Navigation**: Dedicated wallet tab in bottom navigation
- **Notifications**: Success/error messages for all wallet operations

## 🚨 Important Notes

1. **Cashfree Credentials**: The app is configured with production Cashfree credentials. Make sure to set up proper webhook endpoints in your Cashfree dashboard.

2. **Webhook Setup**: Configure the webhook URL in Cashfree dashboard:
   ```
   https://yourdomain.com/api/wallet/webhook/cashfree
   ```

3. **Environment Variables**: Always use environment variables for sensitive data in production.

4. **Database**: Ensure MongoDB is running and accessible.

5. **CORS**: The server is configured to accept requests from `http://localhost:3000`.

## 🧪 Testing

### Test Payment Flow
1. Start the server: `cd server && npm run dev`
2. Start the frontend: `npm run dev`
3. Login to the app
4. Navigate to Wallet screen
5. Click "Add Money" and enter a test amount
6. Complete payment on Cashfree gateway
7. Verify balance update and transaction history

### Test Match Joining
1. Ensure wallet has sufficient balance
2. Go to Home screen
3. Click on a match
4. Click "Join Solo"
5. Verify entry fee deduction and success message

## 🐛 Troubleshooting

### Common Issues
1. **Wallet not found**: User needs to create a wallet first
2. **Insufficient balance**: User needs to add money to wallet
3. **Payment failed**: Check Cashfree credentials and network connectivity
4. **Webhook not working**: Verify webhook URL and secret in Cashfree dashboard

### Debug Steps
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test API endpoints using Postman or similar tools
4. Check browser console for frontend errors

## 📞 Support

For issues related to:
- **Cashfree Integration**: Check Cashfree documentation and support
- **App Functionality**: Review server logs and database queries
- **Payment Processing**: Verify webhook configuration and credentials

The wallet feature is now fully integrated and ready for use! 🎉
