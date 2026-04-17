const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found, not authorized' });
      }

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Normalize roles for comparison (lowercase and remove non-alphanumeric)
    const normalize = (role) => role.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedUserRole = normalize(userRole);
    const normalizedAllowedRoles = roles.map(normalize);

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${userRole}'. This route requires one of the following roles: ${roles.join(', ')}.`,
        debug: {
          currentRole: userRole,
          requiredRoles: roles
        }
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
