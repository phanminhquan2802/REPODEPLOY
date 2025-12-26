// backend/patterns/AbstractFactory.js

/**
 * ABSTRACT FACTORY PATTERN
 * Tạo ra các loại sản phẩm khác nhau (Book, Electronic, Clothing)
 * mà không cần biết class cụ thể
 */

// Abstract Product
class Product {
  constructor(data) {
    this.name = data.name;
    this.price = data.price;
    this.category = data.category;
  }

  getDetails() {
    throw new Error("Method 'getDetails()' must be implemented");
  }

  calculateShipping() {
    throw new Error("Method 'calculateShipping()' must be implemented");
  }
}

// Concrete Products
class BookProduct extends Product {
  constructor(data) {
    super(data);
    this.author = data.author;
    this.publisher = data.publisher;
    this.pageCount = data.pageCount;
    this.isbn = data.isbn;
  }

  getDetails() {
    return {
      type: 'Book',
      name: this.name,
      author: this.author,
      publisher: this.publisher,
      pages: this.pageCount,
      price: this.price
    };
  }

  calculateShipping() {
    // Sách shipping fee thấp hơn
    return this.price > 100000 ? 0 : 15000;
  }

  getCategory() {
    return 'Văn học';
  }
}

class ElectronicProduct extends Product {
  constructor(data) {
    super(data);
    this.brand = data.brand;
    this.warranty = data.warranty || '12 tháng';
    this.specs = data.specs || {};
  }

  getDetails() {
    return {
      type: 'Electronic',
      name: this.name,
      brand: this.brand,
      warranty: this.warranty,
      specs: this.specs,
      price: this.price
    };
  }

  calculateShipping() {
    // Đồ điện tử shipping fee cao hơn
    return this.price > 500000 ? 0 : 30000;
  }

  getCategory() {
    return 'Đồ điện tử';
  }
}

class ClothingProduct extends Product {
  constructor(data) {
    super(data);
    this.size = data.size;
    this.color = data.color;
    this.material = data.material;
  }

  getDetails() {
    return {
      type: 'Clothing',
      name: this.name,
      size: this.size,
      color: this.color,
      material: this.material,
      price: this.price
    };
  }

  calculateShipping() {
    // Quần áo shipping fee trung bình
    return this.price > 200000 ? 0 : 20000;
  }

  getCategory() {
    return 'Quần áo';
  }
}

// Abstract Factory
class ProductFactory {
  createProduct(data) {
    throw new Error("Method 'createProduct()' must be implemented");
  }
}

// Concrete Factories
class BookFactory extends ProductFactory {
  createProduct(data) {
    return new BookProduct(data);
  }
}

class ElectronicFactory extends ProductFactory {
  createProduct(data) {
    return new ElectronicProduct(data);
  }
}

class ClothingFactory extends ProductFactory {
  createProduct(data) {
    return new ClothingProduct(data);
  }
}

// Factory Producer (Main Factory)
class ProductFactoryProducer {
  static getFactory(category) {
    const normalizedCategory = category?.toLowerCase() || '';
    
    if (normalizedCategory.includes('văn học') || 
        normalizedCategory.includes('sách') ||
        normalizedCategory.includes('book')) {
      return new BookFactory();
    } else if (normalizedCategory.includes('điện tử') || 
               normalizedCategory.includes('electronic')) {
      return new ElectronicFactory();
    } else if (normalizedCategory.includes('quần áo') || 
               normalizedCategory.includes('thời trang') ||
               normalizedCategory.includes('clothing')) {
      return new ClothingFactory();
    }
    
    // Default to BookFactory
    return new BookFactory();
  }

  static createProduct(data) {
    const factory = this.getFactory(data.category || data.brand);
    return factory.createProduct(data);
  }
}

export {
  Product,
  BookProduct,
  ElectronicProduct,
  ClothingProduct,
  ProductFactory,
  BookFactory,
  ElectronicFactory,
  ClothingFactory,
  ProductFactoryProducer
};