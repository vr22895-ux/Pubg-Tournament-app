#!/bin/bash

# PUBG Tournament App - Player Creation Script
# This script creates multiple players for testing and development

echo "🎮 PUBG Tournament App - Player Creation Script"
echo "================================================"

# Function to create a player
create_player() {
    local phone=$1
    local pubg_id=$2
    local email=$3
    local name=$4
    local password=${5:-"password123"}
    
    echo "Creating player: $name ($pubg_id)..."
    
    response=$(curl -s -X POST "http://localhost:5050/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"phone\": \"$phone\",
            \"pubgId\": \"$pubg_id\",
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"name\": \"$name\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ $name created successfully!"
    else
        echo "❌ Failed to create $name"
        echo "Response: $response"
    fi
    echo ""
}

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s "http://localhost:5050/api/health" > /dev/null; then
    echo "❌ Server is not running. Please start the server first."
    echo "Run: cd server && node server.js"
    exit 1
fi
echo "✅ Server is running!"

echo ""
echo "🚀 Starting player creation..."
echo ""

# Create basic players
create_player "9182781001" "Player001" "player001@gmail.com" "Player One"
create_player "9182781002" "Player002" "player002@gmail.com" "Player Two"
create_player "9182781003" "Player003" "player003@gmail.com" "Player Three"

# Create tournament players
create_player "9182782001" "TournamentPlayer1" "tournament1@gmail.com" "Tournament Player 1"
create_player "9182782002" "TournamentPlayer2" "tournament2@gmail.com" "Tournament Player 2"
create_player "9182782003" "TournamentPlayer3" "tournament3@gmail.com" "Tournament Player 3"

# Create pro players
create_player "9182783001" "ProGamer1" "progamer1@gmail.com" "Pro Gamer 1"
create_player "9182783002" "ProGamer2" "progamer2@gmail.com" "Pro Gamer 2"
create_player "9182783003" "ProGamer3" "progamer3@gmail.com" "Pro Gamer 3"

# Create team players
create_player "9182784001" "TeamAlpha1" "teamalpha1@gmail.com" "Team Alpha Player 1"
create_player "9182784002" "TeamAlpha2" "teamalpha2@gmail.com" "Team Alpha Player 2"
create_player "9182784003" "TeamBeta1" "teambeta1@gmail.com" "Team Beta Player 1"
create_player "9182784004" "TeamBeta2" "teambeta2@gmail.com" "Team Beta Player 2"

# Create special players
create_player "9182785001" "SniperKing" "sniperking@gmail.com" "Sniper King"
create_player "9182785002" "RushPlayer" "rushplayer@gmail.com" "Rush Player"
create_player "9182785003" "StealthMaster" "stealthmaster@gmail.com" "Stealth Master"

echo "🎉 Player creation completed!"
echo ""
echo "📊 To view all players, run:"
echo "curl -X GET \"http://localhost:5050/api/admin/users?page=1&limit=20\""
echo ""
echo "🔍 To check a specific player, run:"
echo "curl -X GET \"http://localhost:5050/api/auth/check-login-eligibility/[USER_ID]\""
echo ""
echo "✨ All players created with password: password123"
