import express from 'express';
const router = express.Router();
import{
    registerCustomer,
    loginCustomer,
    getCustomerCart,
    addItemToCart,
    removeItemFromCart,
    getCustomerProfile,
    updateUserProfile,
    updateCartItemQuantity,
    clearCart,
    forgotPassword,
    resetPassword,
}from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

console.log('📋 Customer routes loading...');

//cac routes cong khai (không cần đăng nhập)
router.post('/', registerCustomer);
router.post('/login', loginCustomer);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

console.log('  ✅ POST / (register) registered');
console.log('  ✅ POST /login registered');
console.log('  ✅ POST /forgot-password registered');
console.log('  ✅ POST /reset-password registered');

//cac routes rieng tu (cần đăng nhập)
router.route('/cart')
    .get(protect, getCustomerCart)
    .post(protect, addItemToCart)
    .put(protect, updateCartItemQuantity);

console.log('  ✅ GET /cart registered');
console.log('  ✅ POST /cart registered');
console.log('  ✅ PUT /cart registered');

//route xoa item
router.delete('/cart/:productId', protect, removeItemFromCart);

console.log('  ✅ DELETE /cart/:productId registered');

router.route('/profile')
    .get(protect, getCustomerProfile)
    .put(protect, updateUserProfile);

console.log('  ✅ GET /profile registered');
console.log('  ✅ PUT /profile registered');

console.log('✅ Customer routes loaded successfully');

export default router;