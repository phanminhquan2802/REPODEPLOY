import { useState, useEffect } from 'react';
import { ordersAPI } from '../utils/api';
import { FaBox, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(id, newStatus);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800';
      case 'Đã xác nhận':
        return 'bg-blue-100 text-blue-800';
      case 'Đang giao':
        return 'bg-purple-100 text-purple-800';
      case 'Đã giao':
        return 'bg-green-100 text-green-800';
      case 'Đã hủy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center">Đang tải...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Danh sách đơn hàng</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FaBox className="text-blue-600" />
                  <h3 className="font-bold text-lg">Đơn hàng #{order._id.slice(-6)}</h3>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Khách hàng: {order.userId?.username || 'N/A'}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            {/* Order Items */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Sản phẩm:</h4>
              {order.items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm mb-1">
                  <span>
                    {item.productId?.name} x {item.quantity}
                  </span>
                  <span className="font-medium">
                    {(item.price * item.quantity).toLocaleString()} ₫
                  </span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Tổng:</span>
                <span className="text-blue-600">{order.totalPrice.toLocaleString()} ₫</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Thông tin liên hệ:</p>
                <p className="text-gray-600">{order.customerName}</p>
                <p className="text-gray-600 flex items-center mt-1">
                  <FaPhone className="mr-2 text-blue-600" />
                  {order.customerPhone}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Địa chỉ giao hàng:</p>
                <p className="text-gray-600 flex items-start">
                  <FaMapMarkerAlt className="mr-2 text-blue-600 mt-1 flex-shrink-0" />
                  <span>{order.shippingAddress}</span>
                </p>
              </div>
            </div>

            {order.notes && (
              <div className="mb-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <p className="text-sm font-semibold text-gray-700">Ghi chú:</p>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Cập nhật trạng thái:</label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">Chưa có đơn hàng nào</p>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;