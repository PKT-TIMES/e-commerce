import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Button,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ExpandLess as ExpandIcon,
  ExpandMore as CollapseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Translate as TranslateIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// API service
import chatbotAPI from '../../services/chatbotAPI';

// Store actions
import { 
  addMessage, 
  setLoading, 
  clearMessages,
  toggleChatbot,
  selectChatbotState 
} from '../../store/slices/chatbotSlice';

const ChatBot = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Redux state
  const { isOpen, messages, loading } = useSelector(selectChatbotState);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  // Local state
  const [message, setMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  
  // Speech recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle speech recognition
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);
  
  // Send message function
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    dispatch(addMessage(userMessage));
    setMessage('');
    setIsTyping(true);
    dispatch(setLoading(true));
    
    try {
      const response = await chatbotAPI.sendMessage({
        message: message,
        sessionId,
        context: {
          isAuthenticated,
          userRole: user?.role,
          language: i18n.language,
        }
      });
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response.message,
        sender: 'bot',
        timestamp: new Date(),
        type: response.data.response.type,
        data: response.data.response.products || response.data.response.order || null,
      };
      
      setTimeout(() => {
        dispatch(addMessage(botMessage));
        setIsTyping(false);
        dispatch(setLoading(false));
      }, 1000); // Simulate typing delay
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: t('chatbot.error'),
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      
      dispatch(addMessage(errorMessage));
      setIsTyping(false);
      dispatch(setLoading(false));
    }
  };
  
  // Handle key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  
  // Quick action buttons
  const quickActions = [
    { label: t('chatbot.quickActions.popularProducts'), message: 'Show me popular products' },
    { label: t('chatbot.quickActions.checkOrders'), message: 'Check my orders' },
    { label: t('chatbot.quickActions.help'), message: 'Help me find something' },
    { label: t('chatbot.quickActions.support'), message: 'Contact support' },
  ];
  
  // Handle quick actions
  const handleQuickAction = (actionMessage) => {
    setMessage(actionMessage);
    setTimeout(() => sendMessage(), 100);
  };
  
  // Toggle voice recognition
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };
  
  // Chat window content
  const ChatWindow = () => (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: isMobile ? 0 : 20,
        right: isMobile ? 0 : 20,
        width: isMobile ? '100%' : 380,
        height: isMobile ? '100%' : 600,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: isMobile ? 0 : 2,
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
            <BotIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              MintraTrade AI
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {t('chatbot.subtitle')}
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <IconButton
            size="small"
            sx={{ color: 'white', mr: 1 }}
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: 'white' }}
            onClick={() => dispatch(toggleChatbot())}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          backgroundColor: theme.palette.background.default,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <BotIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('chatbot.welcome')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('chatbot.welcomeMessage')}
            </Typography>
            
            {/* Quick Actions */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {quickActions.map((action, index) => (
                <Chip
                  key={index}
                  label={action.label}
                  onClick={() => handleQuickAction(action.message)}
                  variant="outlined"
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Box>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                  <BotIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Paper sx={{ p: 1, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 1, 2].map((dot) => (
                      <Box
                        key={dot}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: theme.palette.text.secondary,
                          animation: 'pulse 1.4s ease-in-out infinite',
                          animationDelay: `${dot * 0.16}s`,
                          '@keyframes pulse': {
                            '0%, 80%, 100%': { opacity: 0.3 },
                            '40%': { opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
      
      {/* Input Area */}
      <Box sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatbot.placeholder')}
            variant="outlined"
            size="small"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          
          {/* Voice input button */}
          {browserSupportsSpeechRecognition && (
            <Tooltip title={listening ? t('chatbot.stopListening') : t('chatbot.startListening')}>
              <IconButton
                onClick={toggleListening}
                color={listening ? 'error' : 'default'}
                disabled={loading}
              >
                {listening ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          {/* Send button */}
          <IconButton
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            color="primary"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              '&:disabled': {
                bgcolor: theme.palette.grey[300],
              },
            }}
          >
            {loading ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
      >
        <MenuItem onClick={() => dispatch(clearMessages())}>
          <HistoryIcon sx={{ mr: 1 }} />
          {t('chatbot.clearHistory')}
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          <TranslateIcon sx={{ mr: 1 }} />
          {t('chatbot.changeLanguage')}
        </MenuItem>
      </Menu>
    </Paper>
  );
  
  // Floating action button
  const FloatingButton = () => (
    <Tooltip title={t('chatbot.openChat')}>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          zIndex: 1300,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
        onClick={() => dispatch(toggleChatbot())}
      >
        <BotIcon sx={{ fontSize: 28 }} />
      </Paper>
    </Tooltip>
  );
  
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <ChatWindow />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <FloatingButton />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Message bubble component
const MessageBubble = ({ message }) => {
  const theme = useTheme();
  const isUser = message.sender === 'user';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1,
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      {!isUser && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
          <BotIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
      
      <Paper
        sx={{
          p: 1.5,
          maxWidth: '70%',
          borderRadius: 2,
          backgroundColor: isUser 
            ? theme.palette.primary.main 
            : message.isError 
              ? theme.palette.error.main 
              : theme.palette.background.paper,
          color: isUser || message.isError ? 'white' : theme.palette.text.primary,
          boxShadow: 1,
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.text}
        </Typography>
        
        {/* Render product cards or other data */}
        {message.data && message.type === 'product_search' && (
          <Box sx={{ mt: 1 }}>
            {/* Product cards would go here */}
          </Box>
        )}
        
        <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
      
      {isUser && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
          {message.sender === 'user' ? 'U' : 'B'}
        </Avatar>
      )}
    </Box>
  );
};

export default ChatBot;