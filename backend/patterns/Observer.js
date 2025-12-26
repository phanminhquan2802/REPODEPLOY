// backend/patterns/Observer.js

/**
 * OBSERVER PATTERN - HOẠT ĐỘNG THẬT VỚI NODEMAILER
 * Gửi email THẬT khi trạng thái đơn hàng thay đổi
 */

import nodemailer from 'nodemailer';

// ========================================
// Subject Interface
// ========================================
class OrderSubject {
  constructor() {
    this.observers = [];
  }

  attach(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      console.log(`✅ Observer attached: ${observer.constructor.name}`);
    }
  }

  detach(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log(`❌ Observer detached: ${observer.constructor.name}`);
    }
  }

  async notify(orderData, event) {
    console.log(`📢 Notifying ${this.observers.length} observers about: ${event}`);
    
    const promises = this.observers.map(observer => 
      observer.update(orderData, event).catch(err => {
        console.error(`❌ Observer ${observer.constructor.name} failed:`, err.message);
        return null;
      })
    );
    
    await Promise.all(promises);
  }
}

// ========================================
// Observer Interface
// ========================================
class OrderObserver {
  update(orderData, event) {
    throw new Error("Method 'update()' must be implemented");
  }
}

// ========================================
// ✅ EMAIL OBSERVER - GỬI EMAIL THẬT
// ========================================
class EmailNotificationObserver extends OrderObserver {
  constructor() {
    super();
    this.transporter = null;
    this.canSendEmail = false;
  }

  /**
   * Cấu hình Nodemailer transporter (LAZY INITIALIZATION)
   * Chỉ khởi tạo khi cần dùng, đảm bảo .env đã load
   */
  setupTransporter() {
    // Kiểm tra lại mỗi lần gọi (vì .env có thể load muộn)
    this.canSendEmail = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    if (this.canSendEmail && !this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✅ Email transporter initialized successfully');
      console.log(`   📧 Using: ${process.env.EMAIL_USER}`);
    }
  }

