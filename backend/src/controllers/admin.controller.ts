import { Request, Response } from 'express';
import prisma from '../prisma';

// Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalTransactions = await prisma.transaction.count();
        const totalProducts = await prisma.product.count();
        const openDisputes = await prisma.dispute.count({ where: { status: 'OPEN' } });

        const escrowSum = await prisma.transaction.aggregate({
            where: { status: 'ESCROW_HELD' },
            _sum: { amount: true }
        });

        res.json({
            users: totalUsers,
            transactions: totalTransactions,
            products: totalProducts,
            openDisputes,
            escrowHeld: escrowSum._sum.amount || 0
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

// Get All Users
// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        let users: any[];
        try {
            users = await prisma.$queryRaw`
                SELECT id, email, "fullName", phone, role, "isSuspended", "createdAt"
                FROM "User"
                ORDER BY "createdAt" DESC
            `;
        } catch (dbError: any) {
            // Check for missing column error (Postgres 42703)
            if (dbError.code === '42703' || dbError.message.includes('does not exist')) {
                console.log('Column missing, attempting to fix...');
                await prisma.$executeRaw`
                    ALTER TABLE "User" 
                    ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false
                `;
                // Retry query
                users = await prisma.$queryRaw`
                    SELECT id, email, "fullName", phone, role, "isSuspended", "createdAt"
                    FROM "User"
                    ORDER BY "createdAt" DESC
                `;
            } else {
                throw dbError;
            }
        }

        // Ensure camelCase (Postgres raw results might be lowercase depending on driver/version)
        const mappedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            // Handle both potential casings
            fullName: u.fullName || u.fullname,
            phone: u.phone,
            role: u.role,
            isSuspended: u.isSuspended ?? u.issuspended ?? false,
            createdAt: u.createdAt || u.createdat
        }));

        res.json(mappedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Toggle User Suspension
export const toggleUserSuspension = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { isSuspended } = req.body;
        const uid = Number(userId);

        // If suspending, check for active transactions
        if (isSuspended) {
            const activeStatuses = ['PENDING', 'ESCROW_HELD', 'DELIVERED', 'DISPUTED'];

            // Check if user is buyer, seller, or agent in any active transaction
            const activeTransactionsCount = await prisma.transaction.count({
                where: {
                    status: { in: activeStatuses },
                    OR: [
                        { buyerId: uid },
                        { sellerId: uid },
                        { agentId: uid }
                    ]
                }
            });

            if (activeTransactionsCount > 0) {
                return res.status(400).json({
                    message: `Cannot suspend user. They have ${activeTransactionsCount} active transaction(s) pending completion.`
                });
            }
        }

        // Use raw query to update
        await prisma.$executeRaw`
            UPDATE "User"
            SET "isSuspended" = ${isSuspended}
            WHERE id = ${uid}
        `;

        // Fetch updated user
        const users: any[] = await prisma.$queryRaw`
            SELECT * FROM "User" WHERE id = ${uid}
        `;
        const updatedUser = users[0];

        res.json({ message: `User ${isSuspended ? 'suspended' : 'unsuspended'} successfully`, user: updatedUser });
    } catch (error) {
        console.error('Toggle suspension error:', error);
        res.status(500).json({ message: 'Error toggling user suspension' });
    }
};

// Get All Transactions (Global View)
export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                product: true,
                buyer: { select: { fullName: true, email: true } },
                seller: { select: { fullName: true, email: true } },
                agent: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};
