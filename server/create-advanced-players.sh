#!/bin/bash

# PUBG Tournament App - Advanced Player Creation Script
# This script creates players with different characteristics and tests various scenarios

echo "🎮 PUBG Tournament App - Advanced Player Creation Script"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to create a player
create_player() {
    local phone=$1
    local pubg_id=$2
    local email=$3
    local name=$4
    local password=${5:-"password123"}
    
    echo -e "${BLUE}Creating player: $name ($pubg_id)...${NC}"
    
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
        echo -e "${GREEN}✅ $name created successfully!${NC}"
        # Extract user ID for later use
        user_id=$(echo "$response" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
        echo "   User ID: $user_id"
    else
        echo -e "${RED}❌ Failed to create $name${NC}"
        echo "   Response: $response"
    fi
    echo ""
}

# Function to test player login
test_login() {
    local email=$1
    local password=$2
    local expected_status=$3
    
    echo -e "${YELLOW}Testing login for: $email${NC}"
    
    response=$(curl -s -X POST "http://localhost:5050/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Login successful${NC}"
    else
        error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "${RED}❌ Login failed: $error_msg${NC}"
    fi
    echo ""
}

# Check if server is running
echo -e "${BLUE}🔍 Checking if server is running...${NC}"
if ! curl -s "http://localhost:5050/api/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running. Please start the server first.${NC}"
    echo "Run: cd server && node server.js"
    exit 1
fi
echo -e "${GREEN}✅ Server is running!${NC}"

echo ""
echo -e "${BLUE}🚀 Starting advanced player creation...${NC}"
echo ""

# Create players with different characteristics
echo -e "${YELLOW}📱 Creating Basic Players...${NC}"
create_player "9182786001" "BasicPlayer1" "basicplayer1@gmail.com" "Basic Player 1"
create_player "9182786002" "BasicPlayer2" "basicplayer2@gmail.com" "Basic Player 2"

echo -e "${YELLOW}🏆 Creating Tournament Champions...${NC}"
create_player "9182787001" "Champion1" "champion1@gmail.com" "Tournament Champion 1"
create_player "9182787002" "Champion2" "champion2@gmail.com" "Tournament Champion 2"
create_player "9182787003" "Champion3" "champion3@gmail.com" "Tournament Champion 3"

echo -e "${YELLOW}🎯 Creating Specialized Players...${NC}"
create_player "9182788001" "SniperElite" "sniperelite@gmail.com" "Sniper Elite"
create_player "9182788002" "RushMaster" "rushmaster@gmail.com" "Rush Master"
create_player "9182788003" "StealthPro" "stealthpro@gmail.com" "Stealth Pro"
create_player "9182788004" "MedicExpert" "medicexpert@gmail.com" "Medic Expert"

echo -e "${YELLOW}👥 Creating Team Players...${NC}"
create_player "9182789001" "TeamGamma1" "teamgamma1@gmail.com" "Team Gamma Player 1"
create_player "9182789002" "TeamGamma2" "teamgamma2@gmail.com" "Team Gamma Player 2"
create_player "9182789003" "TeamDelta1" "teamdelta1@gmail.com" "Team Delta Player 1"
create_player "9182789004" "TeamDelta2" "teamdelta2@gmail.com" "Team Delta Player 2"

echo -e "${YELLOW}🌟 Creating VIP Players...${NC}"
create_player "9182790001" "VIPPlayer1" "vipplayer1@gmail.com" "VIP Player 1"
create_player "9182790002" "VIPPlayer2" "vipplayer2@gmail.com" "VIP Player 2"
create_player "9182790003" "VIPPlayer3" "vipplayer3@gmail.com" "VIP Player 3"

echo ""
echo -e "${GREEN}🎉 Advanced player creation completed!${NC}"
echo ""

# Test login for some players
echo -e "${BLUE}🔐 Testing login functionality...${NC}"
echo ""

test_login "basicplayer1@gmail.com" "password123" "success"
test_login "champion1@gmail.com" "password123" "success"
test_login "sniperelite@gmail.com" "password123" "success"

echo ""
echo -e "${GREEN}📊 Player Management Commands:${NC}"
echo ""
echo -e "${YELLOW}View all players:${NC}"
echo "curl -X GET \"http://localhost:5050/api/admin/users?page=1&limit=30\""
echo ""
echo -e "${YELLOW}Search players by email:${NC}"
echo "curl -X GET \"http://localhost:5050/api/admin/users?search=champion&page=1&limit=10\""
echo ""
echo -e "${YELLOW}Filter by status:${NC}"
echo "curl -X GET \"http://localhost:5050/api/admin/users?statusFilter=active&page=1&limit=10\""
echo ""
echo -e "${YELLOW}Check specific player:${NC}"
echo "curl -X GET \"http://localhost:5050/api/auth/check-login-eligibility/[USER_ID]\""
echo ""
echo -e "${YELLOW}Suspend a player:${NC}"
echo "curl -X PATCH \"http://localhost:5050/api/admin/users/[USER_ID]/status\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"status\": \"suspended\", \"reason\": \"Testing\", \"adminNotes\": \"Test suspension\"}'"
echo ""
echo -e "${YELLOW}Ban a player:${NC}"
echo "curl -X POST \"http://localhost:5050/api/admin/users/[USER_ID]/ban\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"reason\": \"Testing ban\", \"duration\": \"permanent\", \"adminNotes\": \"Test ban\"}'"
echo ""
echo -e "${GREEN}✨ All players created with password: password123${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "- Use the admin panel to manage these players"
echo "- Test different user statuses (active, suspended, banned)"
echo "- Create matches and add players to test tournament functionality"
echo "- Use the search and filter features in the Users tab"
