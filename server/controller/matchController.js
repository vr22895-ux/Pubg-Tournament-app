const Match = require('../schema/matchSchema');
const Wallet = require('../schema/Wallet');
const User = require('../schema/User');
const Squad = require('../schema/Squad');

// Get all matches
exports.getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ startTime: -1 }); // Fetch all matches
    
    // Add player count information
    const matchesWithPlayerCount = matches.map(match => ({
      ...match.toObject(),
      playersJoined: match.registeredPlayers ? match.registeredPlayers.length : 0,
      availableSlots: match.maxPlayers - (match.registeredPlayers ? match.registeredPlayers.length : 0)
    }));
    
    res.json({ success: true, data: matchesWithPlayerCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get matches the current user has joined
exports.getMyMatches = async (req, res) => {
  try {
    // Get user id from the request
    const userId = req.user.userId;

    const matches = await Match.find({
      'registeredPlayers.userId': userId
    }).sort({ startTime: -1 }); // Newest matches first
    
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({success: false, error: error.message});
  }
};

// Create new match
exports.createMatch = async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all matches for management
exports.getAllMatchesForManagement = async (req, res) => {
  try {
    const matches = await Match.find().sort({ startTime: -1 });
    
    // Add player count and enhance match data for management
    const enhancedMatches = matches.map(match => ({
      _id: match._id,
      name: match.name,
      entryFee: match.entryFee,
      prizePool: match.prizePool,
      maxPlayers: match.maxPlayers,
      map: match.map,
      startTime: match.startTime,
      status: match.status,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      // Calculate players joined (this would come from actual player registrations)
      playersJoined: 0, // Placeholder - in real app, this would count actual registrations
      // Add prize distribution summary
      prizeDistribution: match.prizeDistribution
    }));
    
    res.json({ success: true, data: enhancedMatches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get completed matches for results
exports.getCompletedMatches = async (req, res) => {
  try {
    // Get ALL matches for results upload (not just completed ones)
    // This allows admins to select any match they want to manage
    const matches = await Match.find({
      // Only exclude matches that already have results uploaded
      $or: [
        { 'results.isCompleted': { $exists: false } },
        { 'results.isCompleted': false }
      ]
    }).sort({ startTime: -1 });
    
    console.log(`Found ${matches.length} matches available for results`);
    
    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Error in getCompletedMatches:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload match results
exports.uploadResults = async (req, res) => {
  try {
    const { matchId, results } = req.body;
    
    if (!matchId || !results) {
      return res.status(400).json({ 
        success: false, 
        error: 'Match ID and results are required' 
      });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }

    if (match.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot upload results for cancelled match' 
      });
    }

    // Calculate prize distribution
    const calculatedResults = await calculatePrizeDistribution(match, results);
    
    // Update match with results
    match.results = calculatedResults;
    match.status = 'completed';
    match.updatedAt = new Date();
    
    await match.save();
    
    res.json({ 
      success: true, 
      data: match,
      message: 'Match results uploaded successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Calculate prize distribution based on results
async function calculatePrizeDistribution(match, results) {
  const { squadRankings, totalParticipants, matchDuration, specialAwards, notes } = results;
  
  // Calculate rank rewards
  const rankRewards = [];
  for (let i = 0; i < Math.min(squadRankings.length, 5); i++) {
    const squad = squadRankings[i];
    const rankIndex = i;
    const rankReward = match.prizeDistribution.rankRewards.ranks[rankIndex];
    
    if (rankReward) {
      squad.prizeAmount = rankReward.amount;
      rankRewards.push(squad);
    }
  }
  
  // Calculate kill rewards
  let totalKillRewards = 0;
  const maxKills = match.prizeDistribution.killRewards.maxKills;
  const perKill = match.prizeDistribution.killRewards.perKill;
  
  squadRankings.forEach(squad => {
    const killReward = Math.min(squad.kills, maxKills) * perKill;
    squad.killReward = killReward;
    totalKillRewards += killReward;
  });
  
  // Calculate custom rewards
  let totalCustomRewards = 0;
  if (specialAwards && specialAwards.length > 0) {
    specialAwards.forEach(award => {
      const customReward = match.prizeDistribution.customRewards.find(
        cr => cr.name === award.name
      );
      if (customReward) {
        award.amount = customReward.amount;
        totalCustomRewards += customReward.amount;
      }
    });
  }
  
  // Calculate total distributed
  const totalDistributed = rankRewards.reduce((sum, squad) => sum + squad.prizeAmount, 0) + 
                          totalKillRewards + totalCustomRewards;
  
  return {
    isCompleted: true,
    completedAt: new Date(),
    squadRankings: rankRewards,
    totalParticipants,
    matchDuration,
    specialAwards,
    notes,
    prizeSummary: {
      totalDistributed,
      rankRewardsTotal: rankRewards.reduce((sum, squad) => sum + squad.prizeAmount, 0),
      killRewardsTotal: totalKillRewards,
      customRewardsTotal: totalCustomRewards
    }
  };
}

// Get match results by ID
exports.getMatchResults = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    if (!match.results.isCompleted) {
      return res.status(400).json({ 
        success: false, 
        error: 'Match results not yet uploaded' 
      });
    }
    
    res.json({ success: true, data: match.results });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update match status
exports.updateMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    
    if (!['upcoming', 'live', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }
    
    const match = await Match.findByIdAndUpdate(
      matchId, 
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    res.json({ success: true, data: match });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Auto-update match statuses based on time
exports.autoUpdateMatchStatuses = async (req, res) => {
  try {
    const now = new Date();
    
    // Update upcoming matches that have started to live
    const startedMatches = await Match.updateMany(
      { 
        status: 'upcoming',
        startTime: { $lte: now }
      },
      { 
        $set: { 
          status: 'live',
          updatedAt: now
        }
      }
    );
    
    // Update live matches that have been running for more than 2 hours to completed
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const completedMatches = await Match.updateMany(
      { 
        status: 'live',
        startTime: { $lte: twoHoursAgo }
      },
      { 
        $set: { 
          status: 'completed',
          updatedAt: now
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Match statuses updated automatically',
      data: {
        started: startedMatches.modifiedCount,
        completed: completedMatches.modifiedCount
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel a match
exports.cancelMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    if (match.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel completed match' 
      });
    }
    
    if (match.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Match is already cancelled' 
      });
    }
    
    // Update match status to cancelled
    match.status = 'cancelled';
    match.updatedAt = new Date();
    await match.save();
    
    res.json({ 
      success: true, 
      data: match,
      message: 'Match cancelled successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a match permanently
exports.deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    // Only allow deletion of cancelled or upcoming matches
    if (match.status === 'live' || match.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete live or completed matches' 
      });
    }
    
    // Check if any players have joined (in real app, check player registrations)
    // For now, we'll allow deletion but in production you'd want to check this
    
    await Match.findByIdAndDelete(matchId);
    
    res.json({ 
      success: true, 
      message: 'Match deleted successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get match details by ID
exports.getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    res.json({ success: true, data: match });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update an existing match
exports.updateMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const updateData = req.body;
    
    // Check if match exists
    const existingMatch = await Match.findById(matchId);
    if (!existingMatch) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    // Prevent updating completed or live matches
    if (existingMatch.status === 'completed' || existingMatch.status === 'live') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot update completed or live matches' 
      });
    }
    
    // Validate prize distribution
    if (updateData.prizeDistribution) {
      const totalDistributed = updateData.prizeDistribution.summary.totalDistributed;
      if (totalDistributed > updateData.prizePool) {
        return res.status(400).json({ 
          success: false, 
          error: 'Total distributed amount exceeds prize pool' 
        });
      }
    }
    
    // Update the match
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    res.json({ 
      success: true, 
      data: updatedMatch,
      message: 'Match updated successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Join match with entry fee deduction
exports.joinMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, squadId } = req.body;
    
    // Validate input
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // Find match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    // Check if match is open for registration
    if (match.status !== 'upcoming') {
      return res.status(400).json({ 
        success: false, 
        error: 'Match is not open for registration' 
      });
    }
    
    // Check if match is full
    if (match.registeredPlayers.length >= match.maxPlayers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Match is full' 
      });
    }
    
    // Check if user is already registered
    const alreadyRegistered = match.registeredPlayers.find(
      player => player.userId.toString() === userId
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already registered for this match' 
      });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Get user's wallet
    const wallet = await Wallet.findOne({ userId, status: 'active' });
    if (!wallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet not found. Please create a wallet first.' 
      });
    }
    
    // Check if user can afford entry fee
    if (wallet.balance < match.entryFee) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance',
        required: match.entryFee,
        available: wallet.balance
      });
    }
    
    // Get squad details if provided
    let squadName = null;
    if (squadId) {
      const squad = await Squad.findById(squadId);
      if (squad) {
        squadName = squad.name;
      }
    }
    
    // Deduct entry fee from wallet
    const paymentReference = `MATCH_${matchId}_${Date.now()}`;
    await wallet.deductMoney(
      match.entryFee, 
      `Match entry fee - ${match.name}`, 
      paymentReference
    );
    
    // Register player for match
    match.registeredPlayers.push({
      userId: userId,
      userName: user.name,
      pubgId: user.pubgId,
      squadId: squadId,
      squadName: squadName,
      registrationTime: new Date(),
      entryFeePaid: true,
      paymentReference: paymentReference,
      status: 'confirmed'
    });
    
    await match.save();
    
    res.json({
      success: true,
      message: 'Successfully joined match!',
      data: {
        matchId: match._id,
        matchName: match.name,
        entryFee: match.entryFee,
        newBalance: wallet.balance,
        paymentReference: paymentReference
      }
    });
    
  } catch (error) {
    console.error('Error in joinMatch:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Leave match (with refund if applicable)
exports.leaveMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId } = req.body;
    
    // Validate input
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // Find match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    // Check if match is open for registration changes
    if (match.status !== 'upcoming') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot leave match after it has started' 
      });
    }
    
    // Find player registration
    const playerIndex = match.registeredPlayers.findIndex(
      player => player.userId.toString() === userId
    );
    
    if (playerIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are not registered for this match' 
      });
    }
    
    const player = match.registeredPlayers[playerIndex];
    
    // Remove player from match
    match.registeredPlayers.splice(playerIndex, 1);
    await match.save();
    
    // Refund entry fee if paid
    if (player.entryFeePaid && player.paymentReference) {
      const wallet = await Wallet.findOne({ userId, status: 'active' });
      if (wallet) {
        await wallet.addMoney(
          match.entryFee,
          `Refund - Left match: ${match.name}`,
          `REFUND_${player.paymentReference}`
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Successfully left match',
      data: {
        matchId: match._id,
        matchName: match.name,
        refundedAmount: player.entryFeePaid ? match.entryFee : 0
      }
    });
    
  } catch (error) {
    console.error('Error in leaveMatch:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get match registrations
exports.getMatchRegistrations = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: 'Match not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        matchId: match._id,
        matchName: match.name,
        maxPlayers: match.maxPlayers,
        registeredPlayers: match.registeredPlayers,
        totalRegistered: match.registeredPlayers.length,
        availableSlots: match.maxPlayers - match.registeredPlayers.length
      }
    });
    
  } catch (error) {
    console.error('Error in getMatchRegistrations:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
