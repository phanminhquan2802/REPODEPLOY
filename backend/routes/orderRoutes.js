import express from 'express';
const router = express.Router();
import { 
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
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// ========================================
// PUBLIC ROUTES (Không cần đăng nhập)
// ========================================
router.get('/payment-methods', getPaymentMethods);
router.get('/demo-patterns', demoAllPatterns);

// ========================================
// ADMIN ROUTES (Cần admin)
// ========================================
router.get('/cart-stats', protect, admin, getCartStats);
router.put('/:id/deliver', protect, admin, updateOrderToDelivered);
router.put('/:id/status', protect, admin, updateOrderStatusWithObserver);

// ========================================
// USER & ADMIN ROUTES
// ========================================
router
  .route('/')
  .post(protect, addOrderItems) // User tạo đơn hàng
  .get(protect, admin, getOrders); // Admin xem tất cả đơn hàng

// ========================================
// USER ROUTES (Cần đăng nhập)
// ========================================
router.get('/myorders', protect, getMyOrders);
router.delete('/:id', protect, cancelOrder); // Hủy đơn hàng (phải đặt trước /:id)

// ========================================
// ROUTE CHUNG (Có bảo mật bên trong) - Đặt cuối cùng
// ========================================
router.get('/:id', protect, getOrderById);

export default router;