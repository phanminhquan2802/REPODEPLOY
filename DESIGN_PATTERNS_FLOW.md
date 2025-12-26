# 📋 FLOW CHI TIẾT: DECORATOR & ABSTRACT FACTORY PATTERNS

## 🎯 Tổng quan

Tài liệu này mô tả chi tiết flow của **Decorator Pattern** và **Abstract Factory Pattern** trong hệ thống, từ Frontend → Server → Routes → Controller → Model → Database.

---

## 🏭 ABSTRACT FACTORY PATTERN - Flow Chi Tiết

### 📍 Mục đích
Tạo các loại sản phẩm khác nhau (Book, Electronic, Clothing) mà không cần biết class cụ thể, tự động tính shipping fee theo loại.

---

### 🔄 FLOW 1: Tạo Sản Phẩm Mới (Admin)

#### **1. Frontend (Admin.jsx hoặc AdminProducts.jsx)**
```javascript
// User nhập thông tin sản phẩm
const productData = {
  name: "iPhone 15",
  category: "Đồ điện tử",
  price: 25000000,
  brand: "Apple",
  warranty: "12 tháng",
  // ... các thông tin khác
};

// Gọi API
await productsAPI.createProduct(productData);
```

**File:** `frontend/src/pages/Admin.jsx` hoặc `frontend/src/components/AdminProducts.jsx`

**API Call:** `POST /api/products` (từ `frontend/src/utils/api.js`)

---

#### **2. Server (server.js)**
```javascript
// Server nhận request
app.use('/api/products', productRoutes);
```

**File:** `backend/server.js` (dòng 98)

**Chức năng:** 
- Nhận HTTP request từ frontend
- Route đến `/api/products`
- Áp dụng middleware (CORS, JSON parser)

---

#### **3. Routes (productRoutes.js)**
```javascript
router.post('/', protect, admin, createProduct);
```

**File:** `backend/routes/productRoutes.js`

**Chức năng:**
- Xác thực user (`protect` middleware)
- Kiểm tra quyền admin (`admin` middleware)
- Gọi controller `createProduct`

---

#### **4. Controller (productController.js)**
```javascript
const createProduct = async (req, res) => {
  // ✅ BƯỚC 1: Nhận data từ request
  const { name, category, price, brand, warranty, ... } = req.body;

  // ✅ BƯỚC 2: Sử dụng ABSTRACT FACTORY để tạo product object
  const factoryProduct = ProductFactoryProducer.createProduct({
    name: name,
    price: price,
    category: category,  // "Đồ điện tử" → sẽ tạo ElectronicProduct
    brand: brand,
    warranty: warranty,
    // ...
  });

  // ✅ BƯỚC 3: Lấy thông tin từ Factory
  const details = factoryProduct.getDetails();  // { type: 'Electronic', ... }
  const shippingFee = factoryProduct.calculateShipping();  // 30000

  // ✅ BƯỚC 4: Lưu vào Database
  const product = new Product({
    name: name,
    category: category,
    price: price,
    productType: details.type,  // "Electronic"
    shippingFee: shippingFee,     // 30000
    // ...
  });

  await product.save();
};
```

**File:** `backend/controllers/productController.js` (dòng 68-159)

**Chi tiết Abstract Factory:**
- `ProductFactoryProducer.getFactory(category)` → Trả về factory phù hợp:
  - `"Đồ điện tử"` → `ElectronicFactory`
  - `"Văn học"` hoặc `"Sách"` → `BookFactory`
  - `"Quần áo"` → `ClothingFactory`
- `factory.createProduct(data)` → Tạo product object:
  - `ElectronicFactory` → `ElectronicProduct` (shipping: 30k)
  - `BookFactory` → `BookProduct` (shipping: 15k)
  - `ClothingFactory` → `ClothingProduct` (shipping: 20k)

---

#### **5. Pattern Implementation (AbstractFactory.js)**
```javascript
// Factory Producer quyết định factory nào
class ProductFactoryProducer {
  static getFactory(category) {
    if (category.includes('điện tử')) {
      return new ElectronicFactory();
    } else if (category.includes('sách')) {
      return new BookFactory();
    } else if (category.includes('quần áo')) {
      return new ClothingFactory();
    }
  }

  static createProduct(data) {
    const factory = this.getFactory(data.category);
    return factory.createProduct(data);  // Trả về BookProduct/ElectronicProduct/ClothingProduct
  }
}

// Mỗi Product có logic tính shipping riêng
class ElectronicProduct extends Product {
  calculateShipping() {
    return this.price > 500000 ? 0 : 30000;  // Đồ điện tử: 30k
  }
}

class BookProduct extends Product {
  calculateShipping() {
    return this.price > 100000 ? 0 : 15000;  // Sách: 15k
  }
}
```

