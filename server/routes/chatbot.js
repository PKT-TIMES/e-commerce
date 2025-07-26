const express = require('express');
const { body, validationResult } = require('express-validator');
const aiChatbot = require('../services/aiChatbot');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Chat with AI assistant
router.post('/chat', optionalAuth, [
  body('message').trim().isLength({ min: 1 }).withMessage('Message cannot be empty'),
  body('sessionId').optional().isString().withMessage('Session ID must be a string'),
  body('context').optional().isObject().withMessage('Context must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, sessionId, context = {} } = req.body;
    const userId = req.userId || null;

    // Process message with AI chatbot
    const response = await aiChatbot.processMessage(message, userId, {
      sessionId,
      ...context,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Emit real-time response if user is connected
    if (userId && req.io) {
      req.io.to(`user_${userId}`).emit('chatbot-response', {
        sessionId,
        response,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      response,
      sessionId,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat history for authenticated users
router.get('/history', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Authentication required to access chat history'
      });
    }

    // In a real implementation, you'd store chat history in database
    // For now, return empty array
    res.json({
      history: [],
      message: 'Chat history feature coming soon'
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      message: 'Failed to fetch chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate product tags using AI
router.post('/generate-tags', [
  body('productName').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productName, description, category } = req.body;

    const tags = await aiChatbot.generateProductTags(productName, description, category);

    res.json({
      success: true,
      tags,
      message: 'Tags generated successfully'
    });
  } catch (error) {
    console.error('Tag generation error:', error);
    res.status(500).json({
      message: 'Failed to generate tags',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Translate text
router.post('/translate', [
  body('text').trim().isLength({ min: 1 }).withMessage('Text is required'),
  body('targetLanguage').trim().isLength({ min: 2 }).withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { text, targetLanguage } = req.body;

    const translation = await aiChatbot.translateText(text, targetLanguage);

    res.json({
      success: true,
      originalText: text,
      translatedText: translation,
      targetLanguage,
      message: 'Translation completed successfully'
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      message: 'Failed to translate text',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chatbot capabilities and features
router.get('/features', (req, res) => {
  try {
    res.json({
      features: [
        {
          name: 'Product Search',
          description: 'Find products by name, category, or description',
          examples: ['Find me smartphones', 'Show me laptops under $1000']
        },
        {
          name: 'Order Tracking',
          description: 'Check order status and tracking information',
          examples: ['Check my order status', 'Track order MT24010001']
        },
        {
          name: 'Product Recommendations',
          description: 'Get personalized product suggestions',
          examples: ['Recommend products for me', 'Show me trending items']
        },
        {
          name: 'Seller Support',
          description: 'Help with store management and seller tools',
          examples: ['How to list a product?', 'Seller dashboard help']
        },
        {
          name: 'Customer Support',
          description: 'Answer questions about policies, shipping, returns',
          examples: ['What is your return policy?', 'How long does shipping take?']
        },
        {
          name: 'Multi-language Support',
          description: 'Communicate in your preferred language',
          examples: ['Switch to Spanish', 'Help me in French']
        }
      ],
      languages: [
        'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
        'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'
      ],
      quickActions: [
        'Show popular products',
        'Check my orders',
        'Help me find something',
        'Contact support',
        'View my cart',
        'Track my package'
      ]
    });
  } catch (error) {
    console.error('Features fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch chatbot features',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Chatbot health check
router.get('/health', async (req, res) => {
  try {
    // Test AI service connectivity
    const testResponse = await aiChatbot.processMessage('Hello', null, { test: true });
    
    res.json({
      status: 'healthy',
      aiService: testResponse ? 'connected' : 'disconnected',
      timestamp: new Date(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Chatbot health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      aiService: 'disconnected',
      error: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;