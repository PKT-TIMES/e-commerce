const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Price at time of purchase
  variant: { type: String }, // Selected variant (size, color, etc.)
  commission: { type: Number, default: 5 }, // Platform commission percentage
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  tracking: {
    carrier: { type: String },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    updates: [{
      status: { type: String },
      message: { type: String },
      timestamp: { type: Date, default: Date.now },
      location: { type: String }
    }]
  }
});

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { type: String, unique: true, required: true },
  
  // Customer information
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Order items
  items: [orderItemSchema],
  
  // Pricing breakdown
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Shipping information
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String }
  },
  
  // Billing information
  billingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String }
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'razorpay', 'cod', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: { type: String },
    paymentIntentId: { type: String }, // For Stripe
    refunds: [{
      amount: { type: Number },
      reason: { type: String },
      status: { type: String },
      refundId: { type: String },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  
  // Dates
  orderDate: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  estimatedDelivery: { type: Date },
  
  // Communication
  notes: { type: String },
  customerNotes: { type: String },
  internalNotes: { type: String },
  
  // Tracking and notifications
  notifications: {
    orderConfirmed: { type: Boolean, default: false },
    orderShipped: { type: Boolean, default: false },
    orderDelivered: { type: Boolean, default: false }
  },
  
  // Returns and cancellations
  cancellation: {
    reason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    refundAmount: { type: Number }
  },
  
  returns: [{
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number },
      reason: { type: String }
    }],
    reason: { type: String },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'received', 'processed', 'completed']
    },
    refundAmount: { type: Number },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date }
  }],
  
  // Analytics and metadata
  source: { type: String, default: 'web' }, // web, mobile, api
  device: { type: String },
  browser: { type: String },
  ip: { type: String },
  
  // Multi-seller order handling
  subOrders: [{
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ type: mongoose.Schema.Types.ObjectId }],
    status: { type: String },
    total: { type: Number },
    commission: { type: Number }
  }],
  
  // Customer service
  supportTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket'
  }],
  
  // Reviews
  reviewsCompleted: { type: Boolean, default: false },
  
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ 'items.product': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    });
    
    this.orderNumber = `MT${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  next();
});

// Instance methods
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

orderSchema.methods.canBeReturned = function() {
  const daysSinceDelivery = this.deliveredAt ? 
    (Date.now() - this.deliveredAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
  return this.status === 'delivered' && daysSinceDelivery <= 30;
};

orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = new Date();
      break;
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
  }
  
  return this.save();
};

// Static methods
orderSchema.statics.getOrdersByDateRange = function(startDate, endDate) {
  return this.find({
    orderDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('customer', 'firstName lastName email')
    .populate('items.product', 'name price')
    .populate('items.seller', 'firstName lastName sellerInfo.storeName');
};

orderSchema.statics.getSalesAnalytics = function(sellerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'items.seller': mongoose.Types.ObjectId(sellerId),
        orderDate: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'returned'] }
      }
    },
    {
      $unwind: '$items'
    },
    {
      $match: {
        'items.seller': mongoose.Types.ObjectId(sellerId)
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalCommission: { $sum: { $multiply: ['$items.price', '$items.quantity', { $divide: ['$items.commission', 100] }] } }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);