**File:** `backend/patterns/AbstractFactory.js`

---

#### **6. Model (productModel.js)**
```javascript
const productSchema = mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  productType: String,    // "Electronic", "Book", "Clothing"
  shippingFee: Number,     // Được tính từ Factory
  // ...
});
```

**File:** `backend/models/productModel.js`

---

#### **7. Database (MongoDB)**
```json
{
  "_id": "...",
  "name": "iPhone 15",
  "category": "Đồ điện tử",
  "price": 25000000,
  "productType": "Electronic",
  "shippingFee": 0,  // Vì price > 500k nên free shipping
  "brand": "Apple",
  "warranty": "12 tháng"
}
```

**Collection:** `products`

---

### 🔄 FLOW 2: Tạo Đơn Hàng (User Checkout)

#### **1. Frontend (Checkout.jsx)**
```javascript
// User xem giỏ hàng và chọn tính năng bổ sung
const [decorators, setDecorators] = useState({
  giftWrap: false,
  expressShipping: false,
  insurance: false,
  priorityPackaging: false
});

// Tính shipping fee theo loại sản phẩm (Abstract Factory logic ở FE)
const getProductType = (category) => {
  if (category.includes('điện tử')) {
    return { shippingFee: 30000 };
  } else if (category.includes('sách')) {
    return { shippingFee: 15000 };
  }
  // ...
};

// Submit order
const orderData = {
  shippingAddress: { ... },
  paymentMethod: 'COD',
  decorators: [
    { type: 'giftWrap', enabled: true },
    { type: 'expressShipping', enabled: true }
  ]
};

await ordersAPI.createOrder(orderData);
```

**File:** `frontend/src/pages/Checkout.jsx` (dòng 1-150)

**API Call:** `POST /api/orders` (từ `frontend/src/utils/api.js`)

---

#### **2. Server (server.js)**
```javascript
app.use('/api/orders', orderRoutes);
```

**File:** `backend/server.js` (dòng 102)

---

#### **3. Routes (orderRoutes.js)**
```javascript
router.post('/', protect, addOrderItems);
```

**File:** `backend/routes/orderRoutes.js` (dòng 35)

---

#### **4. Controller (orderController.js) - ABSTRACT FACTORY**

```javascript
const addOrderItems = async (req, res) => {
  // ✅ BƯỚC 1: Lấy giỏ hàng từ database
  const customer = await Customer.findById(req.user._id);
  const cartItems = customer.cart;

  // ✅ BƯỚC 2: ABSTRACT FACTORY - Xử lý từng sản phẩm
  const productsWithFactory = [];
  let totalShippingFee = 0;

  for (const item of cartItems) {
    const product = await Product.findById(item.product);

    // 🏭 Sử dụng Factory để tạo product object
    const factoryProduct = ProductFactoryProducer.createProduct({
      name: product.name,
      price: product.price,
      category: product.category,  // "Đồ điện tử"
      brand: product.brand,
      // ...
    });

    // Lấy thông tin từ Factory
    const details = factoryProduct.getDetails();  // { type: 'Electronic', ... }
    const shippingFee = factoryProduct.calculateShipping();  // 30000 hoặc 0

    productsWithFactory.push({
      product: factoryProduct,
      details: details,
      shippingFee: shippingFee,
      quantity: item.quantity
    });

    totalShippingFee += shippingFee * item.quantity;
  }

  // ✅ BƯỚC 3: Tính tổng giá base
  const basePrice = cartItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );

  // ✅ BƯỚC 4: DECORATOR PATTERN (xem phần dưới)
  // ...

  // ✅ BƯỚC 5: Lưu vào database với metadata từ Factory
  const order = new Order({
    orderItems: cartItems,
    totalPrice: finalPrice,
    productsMetadata: productsWithFactory.map(p => ({
      productType: p.details.type,  // "Electronic", "Book", "Clothing"
      shippingFee: p.shippingFee,
      quantity: p.quantity
    }))
  });

  await order.save();
};
```

