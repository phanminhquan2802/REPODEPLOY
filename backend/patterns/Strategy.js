// backend/patterns/Strategy.js

/**
 * STRATEGY PATTERN
 * Xử lý các phương thức thanh toán khác nhau một cách linh hoạt
 */

// Strategy Interface
class PaymentStrategy {
  processPayment(amount, orderData) {
    throw new Error("Method 'processPayment()' must be implemented");
  }

  validatePayment(paymentInfo) {
    throw new Error("Method 'validatePayment()' must be implemented");
  }

  getPaymentDetails() {
    throw new Error("Method 'getPaymentDetails()' must be implemented");
  }
}

// Concrete Strategies
class CODPaymentStrategy extends PaymentStrategy {
  processPayment(amount, orderData) {
    console.log(`💵 Processing COD payment: ${amount.toLocaleString()}đ`);
    
    return {
      success: true,
      method: 'COD',
      amount: amount,
      transactionId: `COD_${Date.now()}`,
      message: 'Thanh toán khi nhận hàng',
      status: 'PENDING',
      paidAt: null
    };
  }

  validatePayment(paymentInfo) {
    // COD không cần validate trước
    return {
      valid: true,
      message: 'Thanh toán khi nhận hàng - Không cần xác thực trước'
    };
  }

  getPaymentDetails() {
    return {
      method: 'COD',
      name: 'Thanh toán khi nhận hàng',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
      icon: '💵',
      fee: 0,
      processingTime: 'Tức thì'
    };
  }
}

class BankTransferStrategy extends PaymentStrategy {
  constructor() {
    super();
    this.bankInfo = {
      bankName: 'Ngân hàng Vietcombank',
      accountNumber: '1234567890',
      accountName: 'CONG TY SMART',
      branch: 'Chi nhánh Hà Nội'
    };
  }

  processPayment(amount, orderData) {
    console.log(`🏦 Processing Bank Transfer: ${amount.toLocaleString()}đ`);
    
    return {
      success: true,
      method: 'BANK_TRANSFER',
      amount: amount,
      transactionId: `BANK_${Date.now()}`,
      message: 'Đang chờ xác nhận chuyển khoản',
      status: 'WAITING_CONFIRMATION',
      paidAt: null,
      bankInfo: this.bankInfo,
      transferContent: `SMART ${orderData.orderId || Date.now()}`
    };
  }

  validatePayment(paymentInfo) {
    if (!paymentInfo.transferCode) {
      return {
        valid: false,
        message: 'Vui lòng nhập mã giao dịch'
      };
    }

    // Simulate validation
    return {
      valid: true,
      message: 'Thông tin hợp lệ. Vui lòng chuyển khoản theo hướng dẫn'
    };
  }

  getPaymentDetails() {
    return {
      method: 'BANK_TRANSFER',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản qua tài khoản ngân hàng',
      icon: '🏦',
      fee: 0,
      processingTime: '1-2 giờ',
      bankInfo: this.bankInfo
    };
  }
}

class CreditCardStrategy extends PaymentStrategy {
  processPayment(amount, orderData) {
    console.log(`💳 Processing Credit Card: ${amount.toLocaleString()}đ`);
    
    // Simulate credit card processing
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        method: 'CREDIT_CARD',
        amount: amount,
        transactionId: `CC_${Date.now()}`,
        message: 'Thanh toán thẻ thành công',
        status: 'PAID',
        paidAt: new Date()
      };
    } else {
      return {
        success: false,
        method: 'CREDIT_CARD',
        amount: amount,
        message: 'Thanh toán thất bại. Vui lòng thử lại',
        status: 'FAILED'
      };
    }
  }

  validatePayment(paymentInfo) {
    const { cardNumber, cvv, expiryDate } = paymentInfo;

    if (!cardNumber || !cvv || !expiryDate) {
      return {
        valid: false,
        message: 'Vui lòng điền đầy đủ thông tin thẻ'
      };
    }

    if (cardNumber.length < 16) {
      return {
        valid: false,
        message: 'Số thẻ không hợp lệ'
      };
    }

    if (cvv.length < 3) {
      return {
        valid: false,
        message: 'CVV không hợp lệ'
      };
    }

    return {
      valid: true,
      message: 'Thông tin thẻ hợp lệ'
    };
  }

  getPaymentDetails() {
    return {
      method: 'CREDIT_CARD',
      name: 'Thẻ tín dụng/Ghi nợ',
      description: 'Thanh toán qua thẻ Visa, Mastercard',
      icon: '💳',
      fee: 0,
      processingTime: 'Tức thì'
    };
  }
}

class MoMoPaymentStrategy extends PaymentStrategy {
  processPayment(amount, orderData) {
    console.log(`📱 Processing MoMo: ${amount.toLocaleString()}đ`);
    
    return {
      success: true,
      method: 'MOMO',
      amount: amount,
      transactionId: `MOMO_${Date.now()}`,
      message: 'Đang chờ thanh toán qua MoMo',
      status: 'WAITING_PAYMENT',
      paidAt: null,
      deepLink: `momo://payment?amount=${amount}&orderId=${orderData.orderId}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=momo_${Date.now()}`
    };
  }

  validatePayment(paymentInfo) {
    return {
      valid: true,
      message: 'Vui lòng quét mã QR hoặc mở app MoMo để thanh toán'
    };
  }

  getPaymentDetails() {
    return {
      method: 'MOMO',
      name: 'Ví MoMo',
      description: 'Thanh toán qua ví điện tử MoMo',
      icon: '📱',
      fee: 0,
      processingTime: 'Tức thì'
    };
  }
}

// Context - Payment Processor
class PaymentProcessor {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  processPayment(amount, orderData) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set');
    }
    return this.strategy.processPayment(amount, orderData);
  }

  validatePayment(paymentInfo) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set');
    }
    return this.strategy.validatePayment(paymentInfo);
  }

  getPaymentDetails() {
    if (!this.strategy) {
      throw new Error('Payment strategy not set');
    }
    return this.strategy.getPaymentDetails();
  }
}

// Factory để tạo payment strategy
class PaymentStrategyFactory {
  static createStrategy(paymentMethod) {
    const method = paymentMethod?.toUpperCase();

    switch(method) {
      case 'COD':
        return new CODPaymentStrategy();
      case 'BANK':
      case 'BANK_TRANSFER':
        return new BankTransferStrategy();
      case 'CREDIT_CARD':
      case 'CARD':
        return new CreditCardStrategy();
      case 'MOMO':
        return new MoMoPaymentStrategy();
      default:
        return new CODPaymentStrategy(); // Default
    }
  }

  static getAllMethods() {
    return [
      new CODPaymentStrategy().getPaymentDetails(),
      new BankTransferStrategy().getPaymentDetails(),
      new CreditCardStrategy().getPaymentDetails(),
      new MoMoPaymentStrategy().getPaymentDetails()
    ];
  }
}

export {
  PaymentStrategy,
  CODPaymentStrategy,
  BankTransferStrategy,
  CreditCardStrategy,
  MoMoPaymentStrategy,
  PaymentProcessor,
  PaymentStrategyFactory
};