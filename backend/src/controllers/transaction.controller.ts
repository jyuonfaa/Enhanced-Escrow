import { Request, Response } from 'express';
import prisma from '../prisma';
import crypto from 'crypto';

// Create Transaction (Buy Action) - updated with location support
export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { buyerId, productId, sellerId, amount, deliveryAddress, buyerLat, buyerLng } = req.body;

        // 1. Create Transaction with PENDING status
        const transaction = await prisma.transaction.create({
            data: {
                buyerId,
                productId,
                sellerId,
                amount,
                status: 'PENDING',
                deliveryAddress,
                buyerLat,
                buyerLng,
            },
        });

        // 2. Simulate Payment Gateway Success (Directly move to ESCROW_HELD for prototype)
        // In real world, this happens via webhook
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status: 'ESCROW_HELD',
            },
            include: { product: true }
        });


        res.status(201).json(updatedTransaction);
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Error creating transaction' });
    }
};

// Get User Transactions (Buyer/Seller/Agent)
export const getUserTransactions = async (req: Request, res: Response) => {
    try {
        const { userId, role } = req.params;

        let whereClause = {};
        if (role === 'BUYER') whereClause = { buyerId: Number(userId) };
        else if (role === 'SELLER') whereClause = { sellerId: Number(userId) };
        else if (role === 'AGENT') whereClause = { agentId: Number(userId) };

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                product: true,
                buyer: { select: { fullName: true, phone: true } },
                seller: { select: { fullName: true, phone: true } },
                agent: { select: { fullName: true, phone: true } },
                disputes: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map transactions to handle potentially deleted products
        const enhancedTransactions = transactions.map(t => {
            const product = t.product || { name: 'Deleted Product', description: 'This product is no longer available', price: t.amount };

            let isPending = true;
            const now = new Date();

            if (t.status === 'COMPLETED' || t.status === 'RETURNED' || t.status === 'REFUNDED') {
                isPending = false;
            } else if (t.status === 'DELIVERED' && t.deliveredAt) {
                const deliveredAt = new Date(t.deliveredAt);
                const diffHours = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60);
                const hasOpenDispute = t.disputes?.some((d: any) => d.status === 'OPEN') || false;

                // If delivered over 24h ago and no open disputes, it's effectively completed
                if (diffHours > 24 && !hasOpenDispute) {
                    isPending = false;
                }
            }
            return { ...t, product, isPending };
        });

        res.json(enhancedTransactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

// Get Seller Stats (Sales Made vs Escrow Balance)
export const getSellerStats = async (req: Request, res: Response) => {
    try {
        const { sellerId } = req.params;
        const id = Number(sellerId);

        const transactions = await prisma.transaction.findMany({
            where: { sellerId: id },
            select: { amount: true, status: true, deliveredAt: true, disputes: { select: { status: true } } }
        });

        let salesMade = 0;
        let escrowBalance = 0;

        const now = new Date();

        transactions.forEach(t => {
            let isCompleted = false;

            if (t.status === 'COMPLETED') {
                isCompleted = true;
            } else if (t.status === 'DELIVERED' && t.deliveredAt) {
                const deliveredAt = new Date(t.deliveredAt);
                const diffHours = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60);
                const hasOpenDispute = t.disputes.some(d => d.status === 'OPEN');
                if (diffHours > 24 && !hasOpenDispute) {
                    isCompleted = true;
                }
            }

            if (isCompleted) {
                salesMade += t.amount;
            } else {
                // Keep inclusive of DISPUTED items that are not yet refunded
                if (['ESCROW_HELD', 'AWAITING_OTP', 'DELIVERED', 'DISPUTED'].includes(t.status)) {
                    escrowBalance += t.amount;
                }
            }
        });

        res.json({ salesMade, escrowBalance });
    } catch (error) {
        console.error('Error fetching seller stats:', error);
        res.status(500).json({ message: 'Error fetching seller stats' });
    }
};
