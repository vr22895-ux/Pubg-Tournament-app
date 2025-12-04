const express = require('express');
const router = express.Router();
const squadController = require('../controller/squadController');
const userAuth = require('../middleware/userAuth');

// Protected routes
router.get('/my-squad', userAuth, squadController.getMySquad);
router.post('/', userAuth, squadController.createSquad);
router.post('/:squadId/invite', userAuth, squadController.inviteToSquad);
router.post('/:squadId/join-request', userAuth, squadController.requestToJoinSquad);
router.post('/:squadId/leave', userAuth, squadController.leaveSquad);
router.delete('/:squadId/members/:userId', userAuth, squadController.removeFromSquad);

// Public/Mixed routes
router.get('/user/:userId', squadController.getUserSquad);
router.get('/', squadController.getAllSquads);
router.get('/:squadId', squadController.getSquadById);
router.put('/:squadId', squadController.updateSquad);
router.delete('/:squadId', squadController.deleteSquad);

module.exports = router;
