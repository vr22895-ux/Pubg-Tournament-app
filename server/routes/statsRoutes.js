const express = require('express');
const router = express.Router();
const statsController = require('../controller/statsController');
const userAuth = require('../middleware/userAuth');

// Public route or protected? Let's make it protected for now, or public if needed.
// Usually leaderboards are public, but app requires login.
router.get('/leaderboard', userAuth, statsController.getLeaderboard);

module.exports = router;
