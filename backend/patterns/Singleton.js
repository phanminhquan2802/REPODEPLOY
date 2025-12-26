// backend/patterns/Singleton.js

/**
 * SINGLETON PATTERN
 * Đảm bảo chỉ có một instance duy nhất của Cart Manager
 * và Database Connection Pool
 */

// Cart Manager Singleton
class CartManager {
  constructor() {
    if (CartManager.instance) {
      return CartManager.instance;
    }

    this.carts = new Map(); // userId -> cart items
    this.cartHistory = new Map(); // userId -> history
    this.cartStats = {
      totalCarts: 0,
      totalItems: 0,
      lastUpdated: new Date()
    };
    
    CartManager.instance = this;
    
    console.log('🛒 CartManager Singleton initialized');
  }

  static getInstance() {
    if (!CartManager.instance) {
      CartManager.instance = new CartManager();
    }
    return CartManager.instance;
  }

  // ✅ THÊM: Track cart khi tạo đơn hàng
  trackCart(userId, itemCount) {
    this.cartStats.totalCarts++;
    this.cartStats.totalItems += itemCount;
    this.cartStats.lastUpdated = new Date();
    
    this.addToHistory(userId, 'CHECKOUT', { itemCount });
    console.log(`  ✓ Tracked cart checkout for user ${userId}: ${itemCount} items`);
  }

  getCart(userId) {
    if (!this.carts.has(userId)) {
      this.carts.set(userId, []);
      this.cartHistory.set(userId, []);
    }
    return this.carts.get(userId);
  }

  addItem(userId, item) {
    const cart = this.getCart(userId);
    const existingItem = cart.find(i => i.productId === item.productId);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.addToHistory(userId, 'ADD_ITEM', item);
    console.log(`✅ Added item to cart for user ${userId}`);
    
    return cart;
  }

  updateItem(userId, productId, quantity) {
    const cart = this.getCart(userId);
    const item = cart.find(i => i.productId === productId);

    if (item) {
      const oldQuantity = item.quantity;
      item.quantity = quantity;
      this.addToHistory(userId, 'UPDATE_ITEM', { 
        productId, 
        oldQuantity, 
        newQuantity: quantity 
      });
      console.log(`🔄 Updated item quantity for user ${userId}`);
    }

    return cart;
  }

  removeItem(userId, productId) {
    const cart = this.getCart(userId);
    const index = cart.findIndex(i => i.productId === productId);

    if (index > -1) {
      const removedItem = cart.splice(index, 1)[0];
      this.addToHistory(userId, 'REMOVE_ITEM', removedItem);
      console.log(`🗑️ Removed item from cart for user ${userId}`);
    }

    return cart;
  }

  clearCart(userId) {
    const cart = this.getCart(userId);
    this.addToHistory(userId, 'CLEAR_CART', { itemsCount: cart.length });
    this.carts.set(userId, []);
    console.log(`🧹 Cleared cart for user ${userId}`);
    
    return [];
  }

  getCartTotal(userId) {
    const cart = this.getCart(userId);
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  getCartItemCount(userId) {
    const cart = this.getCart(userId);
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  addToHistory(userId, action, data) {
    const history = this.cartHistory.get(userId) || [];
    history.push({
      action,
      data,
      timestamp: new Date()
    });
    
    // Keep only last 50 actions
    if (history.length > 50) {
      history.shift();
    }
    
    this.cartHistory.set(userId, history);
  }

  getHistory(userId) {
    return this.cartHistory.get(userId) || [];
  }

  getCartStats() {
    return {
      totalUsers: this.carts.size,
      totalCarts: this.cartStats.totalCarts,
      totalItems: this.cartStats.totalItems,
      activeCarts: Array.from(this.carts.values()).filter(cart => cart.length > 0).length,
      lastUpdated: this.cartStats.lastUpdated
    };
  }

  // Cleanup inactive carts (older than 7 days)
  cleanupInactiveCarts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, history] of this.cartHistory.entries()) {
      if (history.length > 0) {
        const lastActivity = history[history.length - 1].timestamp;
        if (lastActivity < sevenDaysAgo) {
          this.carts.delete(userId);
          this.cartHistory.delete(userId);
          cleanedCount++;
        }
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} inactive carts`);
    return cleanedCount;
  }
}

// Database Connection Pool Singleton
class DatabaseConnectionPool {
  constructor() {
    if (DatabaseConnectionPool.instance) {
      return DatabaseConnectionPool.instance;
    }

    this.connections = [];
    this.maxConnections = 10;
    this.activeConnections = 0;
    DatabaseConnectionPool.instance = this;
    
    console.log('💾 DatabaseConnectionPool Singleton initialized');
  }

  static getInstance() {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  async getConnection() {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      console.log(`📊 Active connections: ${this.activeConnections}/${this.maxConnections}`);
      
      return {
        id: Date.now(),
        execute: async (query) => {
          console.log(`🔍 Executing query: ${query}`);
          return new Promise(resolve => setTimeout(resolve, 100));
        },
        release: () => {
          this.activeConnections--;
          console.log(`✅ Connection released. Active: ${this.activeConnections}`);
        }
      };
    } else {
      throw new Error('Connection pool exhausted');
    }
  }

  getStats() {
    return {
      maxConnections: this.maxConnections,
      activeConnections: this.activeConnections,
      availableConnections: this.maxConnections - this.activeConnections
    };
  }
}

// Configuration Manager Singleton
class ConfigurationManager {
  constructor() {
    if (ConfigurationManager.instance) {
      return ConfigurationManager.instance;
    }

    this.config = {
      app: {
        name: 'SMART Store',
        version: '1.0.0',
        env: process.env.NODE_ENV || 'development'
      },
      payment: {
        methods: ['COD', 'BANK', 'CREDIT_CARD', 'MOMO'],
        defaultMethod: 'COD'
      },
      shipping: {
        defaultFee: 30000,
        freeShippingThreshold: 500000
      },
      features: {
        giftWrap: true,
        expressShipping: true,
        insurance: true
      }
    };

    ConfigurationManager.instance = this;
    console.log('⚙️ ConfigurationManager Singleton initialized');
  }

  static getInstance() {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      value = value[k];
      if (value === undefined) break;
    }
    
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    console.log(`⚙️ Config updated: ${key} = ${JSON.stringify(value)}`);
  }

  getAll() {
    return { ...this.config };
  }
}

// Export singletons
export {
  CartManager,
  DatabaseConnectionPool,
  ConfigurationManager
};