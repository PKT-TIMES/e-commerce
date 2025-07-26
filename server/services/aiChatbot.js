const OpenAI = require('openai');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

class AIChatbotService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.systemPrompt = `
    You are MintraTrade AI Assistant, an advanced e-commerce chatbot for the global marketplace MintraTrade.
    
    Your capabilities include:
    - Help customers find products
    - Provide product recommendations
    - Assist with order tracking and status
    - Answer questions about shipping, returns, and policies
    - Help sellers manage their stores
    - Provide business insights and analytics
    - Support multiple languages
    - Handle customer complaints and support tickets
    
    Key platform features:
    - Global marketplace supporting all languages
    - Multi-payment options (Stripe, PayPal, Razorpay, COD)
    - Seller verification system
    - Business dashboard for sellers
    - AI-powered product recommendations
    - Real-time order tracking
    - 30-day return policy
    - 24/7 customer support
    
    Always be helpful, professional, and provide accurate information. If you need specific data from the database, indicate what information you need to retrieve.
    `;
  }

  async processMessage(message, userId, context = {}) {
    try {
      // Get user context
      const user = userId ? await User.findById(userId).populate('cart.product wishlist.product') : null;
      
      // Analyze user intent
      const intent = await this.analyzeIntent(message);
      
      // Handle specific intents
      switch (intent.type) {
        case 'product_search':
          return await this.handleProductSearch(intent.query, user);
        case 'order_inquiry':
          return await this.handleOrderInquiry(intent.orderNumber, user);
        case 'product_recommendation':
          return await this.handleProductRecommendation(user, intent.category);
        case 'seller_assistance':
          return await this.handleSellerAssistance(user, intent.query);
        case 'general_support':
          return await this.handleGeneralSupport(message, user, context);
        default:
          return await this.handleGeneralConversation(message, user, context);
      }
    } catch (error) {
      console.error('AI Chatbot Error:', error);
      return {
        message: "I apologize, but I'm experiencing some technical difficulties. Please try again or contact our support team for assistance.",
        type: 'error'
      };
    }
  }

  async analyzeIntent(message) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Analyze the user's message and determine their intent. Return a JSON object with:
          {
            "type": "product_search|order_inquiry|product_recommendation|seller_assistance|general_support|general_conversation",
            "query": "extracted search query or relevant text",
            "orderNumber": "extracted order number if any",
            "category": "product category if mentioned",
            "confidence": 0.0-1.0
          }`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.3
    });

    try {
      return JSON.parse(completion.choices[0].message.content);
    } catch {
      return { type: 'general_conversation', query: message, confidence: 0.5 };
    }
  }

  async handleProductSearch(query, user) {
    // Search products in database
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ],
      status: 'active',
      isActive: true
    })
    .populate('seller', 'firstName lastName sellerInfo.storeName')
    .limit(10)
    .sort({ averageRating: -1, totalSales: -1 });

    if (products.length === 0) {
      return {
        message: `I couldn't find any products matching "${query}". Would you like me to suggest some popular alternatives or help you search for something else?`,
        type: 'product_search',
        suggestions: await this.getPopularProducts()
      };
    }

    const productSummary = products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.discountedPrice || p.price,
      originalPrice: p.originalPrice,
      rating: p.averageRating,
      seller: p.seller.sellerInfo?.storeName || p.seller.fullName,
      image: p.images[0]?.url,
      inStock: p.inStock
    }));

    return {
      message: `I found ${products.length} products matching "${query}". Here are the top results:`,
      type: 'product_search',
      products: productSummary,
      query: query
    };
  }

  async handleOrderInquiry(orderNumber, user) {
    if (!user) {
      return {
        message: "Please log in to check your order status. I can help you track your orders once you're signed in.",
        type: 'auth_required'
      };
    }

    let order;
    if (orderNumber) {
      order = await Order.findOne({ orderNumber, customer: user._id })
        .populate('items.product', 'name images')
        .populate('items.seller', 'firstName lastName sellerInfo.storeName');
    } else {
      // Get latest order
      order = await Order.findOne({ customer: user._id })
        .sort({ createdAt: -1 })
        .populate('items.product', 'name images')
        .populate('items.seller', 'firstName lastName sellerInfo.storeName');
    }

    if (!order) {
      return {
        message: orderNumber 
          ? `I couldn't find an order with number ${orderNumber}. Please check the order number and try again.`
          : "You don't have any orders yet. Would you like me to help you find some great products?",
        type: 'order_not_found'
      };
    }

    const statusMessages = {
      pending: "Your order is being processed",
      confirmed: "Your order has been confirmed and will be shipped soon",
      processing: "Your order is being prepared for shipment",
      shipped: "Your order has been shipped and is on its way",
      delivered: "Your order has been delivered",
      cancelled: "Your order has been cancelled",
      returned: "Your order has been returned"
    };

    return {
      message: `Order #${order.orderNumber}: ${statusMessages[order.status]}`,
      type: 'order_status',
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
        orderDate: order.orderDate,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          status: item.status,
          tracking: item.tracking
        }))
      }
    };
  }

  async handleProductRecommendation(user, category) {
    let query = { status: 'active', isActive: true };
    
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Get personalized recommendations based on user's history
    if (user && user.cart.length > 0) {
      const cartProductIds = user.cart.map(item => item.product);
      const cartProducts = await Product.find({ _id: { $in: cartProductIds } });
      const categories = [...new Set(cartProducts.map(p => p.category))];
      
      if (categories.length > 0) {
        query.category = { $in: categories };
      }
    }

    const recommendations = await Product.find(query)
      .populate('seller', 'firstName lastName sellerInfo.storeName')
      .sort({ averageRating: -1, totalSales: -1 })
      .limit(8);

    return {
      message: category 
        ? `Here are some great ${category} products I recommend:`
        : "Based on your interests, here are some products you might like:",
      type: 'recommendations',
      products: recommendations.map(p => ({
        id: p._id,
        name: p.name,
        price: p.discountedPrice || p.price,
        originalPrice: p.originalPrice,
        rating: p.averageRating,
        seller: p.seller.sellerInfo?.storeName || p.seller.fullName,
        image: p.images[0]?.url,
        discount: p.discountPercentage
      }))
    };
  }

  async handleSellerAssistance(user, query) {
    if (!user || user.role !== 'seller') {
      return {
        message: "To access seller features, please register as a seller or log in to your seller account.",
        type: 'seller_auth_required'
      };
    }

    // Analyze seller query
    const sellerCompletion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are helping a seller on MintraTrade. Provide specific guidance for:
          - Product listing optimization
          - Inventory management
          - Order fulfillment
          - Customer service
          - Marketing strategies
          - Analytics insights
          - Account verification
          Keep responses practical and actionable.`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7
    });

    // Get seller analytics
    const sellerProducts = await Product.countDocuments({ seller: user._id });
    const sellerOrders = await Order.countDocuments({ 'items.seller': user._id });
    
    return {
      message: sellerCompletion.choices[0].message.content,
      type: 'seller_assistance',
      sellerStats: {
        totalProducts: sellerProducts,
        totalOrders: sellerOrders,
        storeVerified: user.sellerInfo?.isVerified || false,
        storeName: user.sellerInfo?.storeName || 'Your Store'
      }
    };
  }

  async handleGeneralSupport(message, user, context) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: this.systemPrompt
        },
        {
          role: "user",
          content: `User query: ${message}\nUser context: ${JSON.stringify({
            isLoggedIn: !!user,
            userType: user?.role || 'guest',
            hasOrders: user?.totalOrders > 0,
            cartItems: user?.cart?.length || 0
          })}`
        }
      ],
      temperature: 0.7
    });

    return {
      message: completion.choices[0].message.content,
      type: 'general_support'
    };
  }

  async handleGeneralConversation(message, user, context) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: this.systemPrompt + "\nKeep responses friendly and helpful. Always try to guide the conversation toward how you can assist with their shopping or selling needs."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.8
    });

    return {
      message: completion.choices[0].message.content,
      type: 'conversation',
      suggestions: [
        "Show me popular products",
        "Help me find something specific",
        "Check my order status",
        "Seller support"
      ]
    };
  }

  async getPopularProducts() {
    const popular = await Product.find({
      status: 'active',
      isActive: true
    })
    .sort({ totalSales: -1, averageRating: -1 })
    .limit(5)
    .select('name category price averageRating');

    return popular.map(p => p.name);
  }

  async generateProductTags(productName, description, category) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Generate relevant SEO tags for an e-commerce product. Return only a comma-separated list of tags."
        },
        {
          role: "user",
          content: `Product: ${productName}\nDescription: ${description}\nCategory: ${category}`
        }
      ],
      temperature: 0.5
    });

    return completion.choices[0].message.content.split(',').map(tag => tag.trim());
  }

  async translateText(text, targetLanguage) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Translate the following text to ${targetLanguage}. Return only the translation.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    return completion.choices[0].message.content;
  }
}

module.exports = new AIChatbotService();