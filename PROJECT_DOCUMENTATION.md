# PUBG Tournament App - Complete Project Documentation

## 🎯 Project Overview

The PUBG Tournament App is a comprehensive esports tournament management platform designed for PUBG Mobile tournaments. It features a full-stack architecture with user management, tournament organization, squad systems, wallet integration, and administrative controls.

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: React hooks and local storage
- **Mobile Support**: React Native components for mobile app
- **Styling**: Tailwind CSS with custom animations

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with OTP verification
- **Payment Gateway**: Cashfree integration for wallet transactions
- **API Architecture**: RESTful API with comprehensive error handling

#### Development Tools
- **Package Manager**: npm/pnpm
- **Development Server**: Next.js dev server + Nodemon for backend
- **Database**: MongoDB (local or cloud)
- **Environment**: Cross-platform (Windows/macOS/Linux)

## 📱 Application Features

### 🔐 Authentication System
- **Multi-step Registration**: Phone/Email → OTP → Profile completion
- **Login Methods**: Email/password and phone/OTP
- **Role-based Access**: User and Admin roles
- **Account Security**: Status management (active, suspended, banned)

### 🏆 Tournament Management
- **Match Creation**: Admins can create tournaments with custom settings
- **Match Types**: Solo and squad-based tournaments
- **Prize Distribution**: Configurable rank rewards and kill rewards
- **Match Status**: Automated status updates (upcoming, live, completed)
- **Results Management**: Upload and manage match results

### 👥 Squad System
- **Squad Creation**: Users can create and manage squads (up to 4 members)
- **Member Management**: Invite, remove, and manage squad members
- **Squad Statistics**: Track wins, kills, and rankings
- **Invitation System**: Send and receive squad invitations

### 💰 Wallet & Payment System
- **Digital Wallet**: Personal wallet for each user
- **Payment Integration**: Cashfree payment gateway for adding funds
- **Transaction History**: Complete transaction tracking
- **Match Entry Fees**: Automatic deduction for tournament participation
- **Instant Withdrawals**: Support for quick fund withdrawals

### 🛡️ Admin Panel
- **User Management**: View, suspend, ban, and manage all users
- **Tournament Control**: Create, edit, and manage tournaments
- **Results Management**: Upload match results and distribute prizes
- **Analytics Dashboard**: User statistics and platform metrics

## 📂 Project Structure

```
pubg-tournament-app/
├── app/                          # Next.js frontend
│   ├── components/              # Reusable UI components
│   │   ├── SquadScreen.tsx     # Squad management interface
│   │   ├── WalletScreen.tsx    # Wallet and payment interface
│   │   └── ui/                 # Radix UI components
│   ├── AdminPanel.tsx          # Admin dashboard
│   ├── home.tsx               # Main tournament lobby
│   ├── LoginScreen.tsx        # Authentication interface
│   ├── page.tsx              # Main app router
│   └── globals.css           # Global styles
├── server/                      # Backend API server
│   ├── controller/             # API route handlers
│   │   ├── authController.js   # Authentication logic
│   │   ├── matchController.js  # Tournament management
│   │   ├── squadController.js  # Squad operations
│   │   ├── userController.js   # User management
│   │   ├── walletController.js # Payment processing
│   │   └── invitationController.js # Invitation system
│   ├── schema/                 # MongoDB data models
│   │   ├── User.js            # User data model
│   │   ├── matchSchema.js     # Tournament data model
│   │   ├── Squad.js           # Squad data model
│   │   ├── Wallet.js          # Wallet data model
│   │   └── Invitation.js      # Invitation data model
│   ├── middleware/            # Authentication middleware
│   └── server.js             # Express server setup
├── components/                 # Shared UI components
├── hooks/                     # Custom React hooks
├── lib/                      # Utility functions
├── public/                   # Static assets
└── styles/                   # Additional stylesheets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pubg-tournament-app
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Environment Configuration**
   
   Create `server/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/pubg-tournament
   PORT=5050
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Cashfree Payment Gateway
   CASHFREE_APP_ID=your_app_id
   CASHFREE_SECRET_KEY=your_secret_key
   CASHFREE_WEBHOOK_SECRET=your_webhook_secret
   
   # OTP Service
   OTP_API_URL=http://localhost:5050
   ```

5. **Database Setup**
   ```bash
   # Start MongoDB service
   # Create initial admin user
   cd server
   npm run create-admin
   ```

6. **Start Development Servers**
   ```bash
   # Terminal 1: Backend server
   cd server
   npm run dev
   
   # Terminal 2: Frontend server
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050
   - Admin Panel: Login with admin credentials

