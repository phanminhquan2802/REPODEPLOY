// backend/patterns/Decorator.js

/**
 * DECORATOR PATTERN
 * Thêm các tính năng bổ sung cho đơn hàng một cách linh hoạt
 * (Gift Wrap, Express Shipping, Insurance, etc.)
 */

// Component Interface
class OrderComponent {
  constructor(orderData) {
    this.orderData = orderData;
  }

  getCost() {
    return this.orderData.totalPrice || 0;
  }

  getDescription() {
    return 'Đơn hàng cơ bản';
  }

  getDetails() {
    return {
      description: this.getDescription(),
      cost: this.getCost(),
      items: this.orderData.orderItems || []
    };
  }
}

// Base Decorator
class OrderDecorator extends OrderComponent {
  constructor(orderComponent) {
    super(orderComponent.orderData);
    this.orderComponent = orderComponent;
  }

  getCost() {
    return this.orderComponent.getCost();
  }

  getDescription() {
    return this.orderComponent.getDescription();
  }

  getDetails() {
    return this.orderComponent.getDetails();
  }
}

// Concrete Decorators
class GiftWrapDecorator extends OrderDecorator {
  constructor(orderComponent) {
    super(orderComponent);
    this.giftWrapCost = 25000; // 25k cho gift wrap
  }

  getCost() {
    return this.orderComponent.getCost() + this.giftWrapCost;
  }

  getDescription() {
    return this.orderComponent.getDescription() + ' + Gói quà cao cấp (25.000đ)';
  }

  getDetails() {
    const details = this.orderComponent.getDetails();
    return {
      ...details,
      description: this.getDescription(),
      cost: this.getCost(),
      extras: [...(details.extras || []), {
        name: 'Gói quà cao cấp',
        cost: this.giftWrapCost,
        icon: '🎁'
      }]
    };
  }
}

class ExpressShippingDecorator extends OrderDecorator {
  constructor(orderComponent) {
    super(orderComponent);
    this.expressShippingCost = 50000; // 50k cho express
  }

  getCost() {
    return this.orderComponent.getCost() + this.expressShippingCost;
  }

  getDescription() {
    return this.orderComponent.getDescription() + ' + Giao hàng nhanh (50.000đ)';
  }

  getDetails() {
    const details = this.orderComponent.getDetails();
    return {
      ...details,
      description: this.getDescription(),
      cost: this.getCost(),
      extras: [...(details.extras || []), {
        name: 'Giao hàng nhanh (1-2 ngày)',
        cost: this.expressShippingCost,
        icon: '🚀'
      }]
    };
  }
}

class InsuranceDecorator extends OrderDecorator {
  constructor(orderComponent) {
    super(orderComponent);
    // Bảo hiểm = 2% giá trị đơn hàng
    this.insuranceCost = Math.round(this.orderComponent.getCost() * 0.02);
  }

  getCost() {
    return this.orderComponent.getCost() + this.insuranceCost;
  }

  getDescription() {
    return this.orderComponent.getDescription() + 
           ` + Bảo hiểm hàng hóa (${this.insuranceCost.toLocaleString()}đ)`;
  }

  getDetails() {
    const details = this.orderComponent.getDetails();
    return {
      ...details,
      description: this.getDescription(),
      cost: this.getCost(),
      extras: [...(details.extras || []), {
        name: 'Bảo hiểm hàng hóa (2%)',
        cost: this.insuranceCost,
        icon: '🛡️'
      }]
    };
  }
}

class PriorityPackagingDecorator extends OrderDecorator {
  constructor(orderComponent) {
    super(orderComponent);
    this.packagingCost = 15000; // 15k cho đóng gói ưu tiên
  }

  getCost() {
    return this.orderComponent.getCost() + this.packagingCost;
  }

  getDescription() {
    return this.orderComponent.getDescription() + 
           ' + Đóng gói chống va đập (15.000đ)';
  }

  getDetails() {
    const details = this.orderComponent.getDetails();
    return {
      ...details,
      description: this.getDescription(),
      cost: this.getCost(),
      extras: [...(details.extras || []), {
        name: 'Đóng gói chống va đập',
        cost: this.packagingCost,
        icon: '📦'
      }]
    };
  }
}

// Helper function để apply decorators
class OrderDecoratorFactory {
  static applyDecorators(baseOrder, decorators = []) {
    let decoratedOrder = new OrderComponent(baseOrder);

    decorators.forEach(decorator => {
      switch(decorator.type) {
        case 'giftWrap':
          if (decorator.enabled) {
            decoratedOrder = new GiftWrapDecorator(decoratedOrder);
          }
          break;
        case 'expressShipping':
          if (decorator.enabled) {
            decoratedOrder = new ExpressShippingDecorator(decoratedOrder);
          }
          break;
        case 'insurance':
          if (decorator.enabled) {
            decoratedOrder = new InsuranceDecorator(decoratedOrder);
          }
          break;
        case 'priorityPackaging':
          if (decorator.enabled) {
            decoratedOrder = new PriorityPackagingDecorator(decoratedOrder);
          }
          break;
        default:
          console.warn(`Unknown decorator type: ${decorator.type}`);
      }
    });

    return decoratedOrder;
  }
}

export {
  OrderComponent,
  OrderDecorator,
  GiftWrapDecorator,
  ExpressShippingDecorator,
  InsuranceDecorator,
  PriorityPackagingDecorator,
  OrderDecoratorFactory
};