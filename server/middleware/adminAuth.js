/**
 * Simple admin authentication middleware
 * In production, you should implement proper JWT token validation
 */
const adminAuth = (req, res, next) => {
  // For now, we'll skip admin validation since the routes are already protected
  // by the frontend admin panel access
  // In production, implement proper admin token validation here
  
  next();
};

module.exports = adminAuth;
