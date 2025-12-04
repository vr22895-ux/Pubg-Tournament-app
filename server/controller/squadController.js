const Squad = require('../schema/Squad');
const User = require('../schema/User');

// Get user's squad (Secure)
const getMySquad = async (req, res) => {
  try {
    // Use userId from the authenticated token
    const userId = req.user.userId;

    const squad = await Squad.findOne({
      'members.userId': userId,
      status: 'active'
    }).populate('members.userId', 'name pubgId email');

    if (!squad) {
      return res.json({ success: false, message: 'User not in squad' });
    }

    res.json({ success: true, data: squad });
  } catch (error) {
    console.error('Error in getMySquad:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get user's squad (Legacy/Admin - keep for admin usage if needed, or deprecate)
const getUserSquad = async (req, res) => {
  try {
    const { userId } = req.params;
    const squad = await Squad.findOne({
      'members.userId': userId,
      status: 'active'
    }).populate('members.userId', 'name pubgId email');

    if (!squad) {
      return res.json({ success: false, message: 'User not in squad' });
    }

    res.json({ success: true, data: squad });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get all squads with search and filtering
const getAllSquads = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { 'members.name': searchRegex },
        { 'members.pubgId': searchRegex }
      ];
    }

    // Get squads with pagination
    const squads = await Squad.find(query)
      .populate('leader', 'name email')
      .populate('members.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Squad.countDocuments(query);

    res.json({
      success: true,
      data: squads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllSquads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get squad by ID
const getSquadById = async (req, res) => {
  try {
    const { squadId } = req.params;

    const squad = await Squad.findById(squadId)
      .populate('leader', 'name email')
      .populate('members.userId', 'name email');

    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    res.json({ success: true, data: squad });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Create new squad
const createSquad = async (req, res) => {
  try {
    const { name } = req.body;
    // Secure: Get leaderId from token
    const leaderId = req.user.userId;

    const existingSquad = await Squad.findOne({
      'members.userId': leaderId,
      status: 'active'
    });

    if (existingSquad) {
      return res.status(400).json({
        success: false,
        error: 'User already in squad'
      });
    }

    // Fetch leader details from DB
    const leader = await User.findById(leaderId);
    if (!leader) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Validate PUBG ID
    if (!leader.pubgId) {
      return res.status(400).json({
        success: false,
        error: 'Please update your profile with your PUBG ID before creating a squad.'
      });
    }

    const squad = new Squad({
      name,
      leader: leaderId,
      members: [{
        userId: leaderId,
        name: leader.name || leader.email.split('@')[0], // Fallback to email username if name is missing
        pubgId: leader.pubgId,
        role: 'leader',
        status: 'active'
      }]
    });

    await squad.save();

    // Update user's squad reference
    await User.findByIdAndUpdate(leaderId, {
      squadId: squad._id,
      squadRole: 'leader'
    });

    // Populate the squad data before returning
    const populatedSquad = await Squad.findById(squad._id)
      .populate('leader', 'name email')
      .populate('members.userId', 'name pubgId email');

    res.json({ success: true, data: populatedSquad });
  } catch (error) {
    console.error('Error in createSquad:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Update squad
const updateSquad = async (req, res) => {
  try {
    const { squadId } = req.params;
    const { name, maxMembers, status } = req.body;

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (maxMembers) updateData.maxMembers = maxMembers;
    if (status) updateData.status = status;

    const updatedSquad = await Squad.findByIdAndUpdate(
      squadId,
      updateData,
      { new: true, runValidators: true }
    ).populate('leader', 'name email').populate('members.userId', 'name email');

    res.json({ success: true, data: updatedSquad });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Invite user to squad
const inviteToSquad = async (req, res) => {
  try {
    const { squadId, invitedUserId } = req.body;

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    console.log(`Debug: Squad ${squad.name} has ${squad.members.length} members`);

    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({
        success: false,
        error: `Squad is full (${squad.members.length}/${squad.maxMembers} members)`
      });
    }

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
    const Invitation = require('../schema/Invitation');
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

    // Get inviter's info from token
    const inviterId = req.user.userId;
    const inviter = await User.findById(inviterId);

    if (!inviter) {
      return res.status(400).json({ success: false, error: 'Inviter not found' });
    }

    // Validate PUBG ID for inviter (optional but good practice)
    if (!inviter.pubgId) {
      return res.status(400).json({
        success: false,
        error: 'Please update your profile with your PUBG ID before sending invitations.'
      });
    }

    // Create invitation
    const invitation = new Invitation({
      squadId,
      squadName: squad.name,
      invitedUserId,
      invitedByName: inviter.name || inviter.email.split('@')[0],
      invitedByPubgId: inviter.pubgId,
      message: req.body.message || ''
    });

    await invitation.save();

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation
    });

  } catch (error) {
    console.error('Error in inviteToSquad:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Request to join squad
const requestToJoinSquad = async (req, res) => {
  try {
    const { squadId } = req.params;
    // Secure: Get userId from token
    const userId = req.user.userId;

    // Find the squad
    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    // Check if squad is active
    if (squad.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Squad is not active' });
    }

    // Check if squad is full
    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({ success: false, error: 'Squad is full' });
    }

    // Check if user is already in a squad
    const existingSquad = await Squad.findOne({
      'members.userId': userId,
      status: 'active'
    });

    if (existingSquad) {
      return res.status(400).json({ success: false, error: 'You are already in a squad' });
    }

    // Check if user is already a member of this squad (redundant if existingSquad check passes, but safe)
    const isAlreadyMember = squad.members.some(member =>
      member.userId.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ success: false, error: 'You are already a member of this squad' });
    }

    // Check if request already exists
    const Invitation = require('../schema/Invitation');
    const existingRequest = await Invitation.findOne({
      squadId,
      invitedUserId: userId, // In join request, invitedUserId is the requester
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'Join request already sent' });
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Validate PUBG ID
    if (!user.pubgId) {
      return res.status(400).json({
        success: false,
        error: 'Please update your profile with your PUBG ID before joining a squad.'
      });
    }

    // Create join request (Invitation with type 'request' or implied by context)
    const invitation = new Invitation({
      squadId,
      squadName: squad.name,
      invitedUserId: userId, // The user requesting to join
      invitedByName: user.name || user.email.split('@')[0],
      invitedByPubgId: user.pubgId,
      message: `${user.name || 'User'} wants to join your squad!`,
      type: 'join_request' // Explicitly mark as request
    });

    await invitation.save();

    res.json({ success: true, message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Error in requestToJoinSquad:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Remove user from squad
const removeFromSquad = async (req, res) => {
  try {
    const { squadId, userId } = req.params;
    const { userId: currentUserId } = req.user; // Current user making the request

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    // Check if current user is the squad leader
    if (squad.leader.toString() !== currentUserId) {
      return res.status(403).json({ success: false, error: 'Only squad leader can remove members' });
    }

    // Check if trying to remove the leader
    if (squad.leader.toString() === userId) {
      return res.status(400).json({ success: false, error: 'Cannot remove squad leader' });
    }

    // Check if user is actually a member of the squad
    const memberExists = squad.members.some(member =>
      member.userId.toString() === userId
    );

    if (!memberExists) {
      return res.status(400).json({ success: false, error: 'User is not a member of this squad' });
    }

    // Remove user from squad
    squad.members = squad.members.filter(member =>
      member.userId.toString() !== userId
    );

    if (squad.members.length < 2) {
      squad.status = 'inactive';
    }

    await squad.save();

    // Update user's squad reference
    await User.findByIdAndUpdate(userId, {
      $unset: { squadId: 1, squadRole: 1 }
    });

    // Populate the squad data before returning
    const populatedSquad = await Squad.findById(squad._id)
      .populate('leader', 'name email')
      .populate('members.userId', 'name pubgId email');

    res.json({ success: true, data: populatedSquad });
  } catch (error) {
    console.error('Error in removeFromSquad:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Leave squad (user leaves their own squad)
const leaveSquad = async (req, res) => {
  try {
    const { squadId } = req.params;
    // Secure: Get userId from token
    const userId = req.user.userId;

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    // Check if user is in the squad
    const memberIndex = squad.members.findIndex(member =>
      member.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(400).json({ success: false, error: 'User is not a member of this squad' });
    }

    // If user is the leader, they can't leave - they must delete the squad
    if (squad.leader.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: 'Squad leader cannot leave. Please delete the squad instead.'
      });
    }

    // Remove user from squad
    squad.members.splice(memberIndex, 1);

    // If squad becomes too small, mark as inactive
    if (squad.members.length < 2) {
      squad.status = 'inactive';
    }

    await squad.save();

    // Update user's squad reference
    await User.findByIdAndUpdate(userId, {
      $unset: { squadId: 1, squadRole: 1 }
    });

    // Populate the squad data before returning
    const populatedSquad = await Squad.findById(squad._id)
      .populate('leader', 'name email')
      .populate('members.userId', 'name pubgId email');

    res.json({
      success: true,
      message: 'Successfully left squad',
      data: populatedSquad
    });

  } catch (error) {
    console.error('Error in leaveSquad:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Delete squad
const deleteSquad = async (req, res) => {
  try {
    const { squadId } = req.params;

    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(404).json({ success: false, error: 'Squad not found' });
    }

    // Remove squad references from all members
    const memberIds = squad.members.map(member => member.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $unset: { squadId: 1, squadRole: 1 } }
    );

    await Squad.findByIdAndDelete(squadId);

    res.json({ success: true, message: 'Squad deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getMySquad,
  getUserSquad,
  getAllSquads,
  getSquadById,
  createSquad,
  updateSquad,
  inviteToSquad,
  requestToJoinSquad,
  removeFromSquad,
  leaveSquad,
  deleteSquad
};