## 🔧 API Documentation

### Authentication Endpoints
```
POST /api/auth/register          # User registration
POST /api/auth/login            # User login
POST /api/auth/admin/login      # Admin login
GET  /api/auth/find             # Find user by phone
PUT  /api/auth/profile/update   # Update user profile
```

### Tournament Management
```
GET  /api/matches               # Get all matches
POST /api/matches               # Create new match
GET  /api/matches/:id           # Get match details
PUT  /api/matches/:id           # Update match
POST /api/matches/:id/join      # Join tournament
POST /api/matches/:id/results   # Upload results
```

### Squad Management
```
GET  /api/squads/user/:userId   # Get user's squad
POST /api/squads                # Create squad
POST /api/squads/:id/invite     # Invite to squad
DELETE /api/squads/:id/members/:userId # Remove member
```

### Wallet Operations
```
GET  /api/wallet/user/:userId   # Get user wallet
POST /api/wallet/:id/add-money  # Add money to wallet
GET  /api/wallet/:id/transactions # Get transaction history
POST /api/wallet/:id/deduct-entry-fee # Deduct match fee
```

### Admin Operations
```
GET  /api/admin/users           # Get all users
PATCH /api/admin/users/:id/status # Update user status
POST /api/admin/users/:id/ban   # Ban user
POST /api/admin/users/:id/unban # Unban user
```

## 🎮 User Journey

### New User Registration
1. **Phone/Email Entry**: User enters phone number or email
2. **OTP Verification**: Receive and verify OTP code
3. **Profile Completion**: Enter PUBG ID, name, and additional details
4. **Account Creation**: User account is created and logged in

### Tournament Participation
1. **Browse Matches**: View available tournaments on home screen
2. **Check Requirements**: View entry fee, prize pool, and match details
3. **Join Tournament**: Solo join or squad-based participation
4. **Payment Processing**: Entry fee deducted from wallet
5. **Match Participation**: Receive room details and participate
6. **Results**: View results and receive winnings

### Squad Management
1. **Create Squad**: Form a squad with friends
2. **Invite Members**: Send invitations to other players
3. **Manage Team**: Add/remove members, track statistics
4. **Tournament Entry**: Join tournaments as a complete squad

### Wallet Management
1. **Add Funds**: Use Cashfree gateway to add money
2. **Track Transactions**: View complete transaction history
3. **Tournament Payments**: Automatic entry fee deductions
4. **Withdraw Funds**: Request withdrawals to bank account

## 🛡️ Security Features

### User Security
- **Password Hashing**: bcrypt for secure password storage
- **OTP Verification**: SMS/WhatsApp OTP for phone verification
- **Session Management**: JWT tokens for authentication
- **Input Validation**: Server-side validation for all inputs

### Payment Security
- **Cashfree Integration**: PCI-compliant payment processing
- **Webhook Verification**: HMAC signature verification
- **Transaction Tracking**: Complete audit trail for all transactions
- **Balance Validation**: Prevent overdrafts and invalid transactions

### Admin Security
- **Role-based Access**: Separate admin authentication
- **Action Logging**: All admin actions are logged
- **User Status Control**: Suspend/ban capabilities with reasons
- **Data Protection**: Sensitive data is properly secured

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String (unique),
  pubgId: String (unique),
  password: String (hashed),
  role: String (user/admin),
  status: String (active/suspended/banned),
  statusHistory: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Match Collection
