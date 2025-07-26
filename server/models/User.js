const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const sellerInfoSchema = new mongoose.Schema({
  businessName: { type: String },
  businessType: { type: String, enum: ['individual', 'company', 'partnership'] },
  taxId: { type: String },
  bankDetails: {
    accountNumber: { type: String },
    routingNumber: { type: String },
    accountHolderName: { type: String }
  },
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{
    type: { type: String },
    url: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  rating: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  commission: { type: Number, default: 5 }, // Platform commission percentage
  storeName: { type: String },
  storeDescription: { type: String },
  storeLogo: { type: String }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String },
  avatar: { type: String, default: '' },
  
  role: { 
    type: String, 
    enum: ['buyer', 'seller', 'admin'], 
    default: 'buyer' 
  },
  
  addresses: [addressSchema],
  
  // Seller specific information
  sellerInfo: sellerInfoSchema,
  
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  
  // Shopping cart
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    variant: { type: String }, // Size, color, etc.
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Wishlist
  wishlist: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Account status
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  
  // Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // Analytics
  lastLogin: { type: Date },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  
  // Tokens for password reset, email verification
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  emailVerificationToken: { type: String },
  
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'sellerInfo.isVerified': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

module.exports = mongoose.model('User', userSchema);