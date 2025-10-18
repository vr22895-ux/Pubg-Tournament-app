const User = require('../schema/User');
const Match = require('../schema/matchSchema');

/**
 * GET /api/admin/users
 * Query parameters: search, status, page, limit
 * Returns paginated list of users with filtering and search
 */
exports.getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    let query = { role: 'user' };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { pubgId: searchRegex },
        { email: searchRegex }
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password -adminPassword')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get match statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Count matches participated
        const matchCount = await Match.countDocuments({
          'results.squadRankings': {
            $elemMatch: {
              'players.pubgId': user.pubgId
            }
          }
        });

        // Calculate total earnings (simplified - you might want to add a separate earnings field)
        const earnings = 0; // Placeholder - implement based on your business logic

        return {
          ...user,
          matchCount,
          earnings,
          lastActive: user.lastLoginAt || user.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/users/:userId
 * Returns detailed user information including match history
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -adminPassword')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get user's match history
    const matches = await Match.find({
      'results.squadRankings': {
        $elemMatch: {
          'players.pubgId': user.pubgId
        }
      }
    })
    .select('name startTime status results')
    .sort({ startTime: -1 })
    .lean();

    // Calculate statistics
    const totalMatches = matches.length;
    const wins = matches.filter(match => {
      const userRanking = match.results?.squadRankings?.find(ranking =>
        ranking.players?.some(player => player.pubgId === user.pubgId)
      );
      return userRanking?.rank === '1st Place';
    }).length;

    const userDetails = {
      ...user,
      statistics: {
        totalMatches,
        wins,
        winRate: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
        lastActive: user.lastLoginAt || user.createdAt
      },
      matchHistory: matches.slice(0, 10) // Last 10 matches
    };

    res.json({ success: true, data: userDetails });
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /api/admin/users/:userId/status
 * Body: { status, reason, adminNotes }
 * Updates user status (active, suspended, banned)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason, adminNotes } = req.body;

    // Validate status
    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be one of: active, suspended, banned' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update user status
    const updateData = { 
      status,
      updatedAt: new Date()
    };

    // Add admin notes if provided
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    // Add status change history
    if (!user.statusHistory) {
      user.statusHistory = [];
    }
    
    user.statusHistory.push({
      status,
      reason: reason || 'No reason provided',
      adminNotes: adminNotes || '',
      changedAt: new Date()
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: updateData,
        $push: { statusHistory: user.statusHistory[user.statusHistory.length - 1] }
      },
      { new: true, runValidators: true }
    ).select('-password -adminPassword');

    res.json({ 
      success: true, 
      data: updatedUser,
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Error in updateUserStatus:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/users/:userId/reports
 * Returns user reports and violations
 */
exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // For now, return mock data - implement based on your reporting system
    const reports = [
      {
        id: 1,
        type: 'cheating',
        description: 'Suspicious gameplay behavior',
        reporter: 'Anonymous',
        reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'pending',
        evidence: 'Match replay available'
      }
    ];

    res.json({ 
      success: true, 
      data: {
        userId,
        reports,
        totalReports: reports.length,
        activeReports: reports.filter(r => r.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Error in getUserReports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/admin/users/:userId/ban
 * Body: { reason, duration, adminNotes }
 * Bans a user with specified reason and duration
 */
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration, adminNotes } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Ban reason is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Calculate ban expiry
    let banExpiry = null;
    if (duration && duration !== 'permanent') {
      const durationMap = {
        '1day': 24 * 60 * 60 * 1000,
        '3days': 3 * 24 * 60 * 60 * 1000,
        '1week': 7 * 24 * 60 * 60 * 1000,
        '1month': 30 * 24 * 60 * 60 * 1000
      };
      
      if (durationMap[duration]) {
        banExpiry = new Date(Date.now() + durationMap[duration]);
      }
    }

    // Update user status to banned
    const updateData = {
      status: 'banned',
      banReason: reason,
      banExpiry,
      adminNotes: adminNotes || '',
      updatedAt: new Date()
    };

    // Add to status history
    if (!user.statusHistory) {
      user.statusHistory = [];
    }
    
    user.statusHistory.push({
      status: 'banned',
      reason,
      adminNotes: adminNotes || '',
      banExpiry,
      changedAt: new Date()
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: updateData,
        $push: { statusHistory: user.statusHistory[user.statusHistory.length - 1] }
      },
      { new: true, runValidators: true }
    ).select('-password -adminPassword');

    res.json({ 
      success: true, 
      data: updatedUser,
      message: `User banned successfully${banExpiry ? ` until ${banExpiry.toISOString()}` : ' permanently'}`
    });
  } catch (error) {
    console.error('Error in banUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/admin/users/:userId/unban
 * Body: { adminNotes }
 * Unbans a user
 */
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminNotes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (user.status !== 'banned') {
      return res.status(400).json({ success: false, error: 'User is not banned' });
    }

    // Update user status to active
    const updateData = {
      status: 'active',
      banReason: null,
      banExpiry: null,
      adminNotes: adminNotes || '',
      updatedAt: new Date()
    };

    // Add to status history
    if (!user.statusHistory) {
      user.statusHistory = [];
    }
    
    user.statusHistory.push({
      status: 'active',
      reason: 'Unbanned by admin',
      adminNotes: adminNotes || '',
      changedAt: new Date()
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: updateData,
        $push: { statusHistory: user.statusHistory[user.statusHistory.length - 1] }
      },
      { new: true, runValidators: true }
    ).select('-password -adminPassword');

    res.json({ 
      success: true, 
      data: updatedUser,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Error in unbanUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
