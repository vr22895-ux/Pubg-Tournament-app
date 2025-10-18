const User = require('../schema/User');

const userAuth = async (req, res, next) => {
  try {
    // For now, we'll get userId from the request body or params
    // In a real app, this would come from JWT token verification
    const userId = req.body.userId || req.params.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    // Add user info to request
    req.user = { userId: user._id.toString(), user };
    next();
    
  } catch (error) {
    console.error('Error in userAuth:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

module.exports = userAuth;
