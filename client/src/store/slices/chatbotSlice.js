import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  messages: [],
  loading: false,
  isTyping: false,
  sessionId: null,
  error: null,
  settings: {
    language: 'en',
    voiceEnabled: false,
    soundEnabled: true,
  },
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    toggleChatbot: (state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen && !state.sessionId) {
        state.sessionId = `session_${Date.now()}`;
      }
    },

    openChatbot: (state) => {
      state.isOpen = true;
      if (!state.sessionId) {
        state.sessionId = `session_${Date.now()}`;
      }
    },

    closeChatbot: (state) => {
      state.isOpen = false;
    },

    addMessage: (state, action) => {
      const message = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString(),
      };
      state.messages.push(message);
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.isTyping = false;
    },

    clearMessages: (state) => {
      state.messages = [];
    },

    clearError: (state) => {
      state.error = null;
    },

    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },

    // Handle real-time messages from Socket.IO
    receiveMessage: (state, action) => {
      const message = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        sender: 'bot',
      };
      state.messages.push(message);
      state.isTyping = false;
      state.loading = false;
    },

    // Handle suggestions
    addSuggestions: (state, action) => {
      const suggestions = action.payload;
      const suggestionMessage = {
        id: `suggestions_${Date.now()}`,
        type: 'suggestions',
        suggestions,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      state.messages.push(suggestionMessage);
    },

    // Handle quick actions
    handleQuickAction: (state, action) => {
      const { action: quickAction, message } = action.payload;
      
      // Add user message for the quick action
      const userMessage = {
        id: `quick_${Date.now()}`,
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        isQuickAction: true,
      };
      
      state.messages.push(userMessage);
      state.loading = true;
    },

    // Update message status (for read receipts, etc.)
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find(msg => msg.id === messageId);
      if (message) {
        message.status = status;
      }
    },

    // Handle typing indicator from other users (for multi-user chats)
    setOtherUserTyping: (state, action) => {
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        state.typingUsers = state.typingUsers || [];
        if (!state.typingUsers.includes(userId)) {
          state.typingUsers.push(userId);
        }
      } else {
        state.typingUsers = (state.typingUsers || []).filter(id => id !== userId);
      }
    },

    // Reset chatbot state
    resetChatbot: (state) => {
      return {
        ...initialState,
        settings: state.settings, // Preserve settings
      };
    },
  },
});

export const {
  toggleChatbot,
  openChatbot,
  closeChatbot,
  addMessage,
  setLoading,
  setTyping,
  setError,
  clearMessages,
  clearError,
  updateSettings,
  setSessionId,
  receiveMessage,
  addSuggestions,
  handleQuickAction,
  updateMessageStatus,
  setOtherUserTyping,
  resetChatbot,
} = chatbotSlice.actions;

// Selectors
export const selectChatbotState = (state) => state.chatbot;
export const selectChatbotIsOpen = (state) => state.chatbot.isOpen;
export const selectChatbotMessages = (state) => state.chatbot.messages;
export const selectChatbotLoading = (state) => state.chatbot.loading;
export const selectChatbotTyping = (state) => state.chatbot.isTyping;
export const selectChatbotError = (state) => state.chatbot.error;
export const selectChatbotSettings = (state) => state.chatbot.settings;
export const selectChatbotSessionId = (state) => state.chatbot.sessionId;

// Derived selectors
export const selectLastMessage = (state) => {
  const messages = state.chatbot.messages;
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

export const selectUnreadMessagesCount = (state) => {
  return state.chatbot.messages.filter(msg => 
    msg.sender === 'bot' && msg.status !== 'read'
  ).length;
};

export default chatbotSlice.reducer;