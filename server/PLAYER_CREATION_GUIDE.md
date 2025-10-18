# 🎮 Player Creation Guide - PUBG Tournament App

This guide shows you how to create multiple players through the terminal using various methods.

## 🚀 **Quick Start Methods**

### **Method 1: Simple Loop (Bash)**
```bash
# Create 5 basic players
for i in {1..5}; do 
  curl -X POST "http://localhost:5050/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"9182781${i}00\", \"pubgId\": \"player${i}00\", \"email\": \"player${i}00@gmail.com\", \"password\": \"password123\", \"name\": \"Player ${i}00\"}" \
    && echo " - Player ${i}00 created"
done
```

### **Method 2: Individual Commands**
```bash
# Create players one by one
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182781001", "pubgId": "Player001", "email": "player001@gmail.com", "password": "password123", "name": "Player One"}'

curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182781002", "pubgId": "Player002", "email": "player002@gmail.com", "password": "password123", "name": "Player Two"}'
```

### **Method 3: Using the Scripts**
```bash
# Make scripts executable
chmod +x create-players.sh
chmod +x create-advanced-players.sh

# Run the scripts
./create-players.sh
./create-advanced-players.sh
```

## 📱 **Player Creation Examples**

### **Basic Players**
```bash
# Create 10 basic players with sequential numbers
for i in {1..10}; do 
  curl -X POST "http://localhost:5050/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"9182781${i}00\", \"pubgId\": \"Basic${i}\", \"email\": \"basic${i}@gmail.com\", \"password\": \"password123\", \"name\": \"Basic Player ${i}\"}"
done
```

### **Tournament Players**
```bash
# Create tournament champions
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182782001", "pubgId": "Champion1", "email": "champion1@gmail.com", "password": "password123", "name": "Tournament Champion 1"}'

curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182782002", "pubgId": "Champion2", "email": "champion2@gmail.com", "password": "password123", "name": "Tournament Champion 2"}'
```

### **Specialized Players**
```bash
# Create players with specific roles
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182783001", "pubgId": "SniperElite", "email": "sniperelite@gmail.com", "password": "password123", "name": "Sniper Elite"}'

curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182783002", "pubgId": "RushMaster", "email": "rushmaster@gmail.com", "password": "password123", "name": "Rush Master"}'
```

### **Team Players**
```bash
# Create team players
for team in "Alpha" "Beta" "Gamma" "Delta"; do
  for player in {1..2}; do
    curl -X POST "http://localhost:5050/api/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"phone\": \"918278${team}${player}00\", \"pubgId\": \"Team${team}${player}\", \"email\": \"team${team}${player}@gmail.com\", \"password\": \"password123\", \"name\": \"Team ${team} Player ${player}\"}"
  done
done
```

## 🔍 **Verification Commands**

### **Check All Players**
```bash
# View all players (paginated)
curl -X GET "http://localhost:5050/api/admin/users?page=1&limit=20"

# View specific page
curl -X GET "http://localhost:5050/api/admin/users?page=2&limit=10"
```

### **Search Players**
```bash
# Search by email
curl -X GET "http://localhost:5050/api/admin/users?search=champion&page=1&limit=10"

# Search by name
curl -X GET "http://localhost:5050/api/admin/users?search=Player&page=1&limit=10"
```

### **Filter by Status**
```bash
# Filter active users
curl -X GET "http://localhost:5050/api/admin/users?statusFilter=active&page=1&limit=10"

# Filter suspended users
curl -X GET "http://localhost:5050/api/admin/users?statusFilter=suspended&page=1&limit=10"
```

### **Check Specific Player**
```bash
# Check login eligibility
curl -X GET "http://localhost:5050/api/auth/check-login-eligibility/[USER_ID]"

# Get user details
curl -X GET "http://localhost:5050/api/admin/users/[USER_ID]"
```

## 🛡️ **Testing User Statuses**

