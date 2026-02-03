import { Router } from 'express';
import { getDashboardStats, getAllUsers, toggleUserSuspension, getAllTransactions, getAdminAgents } from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:userId/suspend', toggleUserSuspension);
router.get('/transactions', getAllTransactions);
router.get('/agents', getAdminAgents);

export default router;
