import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, cartAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Load user từ localStorage khi app khởi động
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('✅ Loaded user from localStorage:', userData);
        }
      } catch (error) {
        console.error('❌ Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Đồng bộ số lượng sản phẩm trong giỏ theo user hiện tại
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user) {
        setCartCount(0);
        return;
      }

      try {
        const response = await cartAPI.getCart();
        const count = (response.data || []).reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        setCartCount(count);
      } catch (error) {
        console.error('❌ Error fetching cart count:', error);
        setCartCount(0);
      }
    };

    fetchCartCount();
  }, [user]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Đang đăng nhập với:', { email });
      const response = await authAPI.login({ email, password });
      console.log('✅ Response đăng nhập:', response.data);
      
      const { token, ...userData } = response.data;
      
      // Lưu vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Cập nhật state
      setUser(userData);
      
      console.log('✅ Login success, user:', userData);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Đăng nhập thất bại',
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Đang đăng ký với:', userData);
      const response = await authAPI.register(userData);
      console.log('✅ Response đăng ký:', response.data);
      
      const { token, ...userInfo } = response.data;
      
      // Lưu vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // Cập nhật state
      setUser(userInfo);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi đăng ký:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Đăng ký thất bại',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartCount(0);
    console.log('👋 User logged out');
  };

  // ✅ Tính isAdmin từ user state
  const isAdmin = user?.isAdmin === true;

  // Cho phép các component khác (ví dụ: Cart) đồng bộ lại cartCount
  const updateCartCountFromItems = (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const count = safeItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    setCartCount(count);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin,
    cartCount,
    updateCartCountFromItems
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};