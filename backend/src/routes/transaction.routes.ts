import { Router } from 'express';
import { createTransaction, getUserTransactions, getSellerStats } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createTransaction);
router.get('/:role/:userId', authenticateToken, getUserTransactions);
router.get('/stats/:sellerId', authenticateToken, getSellerStats);

export default router;
