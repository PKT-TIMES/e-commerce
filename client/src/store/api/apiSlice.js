import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage or state
    const token = localStorage.getItem('token') || getState().auth.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Base query with re-auth logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get a 401, try to refresh token or logout
  if (result.error && result.error.status === 401) {
    // Dispatch logout action
    api.dispatch({ type: 'auth/logout' });
    
    // Clear token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  return result;
};

// Create the API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Product', 
    'Order', 
    'Cart', 
    'Wishlist',
    'Review',
    'Category',
    'Seller',
    'Analytics'
  ],
  endpoints: (builder) => ({
    // Health check endpoint
    healthCheck: builder.query({
      query: () => '/health',
    }),
  }),
});

// Export hooks
export const { useHealthCheckQuery } = apiSlice;