**File:** `backend/controllers/orderController.js` (dòng 22-200)

**Chi tiết:**
- Dòng 59-99: Loop qua từng item trong giỏ hàng
- Dòng 66-75: Sử dụng `ProductFactoryProducer.createProduct()` để tạo product object
- Dòng 77-78: Lấy `details` và `shippingFee` từ factory product
- Dòng 191-195: Lưu metadata vào order để track loại sản phẩm

---

#### **5. Model (orderModel.js)**
```javascript
const orderSchema = mongoose.Schema({
  orderItems: [...],
  totalPrice: Number,
  
  // ✅ ABSTRACT FACTORY - Metadata về sản phẩm
  productsMetadata: [{
    productType: String,  // "Electronic", "Book", "Clothing"
    shippingFee: Number,
    quantity: Number
  }],
  // ...
});
```

**File:** `backend/models/orderModel.js` (dòng 108-114)

---

#### **6. Database (MongoDB)**
```json
{
  "_id": "...",
  "orderItems": [
    { "name": "iPhone 15", "quantity": 1, "price": 25000000 }
  ],
  "totalPrice": 25050000,
  "productsMetadata": [
    {
      "productType": "Electronic",
      "shippingFee": 0,  // Free vì > 500k
      "quantity": 1
    }
  ]
}
```

**Collection:** `orders`

---

## 🎨 DECORATOR PATTERN - Flow Chi Tiết

### 📍 Mục đích
Thêm các tính năng bổ sung cho đơn hàng (Gift Wrap, Express Shipping, Insurance, Priority Packaging) một cách linh hoạt mà không thay đổi cấu trúc đơn hàng gốc.

---

### 🔄 FLOW: Tạo Đơn Hàng với Decorators

#### **1. Frontend (Checkout.jsx)**
```javascript
// User chọn các tính năng bổ sung
const [decorators, setDecorators] = useState({
  giftWrap: true,           // ✅ Chọn
  expressShipping: true,    // ✅ Chọn
  insurance: false,          // ❌ Không chọn
  priorityPackaging: false  // ❌ Không chọn
});

// Tính chi phí decorators
const calculateDecoratorsCost = () => {
  let cost = 0;
  if (decorators.giftWrap) cost += 25000;
  if (decorators.expressShipping) cost += 50000;
  if (decorators.insurance) cost += Math.round(subtotal * 0.02);
  if (decorators.priorityPackaging) cost += 15000;
  return cost;
};

// Submit order với decorators
const decoratorsArray = [];
if (decorators.giftWrap) decoratorsArray.push({ type: 'giftWrap', enabled: true });
if (decorators.expressShipping) decoratorsArray.push({ type: 'expressShipping', enabled: true });

const orderData = {
  shippingAddress: { ... },
  paymentMethod: 'COD',
  decorators: decoratorsArray,  // [{ type: 'giftWrap', enabled: true }, ...]
  totalPrice: calculateTotal()
};

await ordersAPI.createOrder(orderData);
```

**File:** `frontend/src/pages/Checkout.jsx` (dòng 27-140)

**Chi tiết:**
- Dòng 27-32: State quản lý decorators
- Dòng 87-97: Tính chi phí decorators
- Dòng 122-126: Chuẩn bị decorators array để gửi lên server

---

#### **2. Server (server.js)**
```javascript
app.use('/api/orders', orderRoutes);
```

**File:** `backend/server.js` (dòng 102)

---

#### **3. Routes (orderRoutes.js)**
```javascript
router.post('/', protect, addOrderItems);
```

**File:** `backend/routes/orderRoutes.js` (dòng 35)

---

#### **4. Controller (orderController.js) - DECORATOR**

