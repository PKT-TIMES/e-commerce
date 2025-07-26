const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid token or user not found.'
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired.'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'Internal server error.'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.userId = decoded.userId;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Seller authorization (must be verified seller)
const authorizeVerifiedSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Access denied. Authentication required.'
    });
  }

  if (req.user.role !== 'seller') {
    return res.status(403).json({
      message: 'Access denied. Seller account required.'
    });
  }

  if (!req.user.sellerInfo?.isVerified) {
    return res.status(403).json({
      message: 'Access denied. Seller verification required.'
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  authorize,
  authorizeVerifiedSeller
};