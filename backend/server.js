import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env từ root project (parent directory)
const rootEnvPath = path.join(__dirname, '..', '.env');
const backendEnvPath = path.join(__dirname, '.env');

let envLoaded = false;

// Thử load từ root trước
const result1 = dotenv.config({ path: rootEnvPath });
if (!result1.error) {
    envLoaded = true;
    console.log('✅ Loaded .env from ROOT:', rootEnvPath);
} else {
    // Nếu không có ở root, thử backend folder
    const result2 = dotenv.config({ path: backendEnvPath });
    if (!result2.error) {
        envLoaded = true;
        console.log('✅ Loaded .env from BACKEND:', backendEnvPath);
    } else {
        console.warn('⚠️  No .env file found. Using system environment variables.');
    }
}

// Kiểm tra các biến môi trường quan trọng
if (!process.env.MONGO_URI) {
    console.warn('⚠️  WARNING: MONGO_URI is not defined!');
    console.warn('   Please create a .env file with MONGO_URI');
    console.warn('   Server will start but database features will not work.');
}

const emailUser = process.env.EMAIL_USER || process.env.EMAIL_USERNAME;
const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
    console.warn('⚠️  WARNING: EMAIL_USER and EMAIL_PASSWORD (or EMAIL_PASS) are not defined!');
    console.warn('   Email notifications will not work.');
    console.warn('   Please add to .env file:');
    console.warn('   EMAIL_USER=your-email@gmail.com');
    console.warn('   EMAIL_PASSWORD=your-app-password');
} else {
    console.log('✅ Email configuration loaded');
    console.log('   📧 EMAIL_USER:', emailUser);
    console.log('   🔑 EMAIL_PASSWORD:', emailPass ? '***' + emailPass.slice(-4) : 'Not set');
}

// Import các routes
import productRoutes from './routes/productRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';

// Kết nối Database
connectDB().catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
});

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'https://deploy-livid-omega.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`\n📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

// Register Routes
console.log('📋 Registering routes...');
app.use('/api/products', productRoutes);
console.log('  ✅ /api/products registered');
app.use('/api/customers', customerRoutes);
console.log('  ✅ /api/customers registered');
app.use('/api/orders', orderRoutes);
console.log('  ✅ /api/orders registered (includes all patterns)');
app.use('/api/vouchers', voucherRoutes);
console.log('  ✅ /api/vouchers registered');

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    console.error('❌ Validation Error Details:', err.errors);
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Email đã tồn tại'
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token không hợp lệ'
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi máy chủ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server started at http://localhost:${PORT}`);
    console.log(`✅ API routes available at http://localhost:${PORT}/api`);
    console.log(`\n🎨 Design Patterns Endpoints:`);
    console.log(`   📍 GET  /api/orders/demo-patterns - Demo all patterns`);
    console.log(`   📍 POST /api/orders - Create order with patterns`);
    console.log(`   📍 GET  /api/orders/payment-methods - Strategy pattern demo`);
    console.log(`   📍 PUT  /api/orders/:id/status - Observer pattern demo`);
    console.log(`   📍 GET  /api/orders/cart-stats - Singleton pattern demo\n`);
});