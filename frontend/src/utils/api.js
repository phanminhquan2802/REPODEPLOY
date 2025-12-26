import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://deploy-tfjo.onrender.com/api';

console.log('🔗 API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthRequest = url.includes('/login') || url.includes('/register');
      
      if (!isAuthRequest) {
        console.warn('⚠️ 401 Unauthorized - Token hết hạn');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/customers/login', credentials),
  register: (userData) => api.post('/customers', userData),
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (userData) => api.put('/customers/profile', userData),
  forgotPassword: (email) => api.post('/customers/forgot-password', { email }),
  resetPassword: (email, resetCode, newPassword) => 
    api.post('/customers/reset-password', { email, resetCode, newPassword }),
};

// Products API
export const productsAPI = {
  getProducts: (category, keyword) =>
    api.get('/products', {
      params: {
        category: category || undefined,
        keyword: keyword || undefined,
      },
    }),
  getProductById: (id) => api.get(`/products/${id}`),
  getAllProducts: () => api.get('/products/admin/all'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateStock: (id, countInStock) => api.put(`/products/${id}/stock`, { countInStock }),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/myorders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getAllOrders: () => api.get('/orders'),
  updateOrderToDelivered: (id) => api.put(`/orders/${id}/deliver`),
  cancelOrder: (id) => api.delete(`/orders/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/customers/cart'),
  addToCart: (productId, quantity) => api.post('/customers/cart', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put('/customers/cart', { productId, quantity }),
  removeFromCart: (productId) => api.delete(`/customers/cart/${productId}`),
};

// Vouchers API
export const vouchersAPI = {
  getActiveVouchers: () => api.get('/vouchers'),
  applyVoucher: (code, orderTotal) => api.post('/vouchers/apply', { code, orderTotal }),
  getAllVouchersAdmin: () => api.get('/vouchers/admin/all'),
  createVoucher: (voucherData) => api.post('/vouchers/create', voucherData),
  updateVoucher: (id, voucherData) => api.put(`/vouchers/${id}`, voucherData),
  deleteVoucher: (id) => api.delete(`/vouchers/${id}`),
  useVoucher: (id) => api.put(`/vouchers/${id}/use`)
};

export default api;