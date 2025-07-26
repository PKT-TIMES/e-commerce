import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  language: 'en',
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
  notifications: [],
  loading: {
    global: false,
    page: false,
    component: {},
  },
  modals: {
    authModal: false,
    productModal: false,
    cartModal: false,
    addressModal: false,
    paymentModal: false,
  },
  alerts: [],
  breadcrumbs: [],
  pageTitle: 'MintraTrade',
  metaDescription: '',
  currency: 'USD',
  country: 'US',
  timezone: 'UTC',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },

    // Language management
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },

    // Sidebar management
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    // Mobile menu management
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },

    // Search management
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },

    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },

    // Loading states
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },

    setPageLoading: (state, action) => {
      state.loading.page = action.payload;
    },

    setComponentLoading: (state, action) => {
      const { component, loading } = action.payload;
      state.loading.component[component] = loading;
    },

    clearComponentLoading: (state, action) => {
      const component = action.payload;
      delete state.loading.component[component];
    },

    // Modal management
    openModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = true;
    },

    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = false;
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },

    // Notification management
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(notification);
    },

    removeNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(
        notification => notification.id !== notificationId
      );
    },

    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    },

    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Alert management
    addAlert: (state, action) => {
      const alert = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        autoHide: true,
        duration: 5000,
        ...action.payload,
      };
      state.alerts.push(alert);
    },

    removeAlert: (state, action) => {
      const alertId = action.payload;
      state.alerts = state.alerts.filter(alert => alert.id !== alertId);
    },

    clearAlerts: (state) => {
      state.alerts = [];
    },

    // Breadcrumb management
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },

    addBreadcrumb: (state, action) => {
      state.breadcrumbs.push(action.payload);
    },

    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // Page metadata
    setPageTitle: (state, action) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} | MintraTrade`;
    },

    setMetaDescription: (state, action) => {
      state.metaDescription = action.payload;
      
      // Update meta description in document head
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', action.payload);
      }
    },

    // Localization
    setCurrency: (state, action) => {
      state.currency = action.payload;
      localStorage.setItem('currency', action.payload);
    },

    setCountry: (state, action) => {
      state.country = action.payload;
      localStorage.setItem('country', action.payload);
    },

    setTimezone: (state, action) => {
      state.timezone = action.payload;
      localStorage.setItem('timezone', action.payload);
    },

    // Reset UI state
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        country: state.country,
        timezone: state.timezone,
      };
    },

    // Initialize UI from localStorage
    initializeUI: (state) => {
      const theme = localStorage.getItem('theme');
      const language = localStorage.getItem('language');
      const currency = localStorage.getItem('currency');
      const country = localStorage.getItem('country');
      const timezone = localStorage.getItem('timezone');

      if (theme) state.theme = theme;
      if (language) state.language = language;
      if (currency) state.currency = currency;
      if (country) state.country = country;
      if (timezone) state.timezone = timezone;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setLanguage,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSearch,
  setSearchOpen,
  setGlobalLoading,
  setPageLoading,
  setComponentLoading,
  clearComponentLoading,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  addAlert,
  removeAlert,
  clearAlerts,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  setPageTitle,
  setMetaDescription,
  setCurrency,
  setCountry,
  setTimezone,
  resetUI,
  initializeUI,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectLanguage = (state) => state.ui.language;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectSearchOpen = (state) => state.ui.searchOpen;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectPageLoading = (state) => state.ui.loading.page;
export const selectComponentLoading = (state, component) => state.ui.loading.component[component] || false;
export const selectModals = (state) => state.ui.modals;
export const selectModal = (state, modalName) => state.ui.modals[modalName] || false;
export const selectNotifications = (state) => state.ui.notifications;
export const selectAlerts = (state) => state.ui.alerts;
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;
export const selectPageTitle = (state) => state.ui.pageTitle;
export const selectMetaDescription = (state) => state.ui.metaDescription;
export const selectCurrency = (state) => state.ui.currency;
export const selectCountry = (state) => state.ui.country;
export const selectTimezone = (state) => state.ui.timezone;

// Derived selectors
export const selectUnreadNotificationsCount = (state) => {
  return state.ui.notifications.filter(notification => !notification.read).length;
};

export const selectRecentNotifications = (state, count = 5) => {
  return state.ui.notifications.slice(0, count);
};

export const selectIsAnyModalOpen = (state) => {
  return Object.values(state.ui.modals).some(isOpen => isOpen);
};

export const selectActiveAlerts = (state) => {
  return state.ui.alerts.filter(alert => alert.autoHide !== false);
};

export default uiSlice.reducer;