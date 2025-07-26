const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Size", "Color"
  value: { type: String, required: true }, // e.g., "Large", "Red"
  price: { type: Number }, // Additional price for this variant
  stock: { type: Number, default: 0 },
  sku: { type: String }
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  comment: { type: String },
  images: [{ type: String }],
  isVerified: { type: Boolean, default: false }, // Verified purchase
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  unhelpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  
  // Seller information
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Pricing
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number }, // For discount calculations
  currency: { type: String, default: 'USD' },
  
  // Categories and tags
  category: { type: String, required: true },
  subcategory: { type: String },
  tags: [{ type: String }],
  brand: { type: String },
  
  // Images and media
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  videos: [{ type: String }],
  
  // Inventory
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, unique: true },
  variants: [variantSchema],
  
  // Physical properties
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    unit: { type: String, default: 'cm' }
  },
  weight: {
    value: { type: Number },
    unit: { type: String, default: 'kg' }
  },
  
  // Shipping
  shipping: {
    free: { type: Boolean, default: false },
    cost: { type: Number, default: 0 },
    estimatedDays: { type: Number, default: 7 },
    restrictions: [{ type: String }] // Countries where shipping is restricted
  },
  
  // SEO and metadata
  slug: { type: String, unique: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  
  // Status and visibility
  status: { 
    type: String, 
    enum: ['draft', 'active', 'inactive', 'out_of_stock'], 
    default: 'draft' 
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  
  // Reviews and ratings
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  
  // Sales analytics
  totalSales: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  
  // AI and recommendations
  aiTags: [{ type: String }], // AI-generated tags for better search
  similarProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  // Promotions
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false }
  },
  
  // Digital products
  isDigital: { type: Boolean, default: false },
  downloadUrl: { type: String },
  downloadLimit: { type: Number },
  
  // Multilingual support
  translations: [{
    language: { type: String },
    name: { type: String },
    description: { type: String },
    shortDescription: { type: String }
  }],
  
  // Quality assurance
  isVerified: { type: Boolean, default: false },
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, isActive: 1 });
productSchema.index({ slug: 1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount || !this.discount.isActive) return this.price;
  
  const now = new Date();
  if (this.discount.startDate && now < this.discount.startDate) return this.price;
  if (this.discount.endDate && now > this.discount.endDate) return this.price;
  
  if (this.discount.type === 'percentage') {
    return this.price - (this.price * this.discount.value / 100);
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  next();
});

// Update average rating when reviews change
productSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = Number((sum / this.reviews.length).toFixed(1));
    this.totalReviews = this.reviews.length;
  }
  return this.save();
};

// Increment view count
productSchema.methods.incrementViews = function() {
  return this.updateOne({ $inc: { views: 1 } });
};

// Check if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0 || this.variants.some(variant => variant.stock > 0);
});

module.exports = mongoose.model('Product', productSchema);