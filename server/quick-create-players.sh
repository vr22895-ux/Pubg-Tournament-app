#!/bin/bash

# Quick Player Creation - One-liner commands
echo "🚀 Quick Player Creation Commands"
echo "=================================="
echo ""

echo "📱 Create 5 basic players:"
echo 'for i in {1..5}; do curl -X POST "http://localhost:5050/api/auth/register" -H "Content-Type: application/json" -d "{\"phone\": \"9182781${i}00\", \"pubgId\": \"player${i}00\", \"email\": \"player${i}00@gmail.com\", \"password\": \"password123\", \"name\": \"Player ${i}00\"}" && echo " - Player ${i}00 created"; done'
echo ""

echo "🏆 Create tournament players:"
echo 'curl -X POST "http://localhost:5050/api/auth/register" -H "Content-Type: application/json" -d '"'"'{"phone": "9182781999", "pubgId": "TournamentPlayer", "email": "tournament@gmail.com", "password": "password123", "name": "Tournament Player"}'"'"''
echo ""

echo "🎯 Create specialized players:"
echo 'curl -X POST "http://localhost:5050/api/auth/register" -H "Content-Type: application/json" -d '"'"'{"phone": "9182781888", "pubgId": "SniperKing", "email": "sniperking@gmail.com", "password": "password123", "name": "Sniper King"}'"'"''
echo ""

echo "👥 Create team players:"
echo 'for i in {1..4}; do curl -X POST "http://localhost:5050/api/auth/register" -H "Content-Type: application/json" -d "{\"phone\": \"9182781${i}50\", \"pubgId\": \"TeamPlayer${i}\", \"email\": \"teamplayer${i}@gmail.com\", \"password\": \"password123\", \"name\": \"Team Player ${i}\"}" && echo " - Team Player ${i} created"; done'
echo ""

echo "🔍 View all players:"
echo 'curl -X GET "http://localhost:5050/api/admin/users?page=1&limit=20"'
echo ""

echo "✨ All players use password: password123"