```javascript
{
  _id: ObjectId,
  name: String,
  startTime: Date,
  entryFee: Number,
  prizePool: Number,
  maxPlayers: Number,
  map: String,
  status: String,
  registrations: Array,
  results: Object,
  createdAt: Date
}
```

### Squad Collection
```javascript
{
  _id: ObjectId,
  name: String,
  leader: ObjectId,
  members: Array,
  maxMembers: Number,
  stats: Object,
  status: String,
  createdAt: Date
}
```

### Wallet Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  balance: Number,
  transactions: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Development Workflow

### Frontend Development
1. **Component Development**: Create reusable UI components
2. **State Management**: Use React hooks for state management
3. **API Integration**: Connect with backend APIs
4. **Responsive Design**: Ensure mobile-first responsive design
5. **Testing**: Test components and user flows

### Backend Development
1. **API Design**: Create RESTful API endpoints
2. **Database Modeling**: Design efficient MongoDB schemas
3. **Business Logic**: Implement tournament and payment logic
4. **Error Handling**: Comprehensive error handling and validation
5. **Testing**: API testing and edge case handling

### Deployment
1. **Environment Setup**: Configure production environment variables
2. **Database Migration**: Set up production MongoDB instance
3. **Payment Gateway**: Configure production Cashfree credentials
4. **Server Deployment**: Deploy backend to cloud platform
5. **Frontend Deployment**: Deploy Next.js app to Vercel/Netlify

## 🚨 Known Issues & Limitations

### Current Limitations
- **Real-time Updates**: No WebSocket implementation for live updates
- **Mobile App**: React Native components are basic implementations
- **Advanced Analytics**: Limited reporting and analytics features
- **Notification System**: Basic notification system needs enhancement

### Planned Improvements
- **WebSocket Integration**: Real-time match updates and notifications
- **Advanced Mobile App**: Full React Native implementation
- **Enhanced Analytics**: Comprehensive reporting dashboard
- **Tournament Brackets**: Advanced tournament bracket system
- **Live Streaming**: Integration with streaming platforms

## 🧪 Testing

### Manual Testing
1. **User Registration**: Test complete registration flow
2. **Tournament Participation**: Join and participate in tournaments
3. **Squad Operations**: Create, manage, and participate with squads
4. **Payment Processing**: Test wallet operations and payments
5. **Admin Functions**: Test all admin panel features

### Automated Testing
```bash
# Backend API testing
cd server
node test-squad.js
node test-squad-edge-cases.js
node test-wallet.js

# Frontend component testing
npm run test
```

## 📞 Support & Maintenance

### Common Issues
1. **Database Connection**: Ensure MongoDB is running
2. **Payment Failures**: Check Cashfree credentials and webhook setup
3. **OTP Issues**: Verify OTP service configuration
4. **Authentication Problems**: Check JWT token handling

### Maintenance Tasks
- **Database Backups**: Regular MongoDB backups
- **Log Monitoring**: Monitor server logs for errors
- **Performance Optimization**: Database query optimization
- **Security Updates**: Regular dependency updates

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow existing code patterns and conventions
2. **Documentation**: Update documentation for new features
3. **Testing**: Add tests for new functionality
4. **Error Handling**: Implement comprehensive error handling
5. **Security**: Follow security best practices

### Feature Development Process
1. **Requirements Analysis**: Understand feature requirements
2. **Design Planning**: Plan database and API changes
3. **Implementation**: Develop backend and frontend components
4. **Testing**: Comprehensive testing of new features
5. **Documentation**: Update project documentation

---

This PUBG Tournament App provides a complete esports tournament management solution with modern web technologies, secure payment processing, and comprehensive administrative controls. The platform is designed to scale and can be extended with additional features as needed.