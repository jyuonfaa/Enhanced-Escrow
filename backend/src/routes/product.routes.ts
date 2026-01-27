import { Router } from 'express';
import { createProduct, getAllProducts, getSellerProducts, getProductById, deleteProduct, updateProduct } from '../controllers/product.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/', authenticateToken, authorizeRole(['SELLER']), createProduct);
router.get('/seller/:sellerId', authenticateToken, authorizeRole(['SELLER', 'ADMIN']), getSellerProducts);
router.put('/:id', authenticateToken, authorizeRole(['SELLER']), updateProduct);
router.delete('/:id', authenticateToken, authorizeRole(['SELLER', 'ADMIN']), deleteProduct);

export default router;
