import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  featured: [],
  categories: [],
  currentProduct: null,
  filters: {
    category: '',
    priceRange: [0, 10000],
    rating: 0,
    brand: '',
    sortBy: 'featured',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
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

    setProducts: (state, action) => {
      state.products = action.payload;
      state.loading = false;
    },

    addProducts: (state, action) => {
      state.products.push(...action.payload);
      state.loading = false;
    },

    setFeaturedProducts: (state, action) => {
      state.featured = action.payload;
    },

    setCategories: (state, action) => {
      state.categories = action.payload;
    },

    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
      state.loading = false;
    },

    updateProduct: (state, action) => {
      const updatedProduct = action.payload;
      const index = state.products.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        state.products[index] = updatedProduct;
      }
      if (state.currentProduct?.id === updatedProduct.id) {
        state.currentProduct = updatedProduct;
      }
    },

    removeProduct: (state, action) => {
      const productId = action.payload;
      state.products = state.products.filter(p => p.id !== productId);
      if (state.currentProduct?.id === productId) {
        state.currentProduct = null;
      }
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },

    clearFilters: (state) => {
      state.filters = {
        category: '',
        priceRange: [0, 10000],
        rating: 0,
        brand: '',
        sortBy: 'featured',
        search: '',
      };
      state.pagination.page = 1;
    },

    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    incrementViews: (state, action) => {
      const productId = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.views = (product.views || 0) + 1;
      }
      if (state.currentProduct?.id === productId) {
        state.currentProduct.views = (state.currentProduct.views || 0) + 1;
      }
    },

    toggleWishlist: (state, action) => {
      const productId = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.isWishlisted = !product.isWishlisted;
      }
      if (state.currentProduct?.id === productId) {
        state.currentProduct.isWishlisted = !state.currentProduct.isWishlisted;
      }
    },

    updateProductRating: (state, action) => {
      const { productId, rating, reviewCount } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.averageRating = rating;
        product.totalReviews = reviewCount;
      }
      if (state.currentProduct?.id === productId) {
        state.currentProduct.averageRating = rating;
        state.currentProduct.totalReviews = reviewCount;
      }
    },

    searchProducts: (state, action) => {
      state.filters.search = action.payload;
      state.pagination.page = 1;
      state.loading = true;
    },

    // Handle product recommendations
    setRecommendations: (state, action) => {
      const { productId, recommendations } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.recommendations = recommendations;
      }
      if (state.currentProduct?.id === productId) {
        state.currentProduct.recommendations = recommendations;
      }
    },

    // Handle stock updates
    updateStock: (state, action) => {
      const { productId, stock } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.stock = stock;
      }
      if (state.currentProduct?.id === productId) {
        state.currentProduct.stock = stock;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setProducts,
  addProducts,
  setFeaturedProducts,
  setCategories,
  setCurrentProduct,
  updateProduct,
  removeProduct,
  setFilters,
  clearFilters,
  setPagination,
  setPage,
  incrementViews,
  toggleWishlist,
  updateProductRating,
  searchProducts,
  setRecommendations,
  updateStock,
} = productSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.products;
export const selectFeaturedProducts = (state) => state.products.featured;
export const selectCategories = (state) => state.products.categories;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectProductFilters = (state) => state.products.filters;
export const selectProductPagination = (state) => state.products.pagination;
export const selectProductLoading = (state) => state.products.loading;
export const selectProductError = (state) => state.products.error;

// Derived selectors
export const selectFilteredProducts = (state) => {
  const { products, filters } = state.products;
  
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    
    // Price range filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }
    
    // Rating filter
    if (filters.rating && product.averageRating < filters.rating) {
      return false;
    }
    
    // Brand filter
    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(searchTerm);
      const matchesDescription = product.description.toLowerCase().includes(searchTerm);
      const matchesTags = product.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    return true;
  });
};

export const selectSortedProducts = (state) => {
  const filteredProducts = selectFilteredProducts(state);
  const { sortBy } = state.products.filters;
  
  const sorted = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'popular':
        return (b.totalSales || 0) - (a.totalSales || 0);
      case 'featured':
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });
  
  return sorted;
};

export const selectProductById = (state, productId) => {
  return state.products.products.find(product => product.id === productId);
};

export default productSlice.reducer;