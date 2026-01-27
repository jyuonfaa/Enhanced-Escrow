import { Router } from 'express';
import { assignAgent, getAgentJobs, verifyDelivery, uploadDeliveryPhoto, confirmReturnReceived } from '../controllers/delivery.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/assign', authenticateToken, authorizeRole(['ADMIN', 'SELLER']), assignAgent);
router.get('/agent/:agentId', authenticateToken, authorizeRole(['AGENT', 'ADMIN']), getAgentJobs);
router.post('/upload-photo', authenticateToken, authorizeRole(['AGENT']), uploadDeliveryPhoto);
router.post('/verify', authenticateToken, authorizeRole(['AGENT']), verifyDelivery);
router.post('/confirm-return', authenticateToken, authorizeRole(['SELLER']), confirmReturnReceived);

export default router;
