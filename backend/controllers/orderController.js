import Order from '../models/orderModel.js';
import Customer from '../models/customerModel.js';
import Product from '../models/productModel.js';

// ✅ IMPORT TẤT CẢ DESIGN PATTERNS
import { ProductFactoryProducer } from '../patterns/AbstractFactory.js';
import { OrderDecoratorFactory } from '../patterns/Decorator.js';
import { PaymentStrategyFactory, PaymentProcessor } from '../patterns/Strategy.js';
import { NotificationManager } from '../patterns/Observer.js';
import { CartManager } from '../patterns/Singleton.js';

// ✅ SINGLETON INSTANCES
const cartManager = CartManager.getInstance();
const notificationManager = new NotificationManager();

/**
 * ========================================
 * 🎯 ROUTE: POST /api/orders
 * Tạo đơn hàng MỚI với TẤT CẢ Design Patterns
 * ========================================
 */
const addOrderItems = async (req, res) => {
  try {
    const { 
      shippingAddress, 
      paymentMethod, 
      totalPrice,
      decorators = [],
      paymentInfo = {}
    } = req.body;
    
    // Validate
    if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.phone) {
      return res.status(400).json({ message: 'Thiếu thông tin địa chỉ giao hàng' });
    }

    // ========================================
    // 1️⃣ SINGLETON PATTERN - Lấy giỏ hàng
    // ========================================
    console.log('\n📦 Step 1: Using SINGLETON to get cart');
    const customer = await Customer.findById(req.user._id);
    const cartItems = customer.cart;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Không có sản phẩm nào trong giỏ hàng' });
    }

    // ✅ Track cart với Singleton
    cartManager.trackCart(req.user._id, cartItems.length);
    console.log('🛒 Cart Stats:', cartManager.getCartStats());

    // ========================================
    // 2️⃣ ABSTRACT FACTORY PATTERN - Xử lý sản phẩm theo loại
    // ========================================
    console.log('\n🏭 Step 2: Using ABSTRACT FACTORY to process products');
    const productsWithFactory = [];
    let totalShippingFee = 0;
    
    for (const item of cartItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
      }

      // ✅ Tạo product object với factory
      const factoryProduct = ProductFactoryProducer.createProduct({
        name: product.name,
        price: product.price,
        category: product.category || product.brand,
        author: product.author,
        brand: product.brand,
        quantity: item.quantity,
        size: product.size,
        color: product.color
      });

      const details = factoryProduct.getDetails();
      const shippingFee = factoryProduct.calculateShipping();
      
      productsWithFactory.push({
        product: factoryProduct,
        details: details,
        shippingFee: shippingFee,
        quantity: item.quantity
      });

      totalShippingFee += shippingFee * item.quantity;

      console.log(`  ✓ Product: ${details.name}`);
      console.log(`    Type: ${details.type}`);
      console.log(`    Shipping Fee: ${shippingFee.toLocaleString()}₫`);

      // ✅ Kiểm tra tồn kho (chỉ kiểm tra, chưa trừ)
      if (product.countInStock < item.quantity) {
        return res.status(400).json({ 
          message: `Sản phẩm "${product.name}" chỉ còn ${product.countInStock} sản phẩm` 
        });
      }
    }

    console.log(`  ✓ Total Shipping Fee: ${totalShippingFee.toLocaleString()}₫`);

    // ========================================
    // 3️⃣ DECORATOR PATTERN - Thêm tính năng cho đơn hàng
    // ========================================
    console.log('\n🎨 Step 3: Using DECORATOR to add features');
    const basePrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const baseOrderData = {
      orderItems: cartItems,
      totalPrice: basePrice + totalShippingFee,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD'
    };

    const decoratedOrder = OrderDecoratorFactory.applyDecorators(
      baseOrderData, 
      decorators
    );

    const orderDetails = decoratedOrder.getDetails();
    const decoratorsCost = decoratedOrder.getCost() - baseOrderData.totalPrice;
    const finalPrice = decoratedOrder.getCost();

    console.log('  ✓ Base Price:', basePrice.toLocaleString() + '₫');
    console.log('  ✓ Shipping Fee:', totalShippingFee.toLocaleString() + '₫');
    if (orderDetails.extras && orderDetails.extras.length > 0) {
      orderDetails.extras.forEach(extra => {
        console.log(`  ✓ ${extra.icon} ${extra.name}: +${extra.cost.toLocaleString()}₫`);
      });
    }
    console.log('  ✓ Final Price:', finalPrice.toLocaleString() + '₫');

    // ========================================
    // 4️⃣ STRATEGY PATTERN - Xử lý thanh toán
    // ========================================
    console.log('\n💳 Step 4: Using STRATEGY for payment');
    const paymentStrategy = PaymentStrategyFactory.createStrategy(paymentMethod || 'COD');
    const paymentProcessor = new PaymentProcessor(paymentStrategy);

    // Validate payment
    const validation = paymentProcessor.validatePayment(paymentInfo);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Process payment
    const paymentResult = paymentProcessor.processPayment(finalPrice, {
      orderId: Date.now(),
      customerId: req.user._id
    });

    console.log(`  ✓ Payment Method: ${paymentResult.method}`);
    console.log(`  ✓ Payment Status: ${paymentResult.status}`);
    console.log(`  ✓ Transaction ID: ${paymentResult.transactionId}`);

    if (!paymentResult.success) {
      return res.status(400).json({ message: paymentResult.message });
    }

    // ========================================
    // 5️⃣ Tạo đơn hàng trong database
    // ========================================
    console.log('\n💾 Step 5: Saving order to database');
    const orderItems = cartItems.map(item => ({
      name: item.name,
      quantity: Number(item.quantity),
      image: item.image,
      price: Number(item.price),
      product: item.product,
    }));

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      totalPrice: Number(finalPrice),
      orderStatus: 'Đang xử lý',
      isPaid: paymentResult.status === 'PAID',
      paidAt: paymentResult.paidAt || null,
      
      // ✅ LƯU THÔNG TIN PATTERNS
      decorators: decorators || [],
      extras: orderDetails.extras || [],
      paymentInfo: {
        transactionId: paymentResult.transactionId,
        method: paymentResult.method,
        status: paymentResult.status
      },
      productsMetadata: productsWithFactory.map(p => ({
        productType: p.details.type,
        shippingFee: p.shippingFee,
        quantity: p.quantity
      }))
    });

    const createdOrder = await order.save();
    console.log('  ✅ Order created:', createdOrder._id);

    // ========================================
    // 5.5️⃣ TRỪ TỒN KHO SAU KHI ĐƠN HÀNG ĐƯỢC TẠO THÀNH CÔNG
    // ========================================
    console.log('\n📦 Step 5.5: Updating product stock after order creation');
    try {
      for (const item of cartItems) {
        // Kiểm tra lại tồn kho một lần nữa (để tránh race condition)
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Không tìm thấy sản phẩm: ${item.product}`);
        }

        if (product.countInStock < item.quantity) {
          // Hoàn trả đơn hàng nếu không đủ tồn kho
          await Order.findByIdAndDelete(createdOrder._id);
          return res.status(400).json({ 
            message: `Sản phẩm "${product.name}" chỉ còn ${product.countInStock} sản phẩm. Đơn hàng đã được hủy.` 
          });
        }

        // Trừ tồn kho bằng atomic operation
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { countInStock: -item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new Error(`Không thể cập nhật tồn kho cho sản phẩm: ${item.product}`);
        }

        console.log(`  ✅ Đã trừ ${item.quantity} sản phẩm "${product.name}". Tồn kho còn: ${updatedProduct.countInStock}`);
      }
    } catch (error) {
      // Nếu có lỗi khi trừ tồn kho, xóa đơn hàng đã tạo
      console.error('❌ Error updating stock, rolling back order:', error);
      await Order.findByIdAndDelete(createdOrder._id);
      return res.status(500).json({ 
        message: `Lỗi khi cập nhật tồn kho: ${error.message}. Đơn hàng đã được hủy.` 
      });
    }

    // ========================================
    // 6️⃣ OBSERVER PATTERN - Gửi thông báo
    // ========================================
    console.log('\n📢 Step 6: Using OBSERVER for notifications');
    const orderObserver = notificationManager.createOrder({
      _id: createdOrder._id,
      orderId: createdOrder._id,
      status: createdOrder.orderStatus,
      totalPrice: createdOrder.totalPrice,
      user: {
        name: customer.name,
        email: customer.email,
        _id: customer._id
      },
      shippingAddress: createdOrder.shippingAddress,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: createdOrder.shippingAddress.phone
    });

    // ✅ Gửi thông báo
    await orderObserver.setStatus('Đang xử lý');

    // ========================================
    // 7️⃣ SINGLETON - Clear cart
    // ========================================
    console.log('\n🧹 Step 7: Using SINGLETON to clear cart');
    customer.cart = [];
    await customer.save();
    
    // ✅ Clear trong CartManager
    cartManager.clearCart(req.user._id);
    console.log('  ✅ Cart cleared for user:', customer._id);

    // ========================================
    // 8️⃣ Response với thông tin patterns
    // ========================================
    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      order: createdOrder,
      // ✅ THÔNG TIN DEBUG CHO PATTERNS
      patterns: {
        abstractFactory: {
          productsProcessed: productsWithFactory.length,
          totalShippingFee: totalShippingFee,
          products: productsWithFactory.map(p => ({
            name: p.details.name,
            type: p.details.type,
            shippingFee: p.shippingFee,
            quantity: p.quantity
          }))
        },
        decorator: {
          applied: decorators || [],
          basePrice: basePrice,
          shippingFee: totalShippingFee,
          decoratorsCost: decoratorsCost,
          extras: orderDetails.extras || [],
          finalPrice: finalPrice
        },
        strategy: {
          paymentMethod: paymentResult.method,
          paymentStatus: paymentResult.status,
          transactionId: paymentResult.transactionId
        },
        observer: {
          notificationsSent: true,
          status: 'Đang xử lý'
        },
        singleton: {
          cartCleared: true,
          cartStats: cartManager.getCartStats()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi khi tạo đơn hàng' 
    });
  }
};

/**
 * ========================================
 * Các functions khác
 * ========================================
 */
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
};

const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name email');
  res.json(orders);
};

/**
 * ========================================
 * 🎯 Cập nhật trạng thái với OBSERVER
 * ========================================
 */
const updateOrderToDelivered = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'Đã giao';
    
    const updatedOrder = await order.save();

    // ✅ OBSERVER PATTERN
    console.log('\n📢 Using Observer Pattern for status change');
    const orderObserver = notificationManager.createOrder({
        _id: updatedOrder._id,
        orderId: updatedOrder._id,
        status: updatedOrder.orderStatus,
        totalPrice: updatedOrder.totalPrice,
        user: order.user,
        shippingAddress: updatedOrder.shippingAddress,
        customerName: order.user.name,
        customerEmail: order.user.email,
        customerPhone: updatedOrder.shippingAddress.phone
    });
    await orderObserver.setStatus('Đã giao');
    
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    if (req.user.isAdmin || order.user._id.equals(req.user._id)) {
      res.json(order);
    } else {
      res.status(401);
      throw new Error('Không có quyền truy cập đơn hàng này');
    }
  } else {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
};

/**
 * ========================================
 * 🎯 Hủy đơn hàng với OBSERVER
 * ========================================
 */
const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  if (!req.user.isAdmin && !order.user._id.equals(req.user._id)) {
    res.status(401);
    throw new Error('Không có quyền hủy đơn hàng này');
  }

  if (order.isDelivered) {
    res.status(400);
    throw new Error('Không thể hủy đơn hàng đã được giao');
  }

  if (order.orderStatus === 'Đã hủy') {
    res.status(400);
    throw new Error('Đơn hàng đã được hủy trước đó');
  }

  // Hoàn trả số lượng sản phẩm
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.countInStock += item.quantity;
      await product.save();
      console.log(`  ✅ Đã hoàn trả ${item.quantity} sản phẩm "${product.name}"`);
    }
  }

  order.orderStatus = 'Đã hủy';
  const updatedOrder = await order.save();

  // ✅ OBSERVER PATTERN
  console.log('\n📢 Using Observer Pattern for order cancellation');
  const orderObserver = notificationManager.createOrder({
      _id: updatedOrder._id,
      orderId: updatedOrder._id,
      status: 'Đã hủy',
      totalPrice: updatedOrder.totalPrice,
      user: order.user,
      shippingAddress: updatedOrder.shippingAddress,
      customerName: order.user.name,
      customerEmail: order.user.email,
      customerPhone: updatedOrder.shippingAddress.phone
  });
  await orderObserver.setStatus('Đã hủy');

  res.json({
    message: 'Đơn hàng đã được hủy thành công',
    order: updatedOrder,
  });
};

/**
 * ========================================
 * 🎯 Lấy các phương thức thanh toán (Strategy Pattern)
 * ========================================
 */
const getPaymentMethods = async (req, res) => {
  try {
    console.log('\n💳 Getting available payment methods using Strategy Pattern');
    
    const methods = PaymentStrategyFactory.getAllMethods();

    res.json({
      success: true,
      methods: methods,
      default: 'COD'
    });

  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ========================================
 * 🎯 Lấy thống kê giỏ hàng (Singleton Pattern)
 * ========================================
 */
const getCartStats = async (req, res) => {
  try {
    console.log('\n📊 Getting cart statistics using Singleton Pattern');
    
    const stats = cartManager.getCartStats();

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error getting cart stats:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ========================================
 * 🎯 Demo tất cả Design Patterns
 * ========================================
 */
const demoAllPatterns = async (req, res) => {
  try {
    console.log('\n🎯 DEMO: ALL DESIGN PATTERNS\n');

    // 1. ABSTRACT FACTORY
    console.log('1️⃣ ABSTRACT FACTORY PATTERN');
    const bookProduct = ProductFactoryProducer.createProduct({
      name: 'Clean Code',
      price: 150000,
      category: 'Văn học',
      author: 'Robert Martin'
    });
    console.log('Book:', bookProduct.getDetails());
    console.log('Shipping:', bookProduct.calculateShipping());

    // 2. DECORATOR
    console.log('\n2️⃣ DECORATOR PATTERN');
    const { OrderComponent, GiftWrapDecorator, ExpressShippingDecorator } = 
      await import('../patterns/Decorator.js');
    
    let order = new OrderComponent({ totalPrice: 500000, orderItems: [] });
    console.log('Base order:', order.getDetails());
    
    order = new GiftWrapDecorator(order);
    order = new ExpressShippingDecorator(order);
    console.log('Decorated order:', order.getDetails());

    // 3. STRATEGY
    console.log('\n3️⃣ STRATEGY PATTERN');
    const codStrategy = PaymentStrategyFactory.createStrategy('COD');
    const processor = new PaymentProcessor(codStrategy);
    const payment = processor.processPayment(500000, { orderId: '123' });
    console.log('Payment:', payment);

    // 4. OBSERVER
    console.log('\n4️⃣ OBSERVER PATTERN');
    const { Order: ObserverOrder } = await import('../patterns/Observer.js');
    const observerOrder = new ObserverOrder({
      _id: '123',
      totalPrice: 500000,
      user: { name: 'Test User', email: 'test@example.com' }
    });
    
    notificationManager.attachDefaultObservers(observerOrder);
    observerOrder.setStatus('Đã xác nhận');

    // 5. SINGLETON
    console.log('\n5️⃣ SINGLETON PATTERN');
    const cart1 = CartManager.getInstance();
    const cart2 = CartManager.getInstance();
    console.log('Same instance?', cart1 === cart2);
    console.log('Stats:', cart1.getCartStats());

    res.json({
      success: true,
      message: 'Demo completed! Check console for details',
      patterns: {
        abstractFactory: 'Created different product types',
        decorator: 'Added gift wrap and express shipping',
        strategy: 'Processed COD payment',
        observer: 'Sent notifications on status change',
        singleton: 'CartManager is a singleton'
      }
    });

  } catch (error) {
    console.error('❌ Error in demo:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ========================================
 * 🎯 Cập nhật trạng thái đơn hàng với Observer (Version mới)
 * ========================================
 */
const updateOrderStatusWithObserver = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // OBSERVER PATTERN - Thông báo khi thay đổi trạng thái
    console.log('\n📢 Using Observer Pattern for status update');
    
    const orderObserver = notificationManager.createOrder({
      _id: order._id,
      orderId: order._id,
      status: status,
      totalPrice: order.totalPrice,
      user: order.user,
      shippingAddress: order.shippingAddress,
      customerName: order.user.name,
      customerEmail: order.user.email,
      customerPhone: order.shippingAddress.phone
    });

    // Update status (this triggers notifications)
    orderObserver.setStatus(status);

    // Update in database
    order.orderStatus = status;
    if (status === 'Đã giao') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      order: updatedOrder,
      notifications: {
        sent: ['email', 'sms', 'push', 'dashboard']
      }
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
};

export { 
  addOrderItems, 
  getMyOrders, 
  getOrders, 
  updateOrderToDelivered, 
  getOrderById, 
  cancelOrder,
  getPaymentMethods,
  getCartStats,
  demoAllPatterns,
  updateOrderStatusWithObserver
};