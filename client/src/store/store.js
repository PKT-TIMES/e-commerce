import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import slices
import authSlice from './slices/authSlice';
import cartSlice from './slices/cartSlice';
import productSlice from './slices/productSlice';
import orderSlice from './slices/orderSlice';
import uiSlice from './slices/uiSlice';
import chatbotSlice from './slices/chatbotSlice';

// Import API slices
import { apiSlice } from './api/apiSlice';

// Configure store
const store = configureStore({
  reducer: {
    // RTK Query API slice
    api: apiSlice.reducer,
    
    // Feature slices
    auth: authSlice,
    cart: cartSlice,
    products: productSlice,
    orders: orderSlice,
    ui: uiSlice,
    chatbot: chatbotSlice,
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

export default store;

// Export types for TypeScript (if needed later)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;