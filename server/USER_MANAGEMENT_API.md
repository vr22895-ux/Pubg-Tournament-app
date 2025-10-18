# User Management API Documentation

This document describes the backend API endpoints for the admin panel's user management functionality.

## Base URL
```
http://localhost:5050/api/admin
```

## Authentication
All endpoints require admin authentication. Currently using simple middleware protection.

## Endpoints

### 1. Get Users List
**GET** `/users`

**Query Parameters:**
- `search` (optional): Search by name, PUBG ID, or email
- `status` (optional): Filter by user status (active, suspended, banned, all)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of users per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "name": "PlayerPro123",
      "email": "player@example.com",
      "pubgId": "PlayerPro123",
      "phone": "9182781986",
      "status": "active",
      "matchCount": 45,
      "earnings": 0,
      "lastActive": "2024-08-13T07:00:00.000Z",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. Get User Details
**GET** `/users/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "PlayerPro123",
    "email": "player@example.com",
    "pubgId": "PlayerPro123",
    "phone": "9182781986",
    "status": "active",
    "statistics": {
      "totalMatches": 45,
      "wins": 12,
      "winRate": "26.7",
      "lastActive": "2024-08-13T07:00:00.000Z"
    },
    "matchHistory": [
      {
        "_id": "match_id",
        "name": "Championship Battle",
        "startTime": "2024-08-13T06:00:00.000Z",
        "status": "completed",
        "results": { ... }
      }
    ]
  }
}
```

### 3. Update User Status
**PATCH** `/users/:userId/status`

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Violation of community guidelines",
  "adminNotes": "User was found using inappropriate language in chat"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "PlayerPro123",
    "status": "suspended",
    "adminNotes": "User was found using inappropriate language in chat",
    "statusHistory": [
      {
        "status": "suspended",
        "reason": "Violation of community guidelines",
        "adminNotes": "User was found using inappropriate language in chat",
        "changedAt": "2024-08-13T07:00:00.000Z"
      }
    ]
  },
  "message": "User status updated to suspended"
}
```

### 4. Get User Reports
**GET** `/users/:userId/reports`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "reports": [
      {
        "id": 1,
        "type": "cheating",
        "description": "Suspicious gameplay behavior",
        "reporter": "Anonymous",
        "reportedAt": "2024-08-12T07:00:00.000Z",
        "status": "pending",
        "evidence": "Match replay available"
      }
    ],
    "totalReports": 1,
    "activeReports": 1
  }
}
```

### 5. Ban User
**POST** `/users/:userId/ban`

**Request Body:**
```json
{
  "reason": "Repeated violations of community guidelines",
  "duration": "1week",
  "adminNotes": "User has been warned multiple times"
}
```

**Duration Options:**
- `1day`, `3days`, `1week`, `1month`, `permanent`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "PlayerPro123",
    "status": "banned",
    "banReason": "Repeated violations of community guidelines",
    "banExpiry": "2024-08-20T07:00:00.000Z",
    "adminNotes": "User has been warned multiple times"
  },
  "message": "User banned successfully until 2024-08-20T07:00:00.000Z"
}
```

### 6. Unban User
**POST** `/users/:userId/unban`

**Request Body:**
```json
{
  "adminNotes": "User has shown improvement and apologized for violations"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "PlayerPro123",
    "status": "active",
    "banReason": null,
    "banExpiry": null
  },
  "message": "User unbanned successfully"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (invalid parameters)
- `403`: Forbidden (access denied)
- `404`: Not Found (user not found)
- `500`: Internal Server Error

## Usage Examples

### Search for users by name
```bash
curl "http://localhost:5050/api/admin/users?search=PlayerPro&status=active&page=1&limit=5"
```

### Suspend a user
```bash
curl -X PATCH "http://localhost:5050/api/admin/users/USER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended", "reason": "Temporary suspension", "adminNotes": "User will be reviewed in 24 hours"}'
```

### Ban a user permanently
```bash
curl -X POST "http://localhost:5050/api/admin/users/USER_ID/ban" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Severe violation", "duration": "permanent", "adminNotes": "User has been permanently banned"}'
```

## Notes

- All user data excludes sensitive information (passwords, admin credentials)
- Status changes are tracked in the `statusHistory` array
- Match statistics are calculated in real-time from match results
- The reporting system is currently mocked and should be implemented based on your specific requirements
- Admin notes are stored for audit purposes
- Ban durations can be temporary or permanent
