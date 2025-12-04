const express = require('express');
const router = express.Router();
const invitationController = require('../controller/invitationController');
const userAuth = require('../middleware/userAuth');

router.get('/user/:userId', invitationController.getUserInvitations);
router.get('/squad/:squadId', invitationController.getSquadInvitations);
router.post('/send', userAuth, invitationController.sendInvitation);
router.post('/:invitationId/accept', userAuth, invitationController.acceptInvitation);
router.post('/:invitationId/decline', userAuth, invitationController.declineInvitation);
router.post('/:invitationId/accept-join', userAuth, invitationController.acceptJoinRequest);
router.post('/:invitationId/decline-join', userAuth, invitationController.declineJoinRequest);
router.delete('/:invitationId', userAuth, invitationController.cancelInvitation);

module.exports = router;