```javascript
const addOrderItems = async (req, res) => {
  const { decorators = [] } = req.body;  // [{ type: 'giftWrap', enabled: true }, ...]

  // ✅ BƯỚC 1: Tính base price (sản phẩm + shipping)
  const basePrice = cartItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  const totalShippingFee = /* từ Abstract Factory */;
  
  const baseOrderData = {
    orderItems: cartItems,
    totalPrice: basePrice + totalShippingFee,  // Giá gốc
    shippingAddress: shippingAddress,
    paymentMethod: paymentMethod
  };

  // ✅ BƯỚC 2: DECORATOR PATTERN - Áp dụng decorators
  console.log('\n🎨 Step 3: Using DECORATOR to add features');
  
  const decoratedOrder = OrderDecoratorFactory.applyDecorators(
    baseOrderData,   // Order gốc
    decorators       // [{ type: 'giftWrap', enabled: true }, ...]
  );

  // ✅ BƯỚC 3: Lấy thông tin từ decorated order
  const orderDetails = decoratedOrder.getDetails();
  const decoratorsCost = decoratedOrder.getCost() - baseOrderData.totalPrice;
  const finalPrice = decoratedOrder.getCost();

  console.log('  ✓ Base Price:', baseOrderData.totalPrice);
  console.log('  ✓ Decorators Cost:', decoratorsCost);
  console.log('  ✓ Final Price:', finalPrice);
  console.log('  ✓ Extras:', orderDetails.extras);

  // ✅ BƯỚC 4: Lưu vào database
  const order = new Order({
    orderItems: cartItems,
    totalPrice: finalPrice,  // Giá đã bao gồm decorators
    decorators: decorators,  // Lưu decorators đã chọn
    extras: orderDetails.extras || []  // Chi tiết extras
  });

  await order.save();
};
```

**File:** `backend/controllers/orderController.js` (dòng 103-196)

**Chi tiết:**
- Dòng 107-114: Tạo base order data (chưa có decorators)
- Dòng 116-119: Áp dụng decorators bằng `OrderDecoratorFactory.applyDecorators()`
- Dòng 121-123: Lấy thông tin từ decorated order
- Dòng 184-185: Lưu decorators và extras vào database

---

#### **5. Pattern Implementation (Decorator.js)**

```javascript
// Component gốc
class OrderComponent {
  constructor(orderData) {
    this.orderData = orderData;
  }

  getCost() {
    return this.orderData.totalPrice || 0;  // Giá gốc
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
    return this.orderComponent.getCost();  // Delegate
  }

  getDescription() {
    return this.orderComponent.getDescription();  // Delegate
  }
}

// Concrete Decorators
class GiftWrapDecorator extends OrderDecorator {
  constructor(orderComponent) {
    super(orderComponent);
    this.giftWrapCost = 25000;
  }

  getCost() {
    return this.orderComponent.getCost() + this.giftWrapCost;  // Base + 25k
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
    this.expressShippingCost = 50000;
  }

  getCost() {
    return this.orderComponent.getCost() + this.expressShippingCost;  // Base + 50k
  }

  getDescription() {
    return this.orderComponent.getDescription() + ' + Giao hàng nhanh (50.000đ)';
  }
}

// Factory để apply decorators
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
      }
    });

    return decoratedOrder;  // Order đã được wrap nhiều lớp
  }
}
```

**File:** `backend/patterns/Decorator.js`

**Cách hoạt động:**
1. Tạo `OrderComponent` từ base order data
2. Loop qua decorators array
3. Wrap order bằng các decorator tương ứng:
   - `giftWrap` → `GiftWrapDecorator` (+25k)
   - `expressShipping` → `ExpressShippingDecorator` (+50k)
   - `insurance` → `InsuranceDecorator` (+2% giá trị)
   - `priorityPackaging` → `PriorityPackagingDecorator` (+15k)
4. Mỗi decorator gọi `getCost()` của decorator bên trong và cộng thêm chi phí của mình
5. Kết quả: Order được wrap nhiều lớp, mỗi lớp thêm một tính năng

**Ví dụ:**
```
Base Order (500k)
  → GiftWrapDecorator (500k + 25k = 525k)
    → ExpressShippingDecorator (525k + 50k = 575k)
```

---

#### **6. Model (orderModel.js)**
```javascript
const orderSchema = mongoose.Schema({
  orderItems: [...],
  totalPrice: Number,  // Giá đã bao gồm decorators
  
  // ✅ DECORATOR PATTERN - Lưu decorators đã chọn
  decorators: [{
    type: String,      // "giftWrap", "expressShipping", ...
    enabled: Boolean,
    cost: Number,
    description: String
  }],
  
  // ✅ Chi tiết extras từ Decorator
  extras: [{
    name: String,      // "Gói quà cao cấp"
    cost: Number,      // 25000
    icon: String,      // "🎁"
    description: String
  }],
  // ...
});

// Methods
orderSchema.methods.getDecoratorsTotal = function() {
  return this.decorators
    .filter(d => d.enabled)
    .reduce((sum, d) => sum + (d.cost || 0), 0);
};
```

