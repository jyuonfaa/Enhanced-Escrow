import { Router } from 'express';
import { createDispute, getAllDisputes, resolveDispute, respondToDispute } from '../controllers/dispute.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/', authenticateToken, authorizeRole(['BUYER', 'SELLER', 'AGENT']), createDispute);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getAllDisputes);
router.post('/resolve', authenticateToken, authorizeRole(['ADMIN']), resolveDispute);
router.post('/respond', authenticateToken, authorizeRole(['SELLER']), respondToDispute);

export default router;
