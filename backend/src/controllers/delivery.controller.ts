import { Request, Response } from 'express';
import prisma from '../prisma';
import crypto from 'crypto';

// Assign Agent (Admin Only functionality ideally, or simplified for prototype)
export const assignAgent = async (req: Request, res: Response) => {
    try {
        const { transactionId, agentId } = req.body;

        // 1. Verify transaction exists and belongs to the seller (if not admin)
        const transactionExists = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { product: true }
        });
        if (!transactionExists) return res.status(404).json({ message: 'Transaction not found' });

        const authUser = (req as any).user;
        if (authUser.role === 'SELLER' && transactionExists.sellerId !== authUser.userId) {
            return res.status(403).json({ message: 'Unauthorized. You can only assign agents to your own sales.' });
        }

        // 2. Verify agent role and suspension status
        const agent = await prisma.user.findUnique({
            where: { id: agentId }
        });
        if (!agent || agent.role !== 'AGENT') {
            return res.status(400).json({ message: 'User is not a valid delivery agent' });
        }
        if (agent.isSuspended) {
            return res.status(400).json({ message: 'This agent is suspended and cannot be assigned jobs.' });
        }

        const transaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: { agentId },
            include: { product: true, buyer: true, seller: true }
        });

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error assigning agent' });
    }
};

// Get Agent Jobs
export const getAgentJobs = async (req: Request, res: Response) => {
    try {
        const { agentId } = req.params;
        const transactions = await prisma.transaction.findMany({
            where: {
                agentId: Number(agentId),
                status: { notIn: ['DELIVERED', 'COMPLETED', 'RETURNED', 'REFUNDED'] }
            }, // Show active jobs and returns in progress
            include: {
                product: true,
                buyer: { select: { fullName: true, phone: true, email: true } }, // Agent needs buyer contact
                seller: { select: { fullName: true, phone: true } },
            },
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

// Step 1: Upload Photo Proof (Generates OTP)
export const uploadDeliveryPhoto = async (req: Request, res: Response) => {
    try {
        console.log('Upload Delivery Photo Request Body:', req.body);
        const transactionId = Number(req.body.transactionId);
        const { photoUrl } = req.body;

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        console.log('Found Transaction for Photo Upload:', transaction);

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        if (transaction.status !== 'ESCROW_HELD') {
            console.log(`Status Mismatch: Expected [ESCROW_HELD], Got [${transaction.status}]`);
            return res.status(400).json({ message: 'Transaction is not in correct state for delivery proof' });
        }

        // Generate 6-digit OTP only now
        const otp = crypto.randomInt(100000, 999999).toString();

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                deliveryPhotoUrl: photoUrl,
                escrowCode: otp,
                status: 'AWAITING_OTP', // New status for intermediate step
            },
        });

        res.json({ message: 'Photo uploaded. OTP sent to buyer.', transaction: updatedTransaction });
    } catch (error: any) {
        res.status(500).json({ message: 'Error uploading delivery proof' });
    }
};

// Step 2: Verify Delivery (Agent enters buyer OTP)
export const verifyDelivery = async (req: Request, res: Response) => {
    try {
        const transactionId = Number(req.body.transactionId);
        const otp = String(req.body.otp).trim();
        const { agentLat, agentLng } = req.body;

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        if (transaction.status !== 'AWAITING_OTP') {
            return res.status(400).json({ message: 'Agent must upload a photo proof first.' });
        }

        if (transaction.escrowCode !== otp) {
            console.log(`OTP Mismatch: Expected [${transaction.escrowCode}], Got [${otp}]`);
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // verification success: Move to DELIVERED (starts 24h dispute window)
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: 'DELIVERED',
                // @ts-ignore
                deliveredAt: new Date(),
                agentLat,
                agentLng,
            },
        });

        res.json({ message: 'Delivery verified and funds released', transaction: updatedTransaction });
    } catch (error: any) {
        res.status(500).json({ message: 'Error verifying delivery' });
    }
};

// Step 3: Confirm Return Received (Seller marks as returned)
export const confirmReturnReceived = async (req: Request, res: Response) => {
    try {
        const transactionId = Number(req.body.transactionId);
        const authUser = (req as any).user;

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        // Only the seller of the product can mark it as returned
        if (transaction.sellerId !== authUser.userId) {
            return res.status(403).json({ message: 'Only the seller can confirm item return.' });
        }

        if (transaction.status !== 'DISPUTED' && transaction.status !== 'REFUNDED') {
            return res.status(400).json({ message: 'Return can only be confirmed for disputed or refunded transactions.' });
        }

        // Check if there is an open "BOUNCED" dispute for this transaction
        const openDispute = await prisma.dispute.findFirst({
            where: {
                transactionId,
                status: 'OPEN',
                itemStatus: 'BOUNCED'
            }
        });

        // If it's a bounce, seller confirmation automatically triggers the refund
        const newStatus = openDispute ? 'REFUNDED' : 'RETURNED';

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: newStatus,
            },
        });

        // Automatically resolve the dispute if it was a bounce
        if (openDispute) {
            await prisma.dispute.update({
                where: { id: openDispute.id },
                data: {
                    status: 'RESOLVED',
                    decision: 'REFUND_BUYER',
                    decisionReason: 'Seller confirmed receipt of bounced item.',
                }
            });
        }

        res.json({
            message: openDispute ? 'Return confirmed and refund processed automatically.' : 'Item return confirmed',
            transaction: updatedTransaction
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error confirming return' });
    }
};
