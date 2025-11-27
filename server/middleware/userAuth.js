const jwt = require('jsonwebtoken');
const User = require('../schema/User');

const userAuth = async (req, res, next) => {
  try {
    //1. Get the token from the request header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({success: false, error: 'Access denied. No token provided.'});
    }
    const token = authHeader.split(' ')[1];

    //2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //3. Check user
    const user = await User.findById(decoded.userId);
    if(!user) {
      return res.status(401).json({success: false, error: 'User not found.'});
    }

    //Attach user to the request
    req.user = { userId: user._id.toString(), user };
    next();

  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({success: false, error: 'Invalid token.'});
  }
};

module.exports = userAuth;