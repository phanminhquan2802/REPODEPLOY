import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartAPI, ordersAPI } from '../utils/api';
import { FaMapMarkerAlt, FaCreditCard, FaCheckCircle, FaGift, FaRocket, FaShieldAlt, FaBox, FaBook, FaLaptop, FaTshirt } from 'react-icons/fa';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');

  // ========================================
  // ✅ DECORATOR PATTERN - State cho các tính năng bổ sung
  // ========================================
  const [decorators, setDecorators] = useState({
    giftWrap: false,
    expressShipping: false,
    insurance: false,
    priorityPackaging: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      if (response.data.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // 🏭 ABSTRACT FACTORY - Tính shipping fee theo loại sản phẩm
  // ========================================
  const getProductType = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('văn học') || cat.includes('sách') || cat.includes('book')) {
      return { type: 'Book', icon: FaBook, color: 'blue', shippingFee: 15000 };
    } else if (cat.includes('điện tử') || cat.includes('electronic')) {
      return { type: 'Electronic', icon: FaLaptop, color: 'purple', shippingFee: 30000 };
    } else if (cat.includes('quần áo') || cat.includes('thời trang') || cat.includes('clothing')) {
      return { type: 'Clothing', icon: FaTshirt, color: 'pink', shippingFee: 20000 };
    }
    return { type: 'Other', icon: FaBox, color: 'gray', shippingFee: 15000 };
  };

  const calculateShippingFee = () => {
    return cartItems.reduce((sum, item) => {
      const productType = getProductType(item.product?.category || item.product?.brand);
      return sum + (productType.shippingFee * item.quantity);
    }, 0);
  };

  // Tính toán giá
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // ========================================
  // 🎨 DECORATOR PATTERN - Tính chi phí tính năng bổ sung
  // ========================================
  const calculateDecoratorsCost = () => {
    let cost = 0;
    const subtotal = calculateSubtotal();

    if (decorators.giftWrap) cost += 25000;
    if (decorators.expressShipping) cost += 50000;
    if (decorators.insurance) cost += Math.round(subtotal * 0.02);
    if (decorators.priorityPackaging) cost += 15000;

    return cost;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShippingFee() + calculateDecoratorsCost();
  };

  const toggleDecorator = (decoratorKey) => {
    setDecorators(prev => ({
      ...prev,
      [decoratorKey]: !prev[decoratorKey]
    }));
  };

  // ========================================
  // 💳 STRATEGY PATTERN - Submit Order
  // ========================================
  const handleSubmitOrder = async () => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    setSubmitting(true);
    try {
      // Chuẩn bị decorators data
      const decoratorsArray = [];
      if (decorators.giftWrap) decoratorsArray.push({ type: 'giftWrap', enabled: true });
      if (decorators.expressShipping) decoratorsArray.push({ type: 'expressShipping', enabled: true });
      if (decorators.insurance) decoratorsArray.push({ type: 'insurance', enabled: true });
      if (decorators.priorityPackaging) decoratorsArray.push({ type: 'priorityPackaging', enabled: true });

      const orderData = {
        shippingAddress: {
          address: shippingInfo.address,
          city: shippingInfo.address,
          phone: shippingInfo.phone
        },
        paymentMethod: paymentMethod,
        totalPrice: calculateTotal(),
        decorators: decoratorsArray,
        paymentInfo: {}
      };

      const response = await ordersAPI.createOrder(orderData);
      console.log('✅ Order created:', response.data);
      
      setStep(3);
      
      setTimeout(() => {
        navigate('/my-orders');
      }, 5000);
    } catch (error) {
      console.error('❌ Error creating order:', error);
      alert(error.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // SUCCESS SCREEN
  // ========================================
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <FaCheckCircle className="text-6xl text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-3">🎉 Đặt hàng thành công!</h2>
            <p className="text-gray-600 text-lg">Cảm ơn bạn đã tin tưởng SMART.</p>
          </div>

          {/* Hiển thị tính năng đã chọn */}
          {Object.values(decorators).some(v => v) && (
            <div className="bg-purple-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FaGift className="text-purple-600" />
                🎨 Tính năng bổ sung đã chọn (Decorator Pattern)
              </h3>
              <div className="space-y-2">
                {decorators.giftWrap && (
                  <div className="flex items-center text-sm text-gray-700">
                    <FaGift className="text-purple-500 mr-2" />
                    Gói quà cao cấp (+25,000₫)
                  </div>
                )}
                {decorators.expressShipping && (
                  <div className="flex items-center text-sm text-gray-700">
                    <FaRocket className="text-blue-500 mr-2" />
                    Giao hàng nhanh 1-2 ngày (+50,000₫)
                  </div>
                )}
                {decorators.insurance && (
                  <div className="flex items-center text-sm text-gray-700">
                    <FaShieldAlt className="text-green-500 mr-2" />
                    Bảo hiểm hàng hóa (+{Math.round(calculateSubtotal() * 0.02).toLocaleString()}₫)
                  </div>
                )}
                {decorators.priorityPackaging && (
                  <div className="flex items-center text-sm text-gray-700">
                    <FaBox className="text-orange-500 mr-2" />
                    Đóng gói chống va đập (+15,000₫)
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/my-orders')} 
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
            >
              Xem đơn hàng
            </button>
            <button 
              onClick={() => navigate('/products')} 
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Tiếp tục mua
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN CHECKOUT
  // ========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-600" />
                Thông tin giao hàng
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên *</label>
                  <input 
                    type="text" 
                    value={shippingInfo.name} 
                    onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                  <input 
                    type="tel" 
                    value={shippingInfo.phone} 
                    onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                <input 
                  type="text" 
                  value={shippingInfo.address} 
                  onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
                />
              </div>
            </div>

            {/* 🏭 ABSTRACT FACTORY - Hiển thị shipping fee theo loại sản phẩm */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🏭 Phí vận chuyển theo loại sản phẩm
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Abstract Factory</span>
              </h2>
              
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const productType = getProductType(item.product?.category || item.product?.brand);
                  const ProductIcon = productType.icon;
                  
                  return (
                    <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ProductIcon className={`text-${productType.color}-500 text-xl`} />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {productType.type} • SL: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">
                          {productType.shippingFee.toLocaleString()}₫ × {item.quantity}
                        </p>
                        <p className="text-xs text-gray-500">
                          = {(productType.shippingFee * item.quantity).toLocaleString()}₫
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tổng phí vận chuyển:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {calculateShippingFee().toLocaleString()}₫
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Sách: 15,000₫ | Điện tử: 30,000₫ | Quần áo: 20,000₫
                </p>
              </div>
            </div>

            {/* 🎨 DECORATOR PATTERN - Tính năng bổ sung */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaGift className="text-purple-600" />
                Tính năng bổ sung
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Decorator Pattern</span>
              </h2>

              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={decorators.giftWrap}
                    onChange={() => toggleDecorator('giftWrap')}
                    className="mr-3 mt-1" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FaGift className="text-purple-500" />
                      <p className="font-semibold">Gói quà cao cấp</p>
                      <span className="ml-auto text-purple-600 font-bold">+25,000₫</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Gói quà đẹp mắt, sang trọng</p>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={decorators.expressShipping}
                    onChange={() => toggleDecorator('expressShipping')}
                    className="mr-3 mt-1" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FaRocket className="text-blue-500" />
                      <p className="font-semibold">Giao hàng nhanh</p>
                      <span className="ml-auto text-blue-600 font-bold">+50,000₫</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Giao trong 1-2 ngày</p>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={decorators.insurance}
                    onChange={() => toggleDecorator('insurance')}
                    className="mr-3 mt-1" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="text-green-500" />
                      <p className="font-semibold">Bảo hiểm hàng hóa</p>
                      <span className="ml-auto text-green-600 font-bold">
                        +{Math.round(calculateSubtotal() * 0.02).toLocaleString()}₫
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Bảo hiểm 2% giá trị đơn hàng</p>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={decorators.priorityPackaging}
                    onChange={() => toggleDecorator('priorityPackaging')}
                    className="mr-3 mt-1" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FaBox className="text-orange-500" />
                      <p className="font-semibold">Đóng gói chống va đập</p>
                      <span className="ml-auto text-orange-600 font-bold">+15,000₫</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Đóng gói cẩn thận, an toàn</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 💳 STRATEGY PATTERN - Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaCreditCard className="text-red-600" />
                Phương thức thanh toán
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Strategy Pattern</span>
              </h2>
              
              <div className="space-y-3">
                {/* COD */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'COD' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                }`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="COD" 
                    checked={paymentMethod === 'COD'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mr-3" 
                  />
                  <div>
                    <p className="font-semibold">💵 Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                  </div>
                </label>

                {/* Bank Transfer */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="BANK_TRANSFER" 
                    checked={paymentMethod === 'BANK_TRANSFER'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mr-3" 
                  />
                  <div>
                    <p className="font-semibold">🏦 Chuyển khoản ngân hàng</p>
                    <p className="text-sm text-gray-600">Chuyển khoản qua tài khoản ngân hàng</p>
                  </div>
                </label>

                {/* Credit Card */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'CREDIT_CARD' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="CREDIT_CARD" 
                    checked={paymentMethod === 'CREDIT_CARD'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mr-3" 
                  />
                  <div>
                    <p className="font-semibold">💳 Thẻ tín dụng/Ghi nợ</p>
                    <p className="text-sm text-gray-600">Thanh toán qua thẻ Visa, Mastercard</p>
                  </div>
                </label>

                {/* MoMo */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'MOMO' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
                }`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="MOMO" 
                    checked={paymentMethod === 'MOMO'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mr-3" 
                  />
                  <div>
                    <p className="font-semibold">📱 Ví MoMo</p>
                    <p className="text-sm text-gray-600">Thanh toán qua ví điện tử MoMo</p>
                  </div>
                </label>
              </div>

              {/* Thông tin bổ sung cho từng phương thức */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📝 Thông tin chuyển khoản:</p>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Ngân hàng: <strong>Vietcombank</strong></p>
                    <p>Số TK: <strong>1234567890</strong></p>
                    <p>Chủ TK: <strong>CONG TY SMART</strong></p>
                    <p>Nội dung: <strong>SMART [Mã đơn hàng]</strong></p>
                  </div>
                </div>
              )}

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm text-purple-900">
                    💳 Hỗ trợ: <strong>Visa, Mastercard, JCB</strong>
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Thông tin thẻ được mã hóa bảo mật SSL 256-bit
                  </p>
                </div>
              )}

              {paymentMethod === 'MOMO' && (
                <div className="mt-4 p-4 bg-pink-50 rounded-lg border-l-4 border-pink-500">
                  <p className="text-sm text-pink-900">
                    📱 Quét mã QR hoặc mở app MoMo để thanh toán
                  </p>
                  <p className="text-xs text-pink-700 mt-1">
                    Giao dịch an toàn, nhanh chóng
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({cartItems.length})</span>
                  <span className="font-semibold">{calculateSubtotal().toLocaleString()}₫</span>
                </div>

                {/* 🏭 ABSTRACT FACTORY - Shipping Fee */}
                <div className="flex justify-between text-gray-600 bg-blue-50 p-2 rounded">
                  <span className="flex items-center gap-1 text-sm">
                    🏭 Phí vận chuyển
                  </span>
                  <span className="font-semibold text-blue-600">
                    {calculateShippingFee().toLocaleString()}₫
                  </span>
                </div>

                {/* 🎨 DECORATOR - Extras */}
                {Object.values(decorators).some(v => v) && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs font-semibold text-purple-700 mb-2">🎨 Tính năng bổ sung:</p>
                    {decorators.giftWrap && (
                      <div className="flex justify-between text-xs mb-1">
                        <span>🎁 Gói quà</span>
                        <span>+25,000₫</span>
                      </div>
                    )}
                    {decorators.expressShipping && (
                      <div className="flex justify-between text-xs mb-1">
                        <span>🚀 Giao nhanh</span>
                        <span>+50,000₫</span>
                      </div>
                    )}
                    {decorators.insurance && (
                      <div className="flex justify-between text-xs mb-1">
                        <span>🛡️ Bảo hiểm</span>
                        <span>+{Math.round(calculateSubtotal() * 0.02).toLocaleString()}₫</span>
                      </div>
                    )}
                    {decorators.priorityPackaging && (
                      <div className="flex justify-between text-xs">
                        <span>📦 Đóng gói</span>
                        <span>+15,000₫</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng</span>
                  <span className="text-red-600">{calculateTotal().toLocaleString()}₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
  );
};

export default Checkout;