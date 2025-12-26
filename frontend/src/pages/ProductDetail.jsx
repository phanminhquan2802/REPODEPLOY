import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI, cartAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaShoppingCart, FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaGlobe } from 'react-icons/fa';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getProductById(id);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setSuccess('');
    setAddingToCart(true);

    try {
      await cartAPI.addToCart(id, quantity);
      setSuccess('Đã thêm vào giỏ hàng!');
      setTimeout(() => setSuccess(''), 3000);
      // Refresh thông tin sản phẩm để cập nhật số lượng tồn kho
      await fetchProduct();
    } catch (error) {
      setError(error.response?.data?.message || 'Thêm vào giỏ hàng thất bại');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await cartAPI.addToCart(id, quantity);
      navigate('/cart');
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <FaExclamationCircle className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-xl">Không tìm thấy sản phẩm</p>
          <Link to="/products" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors">
          <FaArrowLeft />
          <span>Quay lại danh sách sản phẩm</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow p-8">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-[500px] object-contain" />
            ) : (
              <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-lg">
                <FaBook className="text-gray-300 text-8xl" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <span className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  {product.category || product.brand}
                </span>
                <h1 className="text-3xl font-bold mb-2 text-gray-800">{product.name}</h1>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-3 ${
                  product.countInStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.countInStock > 0 ? '✓ Còn hàng' : '✗ Hết hàng'}
                </div>
              </div>

              {/* Price */}
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Giá bán</p>
                <p className="text-4xl font-bold text-red-600">{product.price.toLocaleString()} ₫</p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Giới thiệu sản phẩm</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'Sách hay chính hãng, đầy đủ nội dung'}
                </p>
              </div>

              {/* Messages */}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle />
                    <p className="font-medium">{success}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                  <div className="flex items-center space-x-2">
                    <FaExclamationCircle />
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số lượng</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.countInStock, parseInt(e.target.value) || 1)))}
                    min="1"
                    max={product.countInStock}
                    className="w-32 border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.countInStock === 0 || !user || addingToCart}
                    className="flex-1 bg-white border-2 border-red-600 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? (
                      <span className="flex items-center justify-center">
                        <div className="spinner mr-2" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                        Đang thêm...
                      </span>
                    ) : (
                      <>
                        <FaShoppingCart className="inline mr-2" />
                        Thêm vào giỏ
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.countInStock === 0 || !user}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {user ? 'Mua ngay' : 'Đăng nhập để mua'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button className="px-6 py-4 font-semibold border-b-2 border-red-600 text-red-600">
                Thông tin chi tiết
              </button>
            </div>
          </div>
          <div className="p-6">
            <table className="w-full">
              <tbody className="divide-y">
                {product.language && (
                  <tr>
                    <td className="py-3 text-gray-600 font-medium flex items-center gap-2">
                      <FaGlobe className="text-purple-600" /> Ngôn ngữ
                    </td>
                    <td className="py-3 text-gray-800">{product.language}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Danh mục</td>
                  <td className="py-3 text-gray-800">{product.category || product.brand}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium">Tình trạng</td>
                  <td className="py-3 text-gray-800">Mới 100%, nguyên seal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;