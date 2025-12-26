import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI, cartAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaShoppingCart } from 'react-icons/fa';

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('category') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [filter, keyword]);

  // Tự động refresh khi quay lại trang (khi window focus)
  useEffect(() => {
    const handleFocus = () => {
      fetchProducts();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts(filter || null, keyword || null);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    const params = {};

    if (value) params.category = value;
    if (keyword) params.keyword = keyword;

    setSearchParams(params);
  };

  // ✅ HÀM THÊM VÀO GIỎ HÀNG
  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      await cartAPI.addToCart(productId, 1);
      alert('✅ Đã thêm vào giỏ hàng!');
      // Refresh danh sách sản phẩm để cập nhật số lượng tồn kho
      await fetchProducts();
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      alert('❌ Thêm vào giỏ hàng thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="text-sm text-gray-600">
            <Link to="/" className="hover:text-red-600">Trang chủ</Link> / <span>Sản phẩm</span>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="text-center py-8 bg-white mb-5">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-4xl font-bold text-gray-800">Sản Phẩm Chính Hãng</h1>
          <button
            onClick={fetchProducts}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Làm mới danh sách"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600">Tìm thấy {products.length} sản phẩm</p>
      </div>

      <div className="container mx-auto px-4 py-5">
        {/* Filter & Sort Bar */}
        <div className="bg-white p-5 rounded-lg mb-5 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Danh mục:</label>
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border-2 border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="Quần áo">Quần áo</option>
                <option value="Phụ kiện">Phụ kiện</option>
                <option value="Đồ điện tử">Đồ điện tử</option>
                <option value="Giày dép">Giày dép</option>
                <option value="Túi xách">Túi xách</option>
                <option value="Đồng hồ">Đồng hồ</option>
                <option value="Mỹ phẩm">Mỹ phẩm</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-2 border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="name_asc">Tên A-Z</option>
              </select>
            </div>

            <button
              onClick={() => handleFilterChange('')}
              className="ml-auto px-5 py-2 bg-white border-2 border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ↻ Đặt lại
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg">
            <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-xl">Không có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => {
              const isOutOfStock = !product.countInStock || product.countInStock === 0;
              
              return (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2 relative group cursor-pointer"
                >
                  {/* Badge */}
                  {isOutOfStock ? (
                    <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      Hết hàng
                    </span>
                  ) : product.inStock && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      Mới
                    </span>
                  )}

                  {/* Image */}
                  <div className="relative pt-[100%] overflow-hidden bg-gray-50">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <FaBook className="text-white text-6xl opacity-50" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold">
                          HẾT HÀNG
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-red-600 line-clamp-2 min-h-[40px]">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="text-lg font-bold text-red-600 mb-2">
                      {product.price.toLocaleString()}₫
                    </div>
                    
                    <div className={`text-xs mb-3 font-semibold ${isOutOfStock ? 'text-red-600' : product.countInStock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                      {isOutOfStock ? '❌ Hết hàng' : `Còn: ${product.countInStock || 0} sản phẩm`}
                      {!isOutOfStock && product.countInStock < 10 && ' ⚠️'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isOutOfStock) {
                            handleAddToCart(product._id, e);
                          }
                        }}
                        disabled={addingToCart[product._id] || isOutOfStock}
                        className={`flex-1 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1 text-xs ${
                          isOutOfStock 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isOutOfStock ? (
                          <span>Hết hàng</span>
                        ) : addingToCart[product._id] ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Thêm...</span>
                          </>
                        ) : (
                          <>
                            <FaShoppingCart size={12} />
                            <span>Giỏ hàng</span>
                          </>
                        )}
                      </button>
                      <button className="px-3 bg-gray-100 text-gray-700 rounded-md font-medium text-xs hover:bg-gray-200 transition-colors">
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;