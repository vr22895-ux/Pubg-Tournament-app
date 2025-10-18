# PUBG Tournament App - Server

A comprehensive tournament management system with full admin capabilities for PUBG tournaments.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the server directory:
```env
MONGODB_URI=mongodb://localhost:27017/pubg-tournament
PORT=5050
OTP_API_URL=http://localhost:5050
```

### 3. Create Admin User
After setting up MongoDB and running the server, create the initial admin user:
```bash
npm run create-admin
```

This creates an admin user with:
- **Email**: admin@pubgarena.com
- **Password**: admin123
- **Role**: admin

⚠️ **IMPORTANT**: Change the password after first login!

### 4. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 🔐 Authentication & Authorization

### User Authentication
- `POST /api/auth/register` - User registration with OTP verification
- `POST /api/auth/login` - User login (blocks suspended/banned users)
- `GET /api/auth/find` - Find user by phone number
- `GET /api/auth/check-login-eligibility/:userId` - Check if user can login

### Admin Authentication
- `POST /api/auth/admin/login` - Admin login with email/password
- `POST /api/auth/admin/create` - Create new admin (protected endpoint)

### Profile Management
- `PUT /api/auth/profile/update` - Update user profile (name, email)
- `POST /api/auth/profile/verify-phone` - Verify and update phone number

## 🏆 Tournament Management

### Match Operations
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create new tournament match
- `GET /api/matches/management` - Get matches for admin management
- `GET /api/matches/completed` - Get completed matches
- `GET /api/matches/:matchId` - Get specific match details
- `PUT /api/matches/:matchId` - Update match details
- `POST /api/matches/:matchId/cancel` - Cancel a match
- `DELETE /api/matches/:matchId` - Delete a match
- `POST /api/matches/:matchId/results` - Upload match results
- `GET /api/matches/:matchId/results` - Get match results
- `PATCH /api/matches/:matchId/status` - Update match status

### Automated Features
- `POST /api/matches/auto-update-statuses` - Auto-update match statuses

## 👥 User Management (Admin Only)

### User Operations
- `GET /api/admin/users` - Get paginated list of users with filtering
- `GET /api/admin/users/:userId` - Get detailed user information
- `PATCH /api/admin/users/:userId/status` - Update user status
- `POST /api/admin/users/:userId/ban` - Ban user with reason and duration
- `POST /api/admin/users/:userId/unban` - Unban user
- `GET /api/admin/users/:userId/reports` - Get user reports

## 🛡️ Security Features

### Login Protection
- **Suspended Users**: Cannot login, receive clear error message
- **Banned Users**: Cannot login, receive detailed ban information
- **Status Validation**: All login attempts check user status first
- **Detailed Error Messages**: Users get specific information about account status

### Admin Security
- Admin passwords are hashed using bcrypt
- Admin endpoints are protected with middleware
- User roles are enforced at the API level
- Phone numbers are validated and sanitized

## 📊 Admin Panel Features

### 1. **Create Tab**
- Create new tournament matches
- Set prize distribution (rank rewards, kill rewards, custom rewards)
- Configure match settings (entry fee, max players, date/time)
- Real-time prize distribution validation

### 2. **Manage Tab**
- View all created matches with status indicators
- Edit match details (full-screen editing capability)
- Cancel matches (prevents updates to live/completed matches)
- Delete matches (with safety checks)
- Real-time status updates

### 3. **Results Tab**
- Upload match results for completed matches
- View match statistics and player performance
- Auto-update match statuses
- Handle prize distribution calculations

### 4. **Users Tab**
- View all users with comprehensive information
- Search and filter users by various criteria
- Suspend users with reason and admin notes
- Ban users with reason and duration (temporary/permanent)
- Unban users and restore access
- View detailed user profiles including:
  - Game statistics and match history
  - Status change history
  - Admin notes and ban information
  - Account activity tracking

## 🔒 User Status Management

### Status Types
- **Active**: Normal user, can login and participate
- **Suspended**: Temporary restriction, cannot login
- **Banned**: Permanent or temporary ban, cannot login

### Status Operations
- **Suspend**: Temporary restriction with reason and admin notes
- **Ban**: Permanent or time-limited ban with reason
- **Unban**: Restore user access and log restoration
- **Status History**: Complete audit trail of all status changes

### Ban Features
- **Temporary Bans**: Set specific expiry dates
- **Permanent Bans**: No expiry date
- **Ban Reasons**: Required reason for all bans
- **Admin Notes**: Additional context for status changes

## 📱 OTP System

### OTP Operations
- `POST /api/otp/send` - Send OTP to phone number
- `GET /api/otp/verify` - Verify OTP code
- `GET /api/otp/validate` - Alternative OTP validation endpoint

