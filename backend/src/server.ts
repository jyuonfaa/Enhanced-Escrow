import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import transactionRoutes from './routes/transaction.routes';
import deliveryRoutes from './routes/delivery.routes';
import disputeRoutes from './routes/dispute.routes';
import adminRoutes from './routes/admin.routes';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);

import { Request, Response } from 'express';

import prisma from './prisma';

// Health Check with DB
app.get('/api/health-db', async (req: Request, res: Response) => {
  try {
    const count = await prisma.user.count();
    res.json({ status: 'healthy', database: 'connected', users: count });
  } catch (error: any) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