**File:** `backend/models/orderModel.js` (dòng 68-81, 150-154)

---

#### **7. Database (MongoDB)**
```json
{
  "_id": "...",
  "orderItems": [...],
  "totalPrice": 575000,  // Base 500k + Gift Wrap 25k + Express 50k
  "decorators": [
    { "type": "giftWrap", "enabled": true, "cost": 25000 },
    { "type": "expressShipping", "enabled": true, "cost": 50000 }
  ],
  "extras": [
    { "name": "Gói quà cao cấp", "cost": 25000, "icon": "🎁" },
    { "name": "Giao hàng nhanh (1-2 ngày)", "cost": 50000, "icon": "🚀" }
  ]
}
```

**Collection:** `orders`

---

## 📊 Tổng Kết Flow

### Abstract Factory Pattern
```
Frontend (Checkout.jsx)
  ↓ POST /api/orders
Server (server.js)
  ↓ Route /api/orders
Routes (orderRoutes.js)
  ↓ protect middleware
Controller (orderController.js)
  ↓ ProductFactoryProducer.createProduct()
Pattern (AbstractFactory.js)
  ↓ Tạo BookProduct/ElectronicProduct/ClothingProduct
Controller (orderController.js)
  ↓ Lấy shippingFee từ factory product
Model (orderModel.js)
  ↓ Lưu productsMetadata
Database (MongoDB)
  ↓ Collection: orders
```

### Decorator Pattern
```
Frontend (Checkout.jsx)
  ↓ User chọn decorators
  ↓ POST /api/orders { decorators: [...] }
Server (server.js)
  ↓ Route /api/orders
Routes (orderRoutes.js)
  ↓ protect middleware
Controller (orderController.js)
  ↓ OrderDecoratorFactory.applyDecorators()
Pattern (Decorator.js)
  ↓ Wrap order với GiftWrapDecorator, ExpressShippingDecorator, ...
Controller (orderController.js)
  ↓ Lấy finalPrice và extras từ decorated order
Model (orderModel.js)
  ↓ Lưu decorators và extras
Database (MongoDB)
  ↓ Collection: orders
```

---

## 🔍 Điểm Quan Trọng

### Abstract Factory
- ✅ Tách biệt logic tạo sản phẩm theo loại
- ✅ Mỗi loại sản phẩm có shipping fee riêng
- ✅ Dễ mở rộng thêm loại sản phẩm mới (chỉ cần thêm Factory)
- ✅ Metadata được lưu vào database để tracking

### Decorator
- ✅ Thêm tính năng động mà không thay đổi cấu trúc gốc
- ✅ Có thể kết hợp nhiều decorators
- ✅ Mỗi decorator độc lập, dễ test
- ✅ Chi tiết extras được lưu vào database để hiển thị cho user

---

## 📝 Files Liên Quan

### Frontend
- `frontend/src/pages/Checkout.jsx` - UI cho decorators
- `frontend/src/utils/api.js` - API calls
- `frontend/src/pages/Admin.jsx` - Tạo sản phẩm với Abstract Factory

### Backend
- `backend/server.js` - Server setup
- `backend/routes/orderRoutes.js` - Order routes
- `backend/routes/productRoutes.js` - Product routes
- `backend/controllers/orderController.js` - Order logic với cả 2 patterns
- `backend/controllers/productController.js` - Product logic với Abstract Factory
- `backend/patterns/AbstractFactory.js` - Abstract Factory implementation
- `backend/patterns/Decorator.js` - Decorator implementation
- `backend/models/orderModel.js` - Order schema với decorators và productsMetadata
- `backend/models/productModel.js` - Product schema

---

## 🎓 Kết Luận

Cả hai patterns hoạt động độc lập nhưng bổ trợ cho nhau:
- **Abstract Factory** xử lý sản phẩm theo loại (tính shipping fee)
- **Decorator** thêm tính năng cho đơn hàng (gift wrap, express shipping, ...)

Flow từ Frontend → Database được thiết kế rõ ràng, dễ maintain và mở rộng.

