import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { I18nextProvider } from 'react-i18next';

// Store and i18n
import store from './store/store';
import i18n from './i18n/config';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ChatBot from './components/ChatBot/ChatBot';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages (Lazy loaded for better performance)
const Home = React.lazy(() => import('./pages/Home/Home'));
const Products = React.lazy(() => import('./pages/Products/Products'));
const ProductDetail = React.lazy(() => import('./pages/Products/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout/Checkout'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Orders = React.lazy(() => import('./pages/Orders/Orders'));
const Wishlist = React.lazy(() => import('./pages/Wishlist/Wishlist'));
const SellerDashboard = React.lazy(() => import('./pages/Seller/SellerDashboard'));
const SellerProducts = React.lazy(() => import('./pages/Seller/SellerProducts'));
const SellerOrders = React.lazy(() => import('./pages/Seller/SellerOrders'));
const SellerAnalytics = React.lazy(() => import('./pages/Seller/SellerAnalytics'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const About = React.lazy(() => import('./pages/About/About'));
const Contact = React.lazy(() => import('./pages/Contact/Contact'));
const NotFound = React.lazy(() => import('./pages/Error/NotFound'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create Material-UI theme
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#90caf9' : '#1976d2',
      light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
      dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
    },
    secondary: {
      main: mode === 'dark' ? '#f48fb1' : '#dc004e',
      light: mode === 'dark' ? '#fce4ec' : '#ff6666',
      dark: mode === 'dark' ? '#c2185b' : '#9a0036',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#333333',
      secondary: mode === 'dark' ? '#b0b0b0' : '#666666',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'dark' 
            ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Loading component for Suspense
const SuspenseLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="50vh"
  >
    <LoadingSpinner size={60} />
  </Box>
);

function App() {
  const [themeMode, setThemeMode] = React.useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  const theme = React.useMemo(() => createAppTheme(themeMode), [themeMode]);

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Initialize app on mount
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Dispatch action to validate token and set user
      store.dispatch({ type: 'auth/validateToken', payload: token });
    }

    // Set theme mode in store
    store.dispatch({ 
      type: 'ui/setTheme', 
      payload: themeMode 
    });
  }, [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
              <div className="App">
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  reverseOrder={false}
                  gutter={8}
                  containerClassName=""
                  containerStyle={{}}
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      borderRadius: '8px',
                      boxShadow: theme.shadows[3],
                    },
                    success: {
                      iconTheme: {
                        primary: theme.palette.success.main,
                        secondary: theme.palette.success.contrastText,
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: theme.palette.error.main,
                        secondary: theme.palette.error.contrastText,
                      },
                    },
                  }}
                />

                {/* Navigation */}
                <Navbar toggleTheme={toggleTheme} themeMode={themeMode} />

                {/* Main Content */}
                <Box
                  component="main"
                  sx={{
                    minHeight: 'calc(100vh - 64px)', // Adjust for navbar height
                    paddingTop: '64px', // Account for fixed navbar
                  }}
                >
                  <Suspense fallback={<SuspenseLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:slug" element={<ProductDetail />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />

                      {/* Protected Routes */}
                      <Route
                        path="/cart"
                        element={
                          <ProtectedRoute>
                            <Cart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/wishlist"
                        element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        }
                      />

                      {/* Seller Routes */}
                      <Route
                        path="/seller"
                        element={
                          <ProtectedRoute roles={['seller']}>
                            <SellerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/seller/products"
                        element={
                          <ProtectedRoute roles={['seller']}>
                            <SellerProducts />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/seller/orders"
                        element={
                          <ProtectedRoute roles={['seller']}>
                            <SellerOrders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/seller/analytics"
                        element={
                          <ProtectedRoute roles={['seller']}>
                            <SellerAnalytics />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Box>

                {/* Footer */}
                <Footer />

                {/* AI ChatBot */}
                <ChatBot />
              </div>
            </Router>
          </ThemeProvider>
        </I18nextProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;