const express = require('express');
const router = express.Router();
const matchController = require('../controller/matchController');
const userAuth = require('../middleware/userAuth');
// const adminAuth = require('../middleware/adminAuth'); // Uncomment if needed for admin routes

// Protected User routes (Must be before /:matchId to avoid conflict)
router.get('/my-matches', userAuth, matchController.getMyMatches);

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/management', matchController.getAllMatchesForManagement); // Should ideally be admin protected
router.get('/completed', matchController.getCompletedMatches);
router.get('/:matchId', matchController.getMatchDetails);
router.get('/:matchId/results', matchController.getMatchResults);
router.get('/:matchId/registrations', matchController.getMatchRegistrations); // Used by admin, maybe protect?
router.post('/:matchId/join', matchController.joinMatch); // Controller handles wallet checks, but maybe add userAuth? Controller uses body.userId
router.post('/:matchId/leave', matchController.leaveMatch); // Controller uses body.userId

// Admin/System routes (Currently unprotected or loose in server.js, keeping consistent for now)
router.post('/', matchController.createMatch);
router.post('/auto-update-statuses', matchController.autoUpdateMatchStatuses);
router.put('/:matchId', matchController.updateMatch);
router.post('/:matchId/cancel', matchController.cancelMatch);
router.delete('/:matchId', matchController.deleteMatch);
router.post('/:matchId/results', matchController.uploadResults);
router.patch('/:matchId/status', matchController.updateMatchStatus);

module.exports = router;
