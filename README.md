# PUBG Tournament App

This is the README file for the PUBG Tournament App, a comprehensive esports tournament management platform designed for PUBG Mobile tournaments. It's a full-stack application that allows users to participate in tournaments, manage squads, handle payments through a digital wallet system, and provides administrative controls for tournament management.

## Features

### Authentication System
- **Multi-step Registration**: Phone/Email → OTP → Profile completion
- **Login Methods**: Email/password and phone/OTP authentication
- **Role Management**: User and Admin roles with different access levels
- **Account Security**: User status management (active, suspended, banned)

### Tournament Management
- **Match Creation**: Admins can create tournaments with custom settings
- **Match Types**: Support for solo and squad-based tournaments
- **Prize System**: Configurable rank rewards and kill-based rewards
- **Match Lifecycle**: Automated status updates (upcoming, live, completed)
- **Results Management**: Upload and manage match results with prize distribution

### Squad System
- **Squad Formation**: Users can create and manage squads (up to 4 members)
- **Member Management**: Invite, remove, and manage squad members
- **Squad Statistics**: Track team wins, kills, and rankings
- **Invitation System**: Send and receive squad invitations with acceptance/decline

### Wallet & Payment System
- **Digital Wallet**: Personal wallet for each user with balance tracking
- **Payment Integration**: Cashfree payment gateway for secure fund additions
- **Transaction History**: Complete transaction tracking and audit trail
- **Match Entry Fees**: Automatic deduction for tournament participation

### Notification System
- **Real-time Updates**: Notifications for match starts, invites, and payments
- **In-App Alerts**: Toast notifications and notification center
- **Status Tracking**: Read/Unread status management

### Leaderboard System
- **Global Rankings**: Track top players across all tournaments
- **Categories**: Top Killers, Top Winners, and Rich List (Prize Money)
- **Real-time Stats**: Aggregated automatically from match results

### Admin Panel
- **User Management**: View, suspend, ban, and manage all users
- **Tournament Control**: Create, edit, and manage tournaments
- **Results Management**: Upload match results and distribute prizes
- **Dashboard**: Overview of platform activity

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: React hooks and local state
- **Styling**: Tailwind CSS with custom animations and gradients

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with OTP verification
- **Payment Gateway**: Cashfree integration for wallet transactions
- **API Design**: RESTful API architecture

## Architecture

The application is divided into two main parts: a Next.js frontend and a Node.js/Express.js backend. The frontend is responsible for rendering the user interface and interacting with the backend API. The backend is responsible for handling business logic, interacting with the database, and providing a RESTful API for the frontend.

## Getting Started

### Prerequisites
- Node.js 16 or higher
- MongoDB 4.4 or higher
- npm or pnpm package manager
- Cashfree payment gateway account (for production)

### Quick Setup
1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: `npm install` (frontend) and `cd server && npm install` (backend)
3. **Environment Setup**: Configure `.env` file in server directory
4. **Database Setup**: Start MongoDB and create initial admin user
5. **Start Servers**: Run both frontend (`npm run dev`) and backend (`cd server && npm run dev`)
6. **Access Application**: Frontend at `http://localhost:3000`, Backend at `http://localhost:5050`

## API Documentation

### Authentication APIs
```
POST /api/auth/register          # User registration
POST /api/auth/login            # User login
POST /api/auth/admin/login      # Admin login
GET  /api/auth/find             # Find user by phone
PUT  /api/auth/profile/update   # Update user profile
```

### Tournament Management APIs
```
GET  /api/matches               # Get all matches
POST /api/matches               # Create new match (admin)
GET  /api/matches/:id           # Get match details
PUT  /api/matches/:id           # Update match (admin)
POST /api/matches/:id/join      # Join tournament
POST /api/matches/:id/results   # Upload results (admin)
```

### Squad Management APIs
```
GET  /api/squads/user/:userId   # Get user's squad
POST /api/squads                # Create squad
POST /api/squads/:id/invite     # Invite to squad
DELETE /api/squads/:id/members/:userId # Remove member
```

### Wallet APIs
```
GET  /api/wallet/user/:userId   # Get user wallet
POST /api/wallet/:id/add-money  # Add money to wallet
GET  /api/wallet/:id/transactions # Get transaction history
POST /api/wallet/:id/deduct-entry-fee # Deduct match fee
```

### Notification & Stats APIs
```
GET  /api/notifications         # Get user notifications
PUT  /api/notifications/:id/read # Mark notification as read
GET  /api/stats/leaderboard     # Get global leaderboard
```

### Admin APIs
```
GET  /api/admin/users           # Get all users
PATCH /api/admin/users/:id/status # Update user status
POST /api/admin/users/:id/ban   # Ban user
POST /api/admin/users/:id/unban # Unban user
```

## Database Schema

### User Collection
- User profile information (name, email, phone, PUBG ID)
- Authentication data (hashed passwords, roles)
- Account status and history
- Registration and activity timestamps

### Match Collection
- Tournament details (name, timing, entry fee, prize pool)
- Match configuration (map, max players, rules)
- Registration tracking and participant lists
- Results and prize distribution data

### Squad Collection
- Squad information (name, leader, members)
- Squad statistics and performance metrics
- Member management and invitation tracking
- Squad status and activity history

### Wallet Collection
- User wallet balances and transaction history
- Payment gateway integration data
- Entry fee deductions and prize distributions
- Financial audit trail and security logs

### Notification Collection
- User notifications and read status
- Notification types and metadata

## User Flow

### New User Registration
1. **Entry Point**: User opens app and chooses registration
2. **Phone/Email**: Enter phone number or email address
3. **OTP Verification**: Receive and verify OTP code
4. **Profile Setup**: Enter PUBG ID, name, and additional details
5. **Account Creation**: User account created and automatically logged in
6. **Wallet Setup**: Automatic wallet creation for the user

### Tournament Participation
1. **Browse Matches**: View available tournaments on home screen
2. **Match Details**: Check entry fee, prize pool, map, and timing
3. **Join Tournament**: Solo join or squad-based participation
4. **Payment**: Entry fee automatically deducted from wallet
5. **Match Participation**: Receive room details and join match
6. **Results**: View results and receive winnings in wallet

## Contributing

We welcome contributions to the PUBG Tournament App! Please see our `CONTRIBUTING.md` file for more information on how to get started.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