### **Suspend a Player**
```bash
curl -X PATCH "http://localhost:5050/api/admin/users/[USER_ID]/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended", "reason": "Testing suspension", "adminNotes": "Test suspension for login blocking"}'
```

### **Ban a Player**
```bash
# Permanent ban
curl -X POST "http://localhost:5050/api/admin/users/[USER_ID]/ban" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing ban", "duration": "permanent", "adminNotes": "Test ban"}'

# Temporary ban (7 days)
curl -X POST "http://localhost:5050/api/admin/users/[USER_ID]/ban" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing temporary ban", "duration": "7", "adminNotes": "Test temporary ban"}'
```

### **Unban a Player**
```bash
curl -X POST "http://localhost:5050/api/admin/users/[USER_ID]/unban" \
  -H "Content-Type: application/json" \
  -d '{"adminNotes": "Restored for testing"}'
```

### **Test Login Blocking**
```bash
# Try to login with suspended/banned user
curl -X POST "http://localhost:5050/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "suspendeduser@gmail.com", "password": "password123"}'
```

## 📊 **Bulk Operations**

### **Create 50 Players at Once**
```bash
#!/bin/bash
for i in {1..50}; do
  phone="9182781$(printf "%03d" $i)"
  pubg_id="Player$(printf "%03d" $i)"
  email="player$(printf "%03d" $i)@gmail.com"
  name="Player $(printf "%03d" $i)"
  
  echo "Creating $name..."
  curl -s -X POST "http://localhost:5050/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"$phone\", \"pubgId\": \"$pubg_id\", \"email\": \"$email\", \"password\": \"password123\", \"name\": \"$name\"}" > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ $name created"
  else
    echo "❌ Failed to create $name"
  fi
done
```

### **Create Players with Different Passwords**
```bash
#!/bin/bash
passwords=("password123" "secret456" "admin789" "user000" "test111")

for i in {1..10}; do
  password=${passwords[$((i % ${#passwords[@]}))]}
  
  curl -X POST "http://localhost:5050/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"9182781${i}00\", \"pubgId\": \"Player${i}00\", \"email\": \"player${i}00@gmail.com\", \"password\": \"$password\", \"name\": \"Player ${i}00\"}"
done
```

## 🎯 **Advanced Scenarios**

### **Create Players for Testing**
```bash
# Create players with different characteristics for testing
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182789999", "pubgId": "TestUser1", "email": "testuser1@gmail.com", "password": "password123", "name": "Test User 1"}'

# Create a player that will be suspended
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182788888", "pubgId": "SuspendedUser", "email": "suspendeduser@gmail.com", "password": "password123", "name": "Suspended User"}'

# Create a player that will be banned
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182787777", "pubgId": "BannedUser", "email": "banneduser@gmail.com", "password": "password123", "name": "Banned User"}'
```

## 📝 **Notes**

- **Phone Numbers**: Must be unique, use different numbers for each player
- **PUBG IDs**: Must be unique, use different IDs for each player
- **Emails**: Must be unique, use different emails for each player
- **Passwords**: All players use "password123" by default (change in production)
- **Server**: Make sure the server is running on localhost:5050
- **Rate Limiting**: Don't create too many players too quickly to avoid overwhelming the server

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Server not running**: Start with `cd server && node server.js`
2. **Duplicate phone/email**: Use unique values for each player
3. **Invalid JSON**: Check quotes and escaping in the JSON data
4. **Network errors**: Verify server is accessible at localhost:5050

### **Debug Commands**
```bash
# Check server health
curl -X GET "http://localhost:5050/api/health"

# Check server logs
# Look at the terminal where server.js is running

# Test with simple data
curl -X POST "http://localhost:5050/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9182781111", "pubgId": "test", "email": "test@gmail.com", "password": "test", "name": "test"}'
```

## 🎉 **Success Indicators**

- **Response**: `{"success":true,"user":{...}}`
- **Status Code**: 200 OK
- **User ID**: Generated MongoDB ObjectId
- **User Status**: "active" by default

Happy player creation! 🎮✨
