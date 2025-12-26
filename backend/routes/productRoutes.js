import express from 'express';
const router = express.Router();
import {
    getProducts,
    getProductById,
    getAllProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// ⚠️ QUAN TRỌNG: Route cụ thể phải đặt TRƯỚC route động /:id
// Admin routes (đặt trước)
router.get('/admin/all', protect, admin, getAllProductsAdmin);

// Public routes
router.get('/', getProducts);                      // GET /api/products?keyword=...&category=...
router.get('/:id', getProductById);                // GET /api/products/:id

// Admin CRUD routes
router.post('/', protect, admin, createProduct);                  // POST /api/products
router.put('/:id', protect, admin, updateProduct);                // PUT /api/products/:id
router.put('/:id/stock', protect, admin, updateProductStock);     // PUT /api/products/:id/stock
router.delete('/:id', protect, admin, deleteProduct);             // DELETE /api/products/:id

export default router;