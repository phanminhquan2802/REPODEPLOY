import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, productsAPI } from '../utils/api';
import AdminProducts from '../components/AdminProducts';
import { FaCog, FaBook, FaBoxOpen, FaLock } from 'react-icons/fa';

const Admin = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchProductsCount();
    }
  }, [user]);

  const fetchProductsCount = async () => {
    try {
      const response = await productsAPI.getAllProducts();
      // API trả về { success, count, products } hoặc array trực tiếp
      if (response.data.count !== undefined) {
        setProductsCount(response.data.count);
      } else if (response.data.products) {
        setProductsCount(response.data.products.length);
      } else if (Array.isArray(response.data)) {
        setProductsCount(response.data.length);
      } else {
        setProductsCount(0);
      }
    } catch (error) {
      console.error('Error fetching products count:', error);
    }
  };


  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderToDelivered(orderId);
      alert('✅ Cập nhật trạng thái thành công!');
      fetchOrders();
    } catch (error) {
      alert('❌ Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Đang xử lý': 'bg-yellow-100 text-yellow-800',
      'Đã xác nhận': 'bg-blue-100 text-blue-800',
      'Đang giao': 'bg-purple-100 text-purple-800',
      'Đã giao': 'bg-green-100 text-green-800',
      'Đã hủy': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center py-20 bg-white rounded-lg shadow">
            <FaLock className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-gray-600 mb-6">Bạn cần đăng nhập để truy cập trang này</p>
            <Link to="/login" className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center py-20 bg-white rounded-lg shadow">
            <FaLock className="text-6xl text-red-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600 mb-6">Chỉ quản trị viên mới có thể truy cập trang này</p>
            <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <FaCog className="text-blue-600" />
            Quản trị hệ thống
          </h1>
          <p className="text-gray-600">
            Xin chào, <span className="font-semibold">{user.name || user.email}</span>
            {user.isAdmin && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">ADMIN</span>}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tổng sản phẩm</p>
                <p className="text-3xl font-bold text-gray-800">{productsCount}</p>
              </div>
              <FaBook className="text-5xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <FaBoxOpen className="text-5xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Doanh thu</p>
                <p className="text-3xl font-bold text-gray-800">
                  {orders
                    .filter(order => order.orderStatus !== 'Đã hủy')
                    .reduce((sum, order) => sum + (order.totalPrice || 0), 0)
                    .toLocaleString()}đ
                </p>
              </div>
              <div className="text-5xl opacity-50">💰</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaBook className="inline mr-2" />
                Quản lý sản phẩm
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaBoxOpen className="inline mr-2" />
                Quản lý đơn hàng
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'products' && <AdminProducts onProductsChange={fetchProductsCount} />}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Danh sách đơn hàng</h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">Đơn hàng #{order._id.slice(-8)}</h3>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus || 'Đang xử lý')}`}>
                          {order.orderStatus || 'Đang xử lý'}
                        </span>
                      </div>

                      <div className="border-t pt-4 mb-4">
                        <h4 className="font-semibold mb-2">Sản phẩm:</h4>
                        {order.orderItems.map((item) => (
                          <div key={item._id} className="flex justify-between text-sm mb-1">
                            <span>{item.name} x {item.quantity}</span>
                            <span className="font-medium">{(item.price * item.quantity).toLocaleString()}₫</span>
                          </div>
                        ))}
                        <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                          <span>Tổng:</span>
                          <span className="text-red-600">{order.totalPrice.toLocaleString()}₫</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 mb-4">
                        <h4 className="font-semibold mb-2">Thông tin giao hàng:</h4>
                        <p className="text-sm text-gray-700">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                        <p className="text-sm text-gray-700">SĐT: {order.shippingAddress.phone}</p>
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={order.orderStatus || 'Đang xử lý'}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="Đang xử lý">Đang xử lý</option>
                          <option value="Đã xác nhận">Đã xác nhận</option>
                          <option value="Đang giao">Đang giao</option>
                          <option value="Đã giao">Đã giao</option>
                          <option value="Đã hủy">Đã hủy</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Admin;