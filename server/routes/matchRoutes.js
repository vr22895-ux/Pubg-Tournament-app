const express = require('express');
const router = express.Router();
const matchController = require('../controller/matchController');
const userAuth = require('../middleware/userAuth');
const adminAuth = require('../middleware/adminAuth');

// Protected User routes (Must be before /:matchId to avoid conflict)
router.get('/my-matches', userAuth, matchController.getMyMatches);

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/completed', matchController.getCompletedMatches);
router.get('/:matchId', matchController.getMatchDetails);
router.get('/:matchId/results', matchController.getMatchResults);

// Protected User Action Routes
router.post('/:matchId/join', userAuth, matchController.joinMatch);
router.post('/:matchId/leave', userAuth, matchController.leaveMatch);

// Admin/System routes (Protected)
router.get('/management', adminAuth, matchController.getAllMatchesForManagement);
router.get('/:matchId/registrations', adminAuth, matchController.getMatchRegistrations);
router.post('/', adminAuth, matchController.createMatch);
router.post('/auto-update-statuses', adminAuth, matchController.autoUpdateMatchStatuses); // Could be CRON but protecting for now
router.put('/:matchId', adminAuth, matchController.updateMatch);
router.post('/:matchId/cancel', adminAuth, matchController.cancelMatch);
router.delete('/:matchId', adminAuth, matchController.deleteMatch);
router.post('/:matchId/results', adminAuth, matchController.uploadResults);
router.patch('/:matchId/status', adminAuth, matchController.updateMatchStatus);
router.post('/:matchId/room-details', adminAuth, matchController.sendRoomDetails);

module.exports = router;
