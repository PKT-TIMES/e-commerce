const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');
const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { 
    expiresIn: '7d' 
  });
};

// Register
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, role = 'buyer' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    });

    // Initialize seller info if role is seller
    if (role === 'seller') {
      user.sellerInfo = {
        businessName: `${firstName} ${lastName}'s Store`,
        storeName: `${firstName} ${lastName}'s Store`
      };
    }

    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and check if account is locked
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incLoginAttempts();
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        preferences: user.preferences,
        sellerInfo: user.role === 'seller' ? user.sellerInfo : undefined
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resetPasswordToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        addresses: user.addresses,
        preferences: user.preferences,
        cart: user.cart,
        wishlist: user.wishlist,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        totalOrders: user.totalOrders,
        totalSpent: user.totalSpent,
        sellerInfo: user.role === 'seller' ? user.sellerInfo : undefined,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update profile
router.put('/profile', authMiddleware, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'avatar', 'preferences'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -emailVerificationToken');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Change password
router.put('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        message: 'If an account with that email exists, we\'ve sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        message: 'Failed to send reset email'
      });
    }

    res.json({
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Failed to process forgot password request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      message: 'Failed to verify email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Resend verification email
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        message: 'Failed to send verification email'
      });
    }

    res.json({
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout (client-side token removal, optional server-side blacklisting)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;