# 📋 TÓM TẮT: DECORATOR & ABSTRACT FACTORY PATTERNS

## 🏭 ABSTRACT FACTORY PATTERN

### Flow Ngắn Gọn:
```
Frontend → API Call → Server → Routes → Controller
  ↓
ProductFactoryProducer.createProduct(category)
  ↓
BookFactory / ElectronicFactory / ClothingFactory
  ↓
BookProduct / ElectronicProduct / ClothingProduct
  ↓
calculateShipping() → shippingFee
  ↓
Model → Database (lưu productType, shippingFee)
```

### Use Cases:
1. **Tạo sản phẩm mới** (Admin): `POST /api/products`
2. **Tạo đơn hàng** (User): `POST /api/orders` - Tính shipping fee theo loại sản phẩm

### Files:
- `backend/patterns/AbstractFactory.js` - Pattern implementation
- `backend/controllers/productController.js` - Tạo sản phẩm
- `backend/controllers/orderController.js` - Xử lý sản phẩm trong đơn hàng
- `backend/models/orderModel.js` - Lưu `productsMetadata`

---

## 🎨 DECORATOR PATTERN

### Flow Ngắn Gọn:
```
Frontend (User chọn decorators)
  ↓ POST /api/orders { decorators: [...] }
Server → Routes → Controller
  ↓
OrderDecoratorFactory.applyDecorators(baseOrder, decorators)
  ↓
OrderComponent (base)
  ↓ Wrap với:
GiftWrapDecorator (+25k)
  ↓ Wrap với:
ExpressShippingDecorator (+50k)
  ↓ Wrap với:
InsuranceDecorator (+2%)
  ↓
getCost() → finalPrice
  ↓
Model → Database (lưu decorators, extras)
```

### Use Case:
**Tạo đơn hàng với tính năng bổ sung**: `POST /api/orders`

### Decorators:
- 🎁 **GiftWrapDecorator**: +25,000đ
- 🚀 **ExpressShippingDecorator**: +50,000đ
- 🛡️ **InsuranceDecorator**: +2% giá trị đơn hàng
- 📦 **PriorityPackagingDecorator**: +15,000đ

### Files:
- `backend/patterns/Decorator.js` - Pattern implementation
- `frontend/src/pages/Checkout.jsx` - UI cho decorators
- `backend/controllers/orderController.js` - Áp dụng decorators
- `backend/models/orderModel.js` - Lưu `decorators`, `extras`

---

## 🔄 Kết Hợp 2 Patterns trong 1 Flow

### Khi User tạo đơn hàng:

1. **Abstract Factory** (dòng 59-99 trong orderController.js):
   - Loop qua từng sản phẩm trong giỏ hàng
   - Dùng Factory để tạo product object theo loại
   - Tính shipping fee riêng cho từng loại
   - Tổng hợp: `totalShippingFee`

2. **Decorator** (dòng 103-132 trong orderController.js):
   - Tạo base order với giá sản phẩm + shipping
   - Áp dụng decorators (gift wrap, express shipping, ...)
   - Tính `finalPrice = basePrice + decoratorsCost`

3. **Lưu Database** (dòng 173-196):
   - Lưu `productsMetadata` (từ Abstract Factory)
   - Lưu `decorators` và `extras` (từ Decorator)
   - Lưu `totalPrice` (đã bao gồm tất cả)

---

## 📊 Database Schema

### Order Document:
```javascript
{
  orderItems: [...],
  totalPrice: 575000,  // Base + Shipping + Decorators
  
  // Từ Abstract Factory
  productsMetadata: [
    {
      productType: "Electronic",  // "Book", "Clothing"
      shippingFee: 30000,
      quantity: 1
    }
  ],
  
  // Từ Decorator
  decorators: [
    { type: "giftWrap", enabled: true, cost: 25000 },
    { type: "expressShipping", enabled: true, cost: 50000 }
  ],
  extras: [
    { name: "Gói quà cao cấp", cost: 25000, icon: "🎁" },
    { name: "Giao hàng nhanh", cost: 50000, icon: "🚀" }
  ]
}
```

---

## 🎯 Key Points

### Abstract Factory:
- ✅ Tách biệt logic theo loại sản phẩm
- ✅ Mỗi loại có shipping fee riêng
- ✅ Dễ mở rộng (thêm Factory mới)

### Decorator:
- ✅ Thêm tính năng động
- ✅ Có thể kết hợp nhiều decorators
- ✅ Không thay đổi cấu trúc gốc

### Kết Hợp:
- ✅ Abstract Factory xử lý sản phẩm
- ✅ Decorator xử lý đơn hàng
- ✅ Cả 2 đều lưu metadata vào database

---

Xem chi tiết tại: `DESIGN_PATTERNS_FLOW.md`

