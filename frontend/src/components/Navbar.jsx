import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../utils/api';
import { FaSearch, FaShoppingCart, FaUser, FaSignOutAlt, FaShoppingBag, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, cartCount } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  console.log('🔍 Navbar - User:', user);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Live search suggestions
  useEffect(() => {
    const trimmed = searchKeyword.trim();

    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await productsAPI.getProducts(null, trimmed);
        // Lấy tối đa 5 sản phẩm gợi ý
        setSearchResults((res.data || []).slice(0, 5));
      } catch (error) {
        console.error('❌ Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchKeyword]);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    const trimmed = searchKeyword.trim();

    if (!trimmed) {
      navigate('/products');
      return;
    }

    navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="sticky top-0 z-[100] shadow-md">
      {/* Header Top - với ảnh background */}
      <div 
        className="bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/header-bg.png)' }}
      >
      </div>

      {/* Header Main - White */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-xl sm:text-2xl font-bold hover:scale-105 transition-transform">
              <span className="text-gray-800">SMART</span>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Trang chủ
              </Link>
              <Link
                to="/products"
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Sản phẩm
              </Link>
            </div>

            {/* Search Box */}
            <form
              className="hidden md:flex flex-1 max-w-md mx-6"
              onSubmit={handleSearch}
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                />
                <FaSearch
                  className="absolute left-3 top-3 text-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-red-600 font-semibold hover:text-red-700"
                >
                  Tìm
                </button>

                {/* Search suggestions dropdown */}
                {searchKeyword.trim() && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[120] max-h-80 overflow-y-auto">
                    {isSearching && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Đang tìm kiếm...
                      </div>
                    )}

                    {!isSearching && searchResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Không tìm thấy sản phẩm phù hợp
                      </div>
                    )}

                    {!isSearching &&
                      searchResults.map((product) => (
                        <button
                          type="button"
                          key={product._id}
                          onClick={() => {
                            navigate(`/products/${product._id}`);
                            setSearchResults([]);
                            setSearchKeyword('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                        >
                          <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {product.name}
                            </p>
                            {typeof product.price === 'number' && (
                              <p className="text-xs text-red-600 font-semibold mt-0.5">
                                {product.price.toLocaleString()}₫
                              </p>
                            )}
                          </div>
                        </button>
                      ))}

                    {!isSearching && searchResults.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSearch()}
                        className="w-full px-4 py-2 text-sm text-red-600 font-semibold border-t border-gray-200 hover:bg-gray-50"
                      >
                        Xem tất cả kết quả
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Right side icons */}
            <div className="flex items-center space-x-4 md:space-x-6">

              {/* Cart Icon with Badge */}
              {user && (
                <Link to="/cart" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <FaShoppingCart className="text-xl" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Profile Icon with Dropdown */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center bg-white">
                      <FaUser className="text-purple-500" />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* Thông tin tài khoản */}
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <FaUser className="text-gray-600" />
                        <span className="text-gray-700">Thông tin tài khoản</span>
                      </Link>

                      {/* Đơn hàng của tôi */}
                      <Link
                        to="/my-orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <FaShoppingBag className="text-gray-600" />
                        <span className="text-gray-700">Đơn hàng của tôi</span>
                      </Link>

                      {/* Quản trị - chỉ hiển thị cho admin */}
                      {user.isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          <FaCog className="text-gray-600" />
                          <span className="text-gray-700">Quản trị</span>
                        </Link>
                      )}

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Đăng xuất */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 transition-colors text-red-600"
                      >
                        <FaSignOutAlt />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white">
                    <FaUser className="text-gray-500" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