### OTP Features
- SMS and WhatsApp support
- Configurable OTP length (4-8 digits)
- Automatic retry on authentication failures
- Token caching for performance

## 🎯 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "status": "error_status",
  "details": {...}
}
```

## 🚨 Error Handling

### Common Error Codes
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (account suspended/banned)
- `404` - Not Found (user/match not found)
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

### Status-Specific Errors
- **Suspended Users**: `Account suspended. Please contact support for assistance.`
- **Banned Users**: `Account banned. Reason: [ban reason]`
- **Invalid Status**: `Account is [status]. Please contact support.`

## 🔧 Development

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run create-admin # Create initial admin user
```

### Player Creation Scripts
```bash
# Make scripts executable
chmod +x create-players.sh
chmod +x create-advanced-players.sh

# Run player creation scripts
./create-players.sh              # Create 20+ basic players
./create-advanced-players.sh     # Create advanced players with testing
./quick-create-players.sh        # Show quick reference commands
```

### Database Schema
- **User Schema**: Comprehensive user management with status tracking
- **Match Schema**: Tournament management with prize distribution
- **Status History**: Complete audit trail for all changes

### Project Files
- **`create-players.sh`**: Basic player creation script
- **`create-advanced-players.sh`**: Advanced player creation with testing
- **`quick-create-players.sh`**: Quick reference commands
- **`PLAYER_CREATION_GUIDE.md`**: Comprehensive player creation documentation
- **`README.md`**: This file with complete project documentation

## 📝 Notes

- All admin operations are logged with timestamps and reasons
- User status changes maintain complete history
- Match operations include validation and safety checks
- OTP system supports multiple providers and flow types
- API includes comprehensive error handling and validation
- Player creation system includes scripts for bulk creation and testing
- Multiple methods available for creating players (scripts, loops, individual commands)
- All created players are ready for testing admin features and user management

## 🎮 Player Creation & Testing

### **Quick Player Creation Methods**

#### **Method 1: Using Scripts (Recommended)**
```bash
# Make scripts executable
chmod +x create-players.sh
chmod +x create-advanced-players.sh

# Run basic player creation (20+ players)
./create-players.sh

# Run advanced player creation with testing
./create-advanced-players.sh
```

#### **Method 2: Simple Loop (Bash)**
```bash
# Create 5 basic players
for i in {1..5}; do 
  curl -X POST "http://localhost:5050/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"9182781${i}00\", \"pubgId\": \"player${i}00\", \"email\": \"player${i}00@gmail.com\", \"password\": \"password123\", \"name\": \"Player ${i}00\"}" \
    && echo " - Player ${i}00 created"
done
```

#### **Method 3: Individual Commands**
```bash
# Create players one by one
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182781001", "pubgId": "Player001", "email": "player001@gmail.com", "password": "password123", "name": "Player One"}'
```

### **Available Scripts**

- **`create-players.sh`**: Creates 20+ basic players with different characteristics
- **`create-advanced-players.sh`**: Advanced script with colors, testing, and comprehensive player creation
- **`quick-create-players.sh`**: Quick reference for one-liner commands
- **`PLAYER_CREATION_GUIDE.md`**: Complete documentation and examples

### **Player Types Created**

- **Basic Players**: Sequential numbered players for testing
- **Tournament Players**: Championship-level players
- **Specialized Players**: Sniper, Rush, Stealth, Medic experts
- **Team Players**: Alpha, Beta, Gamma, Delta team members
- **VIP Players**: Premium tier players
- **Demo Players**: Additional test players

### **Verification Commands**

```bash
# View all players
curl -X GET "http://localhost:5050/api/admin/users?page=1&limit=30"

# Search players
curl -X GET "http://localhost:5050/api/admin/users?search=champion&page=1&limit=10"

# Check specific player
curl -X GET "http://localhost:5050/api/auth/check-login-eligibility/[USER_ID]"
```

### **Testing User Statuses**

```bash
# Suspend a player
curl -X PATCH "http://localhost:5050/api/admin/users/[USER_ID]/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended", "reason": "Testing", "adminNotes": "Test suspension"}'

# Ban a player
curl -X POST "http://localhost:5050/api/admin/users/[USER_ID]/ban" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing ban", "duration": "permanent", "adminNotes": "Test ban"}'

# Test login blocking
curl -X POST "http://localhost:5050/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "suspendeduser@gmail.com", "password": "password123"}'
```

### **Player Creation Notes**

- **Default Password**: All players use `password123`
- **Unique Fields**: Phone numbers, PUBG IDs, and emails must be unique
- **Server Required**: Ensure server is running on localhost:5050
- **Rate Limiting**: Don't create too many players too quickly
- **Testing Ready**: All players are `active` by default for testing

## 🤝 Support

For technical support or questions about the admin features, please refer to the API documentation or contact the development team.
