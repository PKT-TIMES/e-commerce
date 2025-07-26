import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, variant } = action.payload;
      const existingItem = state.items.find(
        item => item.product.id === product.id && item.variant === variant
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: `${product.id}_${variant || 'default'}`,
          product,
          quantity,
          variant,
          addedAt: new Date().toISOString(),
        });
      }

      cartSlice.caseReducers.calculateTotals(state);
    },

    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      cartSlice.caseReducers.calculateTotals(state);
    },

    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.id !== itemId);
        } else {
          item.quantity = quantity;
        }
      }

      cartSlice.caseReducers.calculateTotals(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },

    setCartLoading: (state, action) => {
      state.loading = action.payload;
    },

    setCartError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    syncCartFromServer: (state, action) => {
      state.items = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },

    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce(
        (total, item) => total + (item.product.price * item.quantity),
        0
      );
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartLoading,
  setCartError,
  syncCartFromServer,
  calculateTotals,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotalItems = (state) => state.cart.totalItems;
export const selectCartTotalPrice = (state) => state.cart.totalPrice;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;