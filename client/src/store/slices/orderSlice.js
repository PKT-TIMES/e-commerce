import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  orderHistory: [],
  loading: false,
  error: null,
  trackingInfo: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    setOrders: (state, action) => {
      state.orders = action.payload;
      state.loading = false;
    },

    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
      state.loading = false;
    },

    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.loading = false;
    },

    updateOrder: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex(order => order.id === updatedOrder.id);
      
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
      
      if (state.currentOrder?.id === updatedOrder.id) {
        state.currentOrder = updatedOrder;
      }
    },

    updateOrderStatus: (state, action) => {
      const { orderId, status, timestamp } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      
      if (order) {
        order.status = status;
        order.updatedAt = timestamp || new Date().toISOString();
        
        // Update status history
        if (!order.statusHistory) {
          order.statusHistory = [];
        }
        order.statusHistory.push({
          status,
          timestamp: timestamp || new Date().toISOString(),
        });
      }
      
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status;
        state.currentOrder.updatedAt = timestamp || new Date().toISOString();
      }
    },

    setOrderHistory: (state, action) => {
      state.orderHistory = action.payload;
    },

    setTrackingInfo: (state, action) => {
      state.trackingInfo = action.payload;
    },

    clearTrackingInfo: (state) => {
      state.trackingInfo = null;
    },

    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    // Handle real-time order updates
    receiveOrderUpdate: (state, action) => {
      const orderUpdate = action.payload;
      const order = state.orders.find(order => order.id === orderUpdate.orderId);
      
      if (order) {
        Object.assign(order, orderUpdate.data);
      }
      
      if (state.currentOrder?.id === orderUpdate.orderId) {
        Object.assign(state.currentOrder, orderUpdate.data);
      }
    },

    // Handle payment updates
    updatePaymentStatus: (state, action) => {
      const { orderId, paymentStatus, transactionId } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      
      if (order) {
        order.payment = {
          ...order.payment,
          status: paymentStatus,
          transactionId,
          updatedAt: new Date().toISOString(),
        };
      }
      
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.payment = {
          ...state.currentOrder.payment,
          status: paymentStatus,
          transactionId,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    // Handle order cancellation
    cancelOrder: (state, action) => {
      const { orderId, reason } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      
      if (order) {
        order.status = 'cancelled';
        order.cancellation = {
          reason,
          cancelledAt: new Date().toISOString(),
        };
      }
      
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = 'cancelled';
        state.currentOrder.cancellation = {
          reason,
          cancelledAt: new Date().toISOString(),
        };
      }
    },

    // Handle return requests
    requestReturn: (state, action) => {
      const { orderId, items, reason } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      
      if (order) {
        if (!order.returns) {
          order.returns = [];
        }
        order.returns.push({
          id: `return_${Date.now()}`,
          items,
          reason,
          status: 'requested',
          requestedAt: new Date().toISOString(),
        });
      }
      
      if (state.currentOrder?.id === orderId) {
        if (!state.currentOrder.returns) {
          state.currentOrder.returns = [];
        }
        state.currentOrder.returns.push({
          id: `return_${Date.now()}`,
          items,
          reason,
          status: 'requested',
          requestedAt: new Date().toISOString(),
        });
      }
    },

    // Clear current order
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },

    // Reset orders state
    resetOrders: (state) => {
      return {
        ...initialState,
      };
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setOrders,
  addOrder,
  setCurrentOrder,
  updateOrder,
  updateOrderStatus,
  setOrderHistory,
  setTrackingInfo,
  clearTrackingInfo,
  setPagination,
  setPage,
  receiveOrderUpdate,
  updatePaymentStatus,
  cancelOrder,
  requestReturn,
  clearCurrentOrder,
  resetOrders,
} = orderSlice.actions;

// Selectors
export const selectOrders = (state) => state.orders.orders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrderHistory = (state) => state.orders.orderHistory;
export const selectOrderLoading = (state) => state.orders.loading;
export const selectOrderError = (state) => state.orders.error;
export const selectTrackingInfo = (state) => state.orders.trackingInfo;
export const selectOrderPagination = (state) => state.orders.pagination;

// Derived selectors
export const selectOrderById = (state, orderId) => {
  return state.orders.orders.find(order => order.id === orderId);
};

export const selectOrdersByStatus = (state, status) => {
  return state.orders.orders.filter(order => order.status === status);
};

export const selectPendingOrders = (state) => {
  return state.orders.orders.filter(order => 
    ['pending', 'confirmed', 'processing'].includes(order.status)
  );
};

export const selectCompletedOrders = (state) => {
  return state.orders.orders.filter(order => order.status === 'delivered');
};

export const selectCancelledOrders = (state) => {
  return state.orders.orders.filter(order => order.status === 'cancelled');
};

export const selectRecentOrders = (state, count = 5) => {
  return state.orders.orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count);
};

export const selectOrdersWithReturns = (state) => {
  return state.orders.orders.filter(order => 
    order.returns && order.returns.length > 0
  );
};

export default orderSlice.reducer;