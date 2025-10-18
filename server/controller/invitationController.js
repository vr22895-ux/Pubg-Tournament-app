const Invitation = require('../schema/Invitation');
const Squad = require('../schema/Squad');
const User = require('../schema/User');

// Send invitation to user
const sendInvitation = async (req, res) => {
  try {
    const { squadId, invitedUserId, message } = req.body;
    const { userId } = req.user; // From auth middleware
    
    // Check if squad exists and user is leader
    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }
    
    if (squad.leader.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only squad leader can send invitations' });
    }
    
    // Check if squad is full
    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        error: `Squad is full (${squad.members.length}/${squad.maxMembers} members)` 
      });
    }
    
    // Check if user exists
    const invitedUser = await User.findById(invitedUserId);
    if (!invitedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if user is already in a squad
    if (invitedUser.squadId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User is already in a squad' 
      });
    }
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      squadId,
      invitedUserId,
      status: 'pending'
    });
    
    if (existingInvitation) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invitation already sent to this user' 
      });
    }
    
    // Get inviter's info
    const inviter = await User.findById(userId);
    
    // Create invitation
    const invitation = new Invitation({
      squadId,
      squadName: squad.name,
      invitedUserId,
      invitedByName: inviter.name,
      invitedByPubgId: inviter.pubgId,
      message: message || ''
    });
    
    await invitation.save();
    
    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      data: invitation
    });
    
  } catch (error) {
    console.error('Error in sendInvitation:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get user's pending invitations
const getUserInvitations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const invitations = await Invitation.find({
      invitedUserId: userId,
      status: 'pending'
    }).populate('squadId', 'name maxMembers members')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: invitations });
    
  } catch (error) {
    console.error('Error in getUserInvitations:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Accept invitation
const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.user; // From auth middleware
    
    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    
    if (invitation.invitedUserId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to accept this invitation' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Invitation is no longer valid' });
    }
    
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Invitation has expired' });
    }
    
    // Check if user is already in a squad
    const user = await User.findById(userId);
    if (user.squadId) {
      return res.status(400).json({ success: false, error: 'User is already in a squad' });
    }
    
    // Get squad
    const squad = await Squad.findById(invitation.squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }
    
    // Check if squad is full
    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Squad is full' 
      });
    }
    
    // Add user to squad
    squad.members.push({
      userId: userId,
      name: user.name,
      pubgId: user.pubgId,
      role: 'member',
      status: 'active'
    });
    
    await squad.save();
    
    // Update user's squad reference
    await User.findByIdAndUpdate(userId, {
      squadId: squad._id,
      squadRole: 'member'
    });
    
    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();
    
    // Populate the squad data before returning
    const populatedSquad = await Squad.findById(squad._id)
      .populate('leader', 'name email')
      .populate('members.userId', 'name pubgId email');
    
    res.json({ 
      success: true, 
      message: 'Successfully joined squad!',
      data: populatedSquad
    });
    
  } catch (error) {
    console.error('Error in acceptInvitation:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Decline invitation
const declineInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.user; // From auth middleware
    
    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    
    if (invitation.invitedUserId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to decline this invitation' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Invitation is no longer valid' });
    }
    
    // Update invitation status
    invitation.status = 'declined';
    await invitation.save();
    
    res.json({ 
      success: true, 
      message: 'Invitation declined',
      data: invitation
    });
    
  } catch (error) {
    console.error('Error in declineInvitation:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Cancel invitation (by squad leader)
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.user; // From auth middleware
    
    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    
    // Check if user is squad leader
    const squad = await Squad.findById(invitation.squadId);
    if (!squad || squad.leader.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only squad leader can cancel invitations' });
    }
    
    // Update invitation status
    invitation.status = 'expired';
    await invitation.save();
    
    res.json({ 
      success: true, 
      message: 'Invitation cancelled',
      data: invitation
    });
    
  } catch (error) {
    console.error('Error in cancelInvitation:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Squad leader accepts join request
const acceptJoinRequest = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.user; // From auth middleware (squad leader)
    
    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Join request not found' });
    }
    
    if (invitation.type !== 'join_request') {
      return res.status(400).json({ success: false, error: 'This is not a join request' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Join request is no longer valid' });
    }
    
    // Check if the current user is the squad leader
    const squad = await Squad.findById(invitation.squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }
    
    if (squad.leader.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only squad leader can accept join requests' });
    }
    
    // Check if squad is full
    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Squad is full' 
      });
    }
    
    // Get the user who requested to join
    const joiningUser = await User.findById(invitation.invitedUserId);
    if (!joiningUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if user is already in a squad
    if (joiningUser.squadId) {
      return res.status(400).json({ success: false, error: 'User is already in a squad' });
    }
    
    // Add user to squad
    squad.members.push({
      userId: joiningUser._id,
      name: joiningUser.name,
      pubgId: joiningUser.pubgId,
      role: 'member',
      status: 'active'
    });
    
    await squad.save();
    
    // Update user's squad reference
    await User.findByIdAndUpdate(joiningUser._id, {
      squadId: squad._id,
      squadRole: 'member'
    });
    
    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();
    
    // Populate the squad data before returning
    const populatedSquad = await Squad.findById(squad._id)
      .populate('leader', 'name email')
      .populate('members.userId', 'name pubgId email');
    
    res.json({ 
      success: true, 
      message: 'Join request accepted successfully!',
      data: populatedSquad
    });
    
  } catch (error) {
    console.error('Error in acceptJoinRequest:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Squad leader declines join request
const declineJoinRequest = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req.user; // From auth middleware (squad leader)
    
    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Join request not found' });
    }
    
    if (invitation.type !== 'join_request') {
      return res.status(400).json({ success: false, error: 'This is not a join request' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Join request is no longer valid' });
    }
    
    // Check if the current user is the squad leader
    const squad = await Squad.findById(invitation.squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }
    
    if (squad.leader.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only squad leader can decline join requests' });
    }
    
    // Update invitation status
    invitation.status = 'declined';
    await invitation.save();
    
    res.json({ 
      success: true, 
      message: 'Join request declined',
      data: invitation
    });
    
  } catch (error) {
    console.error('Error in declineJoinRequest:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getUserInvitations,
  sendInvitation,
  acceptInvitation,
  declineInvitation,
  acceptJoinRequest,
  declineJoinRequest,
  cancelInvitation
};
