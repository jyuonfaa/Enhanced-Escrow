import { Request, Response } from 'express';
import prisma from '../prisma';

// Raise Dispute (Buyer)
export const createDispute = async (req: Request, res: Response) => {
    try {
        const transactionId = Number(req.body.transactionId);
        const initiatorId = Number(req.body.initiatorId);
        const { reason } = req.body;

        // Verify transaction exists
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        // Logic for Intelligent Status & 24h Window
        let itemStatus = 'BOUNCED'; // Default for AWAITING_OTP (rejected at door)

        if (transaction.status === 'DELIVERED') {
            itemStatus = 'RECEIVED';

            // Check 24h window
            // @ts-ignore
            if (transaction.deliveredAt) {
                const now = new Date();
                // @ts-ignore
                const deliveredAt = new Date(transaction.deliveredAt);
                const diffMs = now.getTime() - deliveredAt.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours > 24) {
                    return res.status(400).json({ message: 'Dispute window (24h) has expired for this delivered item.' });
                }
            }
        } else if (transaction.status === 'ESCROW_HELD') {
            itemStatus = 'NOT_DELIVERED';

            const now = new Date();
            const createdAt = new Date(transaction.createdAt);
            const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

            if (diffDays < 7) {
                return res.status(400).json({ message: 'You must wait 7 days before reporting a missing delivery agent.' });
            }
        } else if (transaction.status !== 'AWAITING_OTP') {
            return res.status(400).json({ message: 'Disputes can only be raised for items in delivery or recently delivered.' });
        }

        // Create dispute with inferred status
        const dispute = await prisma.dispute.create({
            data: {
                transactionId,
                initiatorId,
                reason,
                // @ts-ignore
                itemStatus,
                status: 'OPEN',
            },
        });

        // Update transaction status to DISPUTED to freeze funds
        await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'DISPUTED' },
        });

        res.status(201).json(dispute);
    } catch (error) {
        console.error('Create dispute error:', error);
        res.status(500).json({ message: 'Error raising dispute' });
    }
};

// Get All Disputes (Admin)
export const getAllDisputes = async (req: Request, res: Response) => {
    try {
        const disputes = await prisma.dispute.findMany({
            include: {
                transaction: {
                    include: {
                        product: true,
                        buyer: { select: { fullName: true, email: true, phone: true } },
                        seller: { select: { fullName: true, email: true, phone: true } },
                    },
                },
                initiator: { select: { fullName: true, role: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(disputes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching disputes' });
    }
};

// Resolve Dispute (Admin)
export const resolveDispute = async (req: Request, res: Response) => {
    try {
        const { disputeId, decision, decisionReason, adminId } = req.body; // decision: 'REFUND_BUYER' or 'RELEASE_SELLER'

        const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

        // Logic Refinement: If it's a BOUNCED item (refused at door), admin doesn't resolve.
        // It's resolved automatically when seller confirms receipt of the returned item.
        if (dispute.itemStatus === 'BOUNCED' && dispute.status === 'OPEN') {
            return res.status(400).json({
                message: 'This item was bounced (rejected at doorstep). Refund will be processed automatically once the seller confirms they have received the item back.'
            });
        }

        // Update Dispute
        const updatedDispute = await prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status: 'RESOLVED',
                decision,
                decisionReason,
                adminId,
            },
        });

        // Update Transaction based on decision
        const newTransactionStatus = decision === 'REFUND_BUYER' ? 'REFUNDED' : 'COMPLETED';

        await prisma.transaction.update({
            where: { id: dispute.transactionId },
            data: { status: newTransactionStatus },
        });

        res.json({ message: 'Dispute resolved', dispute: updatedDispute });
    } catch (error) {
        res.status(500).json({ message: 'Error resolving dispute' });
    }
};

// Seller Response to Dispute
export const respondToDispute = async (req: Request, res: Response) => {
    try {
        const { disputeId, response } = req.body;
        const authUser = (req as any).user;

        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { transaction: true }
        });

        if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

        // Verify that the user responding is the seller for this transaction
        if (dispute.transaction.sellerId !== authUser.userId) {
            return res.status(403).json({ message: 'Only the seller can respond to this dispute.' });
        }

        // Restriction: Seller cannot respond to disputes raised AFTER delivery (itemStatus === 'RECEIVED')
        if (dispute.itemStatus === 'RECEIVED') {
            return res.status(403).json({ message: 'As this dispute was raised after delivery, you cannot add a comment. Please wait for admin resolution.' });
        }

        const updatedDispute = await prisma.dispute.update({
            where: { id: disputeId },
            // @ts-ignore
            data: { sellerResponse: response }
        });

        res.json({ message: 'Response submitted successfully', dispute: updatedDispute });
    } catch (error) {
        console.error('Respond to dispute error:', error);
        res.status(500).json({ message: 'Error submitting response' });
    }
};