  async update(orderData, event) {
    console.log('\n📧 EMAIL NOTIFICATION');
    console.log(`To: ${orderData.customerEmail}`);
    console.log(`Event: ${event}`);

    // ✅ Setup transporter ngay trước khi gửi
    this.setupTransporter();

    if (!this.canSendEmail) {
      console.log('⚠️ Email service not configured');
      console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
      console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
      return {
        type: 'email',
        status: 'skipped',
        reason: 'Email not configured'
      };
    }

    try {
      // 🔧 OVERRIDE: Nếu email là fake, gửi tới email thật
      const realEmail = orderData.customerEmail.includes('@shoponline.com') 
        ? process.env.EMAIL_USER  // Gửi tới chính email gửi
        : orderData.customerEmail;

      const mailOptions = {
        from: `"SMART Store" <${process.env.EMAIL_USER}>`,
        to: realEmail,
        subject: this.getEmailSubject(event),
        html: this.getEmailHTML(orderData, event)
      };

      console.log('📤 Sending email...');
      console.log(`   From: ${mailOptions.from}`);
      console.log(`   To: ${mailOptions.to} ${realEmail !== orderData.customerEmail ? '(overridden)' : ''}`);
      console.log(`   Subject: ${mailOptions.subject}`);

      // ✅ GỬI EMAIL THẬT
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
      
      return {
        type: 'email',
        to: orderData.customerEmail,
        status: 'sent',
        messageId: info.messageId,
        sentAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      console.error('   Full error:', error);
      return {
        type: 'email',
        to: orderData.customerEmail,
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      };
    }
  }

  getEmailSubject(event) {
    const subjects = {
      'ORDER_CREATED': '✅ Đơn hàng đã được tạo thành công',
      'ORDER_CONFIRMED': '✓ Đơn hàng đã được xác nhận',
      'ORDER_SHIPPING': '🚚 Đơn hàng đang được giao',
      'ORDER_DELIVERED': '🎉 Đơn hàng đã được giao thành công',
      'ORDER_CANCELLED': '❌ Đơn hàng đã bị hủy'
    };
    return subjects[event] || 'Cập nhật đơn hàng';
  }

  getEmailHTML(orderData, event) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content { 
      padding: 30px 20px; 
    }
    .order-info { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
      border-left: 4px solid #667eea;
    }
    .order-info h3 {
      margin-top: 0;
      color: #667eea;
    }
    .order-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .order-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
      color: #d72e2e;
    }
    .button { 
      display: inline-block; 
      background: #667eea; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin-top: 20px;
      font-weight: bold;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer { 
      text-align: center; 
      padding: 20px;
      background: #f8f9fa;
      color: #888; 
      font-size: 12px; 
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      margin: 10px 0;
    }
    .status-created { background: #fff3cd; color: #856404; }
    .status-confirmed { background: #d1ecf1; color: #0c5460; }
    .status-shipping { background: #e2d9f3; color: #5a3d7e; }
    .status-delivered { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 SMART Store</h1>
      <h2>${this.getEmailSubject(event)}</h2>
    </div>
    
    <div class="content">
      <p>Xin chào <strong>${orderData.customerName || 'Quý khách'}</strong>,</p>
      
      ${this.getStatusMessage(event)}
      
      <div class="order-info">
        <h3>📦 Chi tiết đơn hàng</h3>
        <div class="order-row">
          <span>Mã đơn hàng:</span>
          <span><strong>#${orderData.orderId}</strong></span>
        </div>
        <div class="order-row">
          <span>Trạng thái:</span>
          <span class="status-badge status-${this.getStatusClass(event)}">${orderData.status}</span>
        </div>
        <div class="order-row">
          <span>Tổng tiền:</span>
          <span><strong>${orderData.totalPrice?.toLocaleString()}₫</strong></span>
        </div>
        ${orderData.shippingAddress ? `
        <div class="order-row">
          <span>Địa chỉ:</span>
          <span>${orderData.shippingAddress}</span>
        </div>
        ` : ''}
      </div>
      
      <p>Cảm ơn bạn đã tin tưởng và mua sắm tại SMART Store!</p>
      
      <center>
        <a href="http://localhost:5173/my-orders" class="button">Xem đơn hàng</a>
      </center>
    </div>
    
    <div class="footer">
      <p>© 2024 SMART Store. All rights reserved.</p>
      <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getStatusMessage(event) {
    const messages = {
      'ORDER_CREATED': '<p>Đơn hàng của bạn đã được tạo thành công và đang được xử lý.</p>',
      'ORDER_CONFIRMED': '<p>Đơn hàng của bạn đã được xác nhận. Chúng tôi đang chuẩn bị hàng cho bạn.</p>',
      'ORDER_SHIPPING': '<p>Đơn hàng của bạn đang trên đường vận chuyển đến bạn.</p>',
      'ORDER_DELIVERED': '<p>Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!</p>',
      'ORDER_CANCELLED': '<p>Đơn hàng của bạn đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.</p>'
    };
    return messages[event] || '<p>Đơn hàng của bạn đã được cập nhật.</p>';
  }

  getStatusClass(event) {
    const classes = {
      'ORDER_CREATED': 'created',
      'ORDER_CONFIRMED': 'confirmed',
      'ORDER_SHIPPING': 'shipping',
      'ORDER_DELIVERED': 'delivered',
      'ORDER_CANCELLED': 'cancelled'
    };
    return classes[event] || 'created';
  }
}

// ========================================
// 📱 SMS OBSERVER
// ========================================
class SMSNotificationObserver extends OrderObserver {
  async update(orderData, event) {
    console.log('\n📱 SMS NOTIFICATION');
    console.log(`To: ${orderData.customerPhone || '0901234567'}`);
    console.log(`Message: ${this.getSMSMessage(orderData, event)}`);
    
    return {
      type: 'sms',
      to: orderData.customerPhone,
      message: this.getSMSMessage(orderData, event),
      status: 'simulated',
      sentAt: new Date()
    };
  }

  getSMSMessage(orderData, event) {
    const messages = {
      'ORDER_CREATED': `SMART: Don hang #${orderData.orderId} da tao. Tong: ${orderData.totalPrice?.toLocaleString()}d`,
      'ORDER_CONFIRMED': `SMART: Don hang #${orderData.orderId} da xac nhan. Dang chuan bi.`,
      'ORDER_SHIPPING': `SMART: Don hang #${orderData.orderId} dang giao.`,
      'ORDER_DELIVERED': `SMART: Don hang #${orderData.orderId} da giao thanh cong. Cam on!`,
      'ORDER_CANCELLED': `SMART: Don hang #${orderData.orderId} da huy.`
    };
    return messages[event] || `SMART: Don hang #${orderData.orderId} cap nhat.`;
  }
}

// ========================================
// 🔔 PUSH NOTIFICATION OBSERVER
// ========================================
class PushNotificationObserver extends OrderObserver {
  async update(orderData, event) {
    console.log('\n🔔 PUSH NOTIFICATION');
    console.log(`Title: ${this.getPushTitle(event)}`);
    console.log(`Body: ${this.getPushBody(orderData, event)}`);
    
    return {
      type: 'push',
      userId: orderData.userId,
      title: this.getPushTitle(event),
      body: this.getPushBody(orderData, event),
      status: 'simulated',
      sentAt: new Date()
    };
  }

  getPushTitle(event) {
    const titles = {
      'ORDER_CREATED': '✅ Đặt hàng thành công',
      'ORDER_CONFIRMED': '✓ Đã xác nhận',
      'ORDER_SHIPPING': '🚚 Đang giao hàng',
      'ORDER_DELIVERED': '🎉 Đã giao hàng',
      'ORDER_CANCELLED': '❌ Đã hủy'
    };
    return titles[event] || '📦 Cập nhật đơn hàng';
  }

  getPushBody(orderData, event) {
    return `Đơn hàng #${orderData.orderId} - ${orderData.totalPrice?.toLocaleString()}₫`;
  }
}

// ========================================
// 🖥️ ADMIN DASHBOARD OBSERVER
// ========================================
class AdminDashboardObserver extends OrderObserver {
  async update(orderData, event) {
    console.log('\n🖥️ ADMIN DASHBOARD UPDATE');
    console.log(`Event: ${event}`);
    console.log(`Order: #${orderData.orderId}`);
    
    return {
      type: 'dashboard',
      event: event,
      orderData: {
        orderId: orderData.orderId,
        status: orderData.status,
        updatedAt: new Date()
      },
      status: 'simulated'
    };
  }
}

// ========================================
// Concrete Subject - Order
// ========================================
class Order extends OrderSubject {
  constructor(orderData) {
    super();
    this.orderId = orderData._id || orderData.orderId;
    this.status = orderData.status || orderData.orderStatus || 'Đang xử lý';
    this.totalPrice = orderData.totalPrice;
    this.customerName = orderData.user?.name || orderData.customerName;
    this.customerEmail = orderData.user?.email || orderData.customerEmail;
    this.customerPhone = orderData.shippingAddress?.phone || orderData.customerPhone;
    this.userId = orderData.user?._id || orderData.userId;
    this.shippingAddress = orderData.shippingAddress?.address || orderData.shippingAddress;
  }

  async setStatus(newStatus) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    console.log(`\n🔄 Order #${this.orderId}: ${oldStatus} → ${newStatus}`);
    
    const eventMap = {
      'Đang xử lý': 'ORDER_CREATED',
      'Đã xác nhận': 'ORDER_CONFIRMED',
      'Đang giao': 'ORDER_SHIPPING',
      'Đã giao': 'ORDER_DELIVERED',
      'Đã hủy': 'ORDER_CANCELLED'
    };
    
    const event = eventMap[newStatus] || 'ORDER_UPDATED';
    await this.notify(this.getOrderData(), event);
  }

  getOrderData() {
    return {
      orderId: this.orderId,
      status: this.status,
      totalPrice: this.totalPrice,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      userId: this.userId,
      shippingAddress: this.shippingAddress
    };
  }
}

// ========================================
// Helper class để quản lý observers
// ========================================
class NotificationManager {
  constructor() {
    this.defaultObservers = [
      new EmailNotificationObserver(),
      new SMSNotificationObserver(),
      new PushNotificationObserver(),
      new AdminDashboardObserver()
    ];
  }

  createOrder(orderData, observers = null) {
    const order = new Order(orderData);
    
    const observersToAttach = observers || this.defaultObservers;
    observersToAttach.forEach(observer => {
      order.attach(observer);
    });
    
    return order;
  }

  attachDefaultObservers(order) {
    this.defaultObservers.forEach(observer => {
      order.attach(observer);
    });
  }
}

export {
  OrderSubject,
  OrderObserver,
  EmailNotificationObserver,
  SMSNotificationObserver,
  PushNotificationObserver,
  AdminDashboardObserver,
  Order,
  NotificationManager
};