import { Router } from 'express';
import { register, login, getAgents, createAgent, deleteAgent } from '../controllers/auth.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/agents', authenticateToken, getAgents);
router.post('/agents', authenticateToken, authorizeRole(['ADMIN']), createAgent);
router.delete('/agents/:id', authenticateToken, authorizeRole(['ADMIN']), deleteAgent);

export default router;
