import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class ChatbotAPI {
  // Send message to AI chatbot
  async sendMessage(data) {
    try {
      const response = await api.post('/chatbot/chat', data);
      return response;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw this.handleError(error);
    }
  }

  // Get chat history
  async getChatHistory(sessionId) {
    try {
      const response = await api.get(`/chatbot/history`, {
        params: { sessionId }
      });
      return response;
    } catch (error) {
      console.error('Chat History API Error:', error);
      throw this.handleError(error);
    }
  }

  // Get chatbot features and capabilities
  async getFeatures() {
    try {
      const response = await api.get('/chatbot/features');
      return response;
    } catch (error) {
      console.error('Features API Error:', error);
      throw this.handleError(error);
    }
  }

  // Generate product tags using AI
  async generateProductTags(productData) {
    try {
      const response = await api.post('/chatbot/generate-tags', productData);
      return response;
    } catch (error) {
      console.error('Tag Generation API Error:', error);
      throw this.handleError(error);
    }
  }

  // Translate text
  async translateText(text, targetLanguage) {
    try {
      const response = await api.post('/chatbot/translate', {
        text,
        targetLanguage
      });
      return response;
    } catch (error) {
      console.error('Translation API Error:', error);
      throw this.handleError(error);
    }
  }

  // Check chatbot health
  async checkHealth() {
    try {
      const response = await api.get('/chatbot/health');
      return response;
    } catch (error) {
      console.error('Health Check API Error:', error);
      throw this.handleError(error);
    }
  }

  // Get product recommendations
  async getRecommendations(userId, context = {}) {
    try {
      const response = await api.post('/chatbot/recommendations', {
        userId,
        context
      });
      return response;
    } catch (error) {
      console.error('Recommendations API Error:', error);
      throw this.handleError(error);
    }
  }

  // Search products via chatbot
  async searchProducts(query, filters = {}) {
    try {
      const response = await api.post('/chatbot/search', {
        query,
        filters
      });
      return response;
    } catch (error) {
      console.error('Product Search API Error:', error);
      throw this.handleError(error);
    }
  }

  // Get order information via chatbot
  async getOrderInfo(orderNumber) {
    try {
      const response = await api.post('/chatbot/order-info', {
        orderNumber
      });
      return response;
    } catch (error) {
      console.error('Order Info API Error:', error);
      throw this.handleError(error);
    }
  }

  // Report chatbot feedback
  async submitFeedback(feedback) {
    try {
      const response = await api.post('/chatbot/feedback', feedback);
      return response;
    } catch (error) {
      console.error('Feedback API Error:', error);
      throw this.handleError(error);
    }
  }

  // Handle quick actions
  async handleQuickAction(action, context = {}) {
    try {
      const response = await api.post('/chatbot/quick-action', {
        action,
        context
      });
      return response;
    } catch (error) {
      console.error('Quick Action API Error:', error);
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Service not found');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Utility methods for real-time features
  createEventSource(sessionId) {
    const token = localStorage.getItem('token');
    const baseURL = process.env.REACT_APP_API_URL || '';
    
    return new EventSource(
      `${baseURL}/chatbot/stream?sessionId=${sessionId}&token=${token}`
    );
  }

  // Format message for sending
  formatMessage(text, context = {}) {
    return {
      message: text.trim(),
      sessionId: context.sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: {
        language: context.language || 'en',
        platform: 'web',
        userAgent: navigator.userAgent,
        ...context
      }
    };
  }

  // Parse bot response
  parseResponse(response) {
    const { data } = response;
    
    return {
      id: `bot_${Date.now()}`,
      text: data.response.message,
      sender: 'bot',
      timestamp: data.timestamp,
      type: data.response.type,
      data: data.response.data,
      suggestions: data.response.suggestions,
      actions: data.response.actions,
    };
  }

  // Voice message handling (if needed for future implementation)
  async sendVoiceMessage(audioBlob, context = {}) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('context', JSON.stringify(context));

      const response = await api.post('/chatbot/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response;
    } catch (error) {
      console.error('Voice Message API Error:', error);
      throw this.handleError(error);
    }
  }

  // Image analysis (for product recommendations based on images)
  async analyzeImage(imageFile, context = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('context', JSON.stringify(context));

      const response = await api.post('/chatbot/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response;
    } catch (error) {
      console.error('Image Analysis API Error:', error);
      throw this.handleError(error);
    }
  }
}

// Create and export singleton instance
const chatbotAPI = new ChatbotAPI();
export default chatbotAPI;