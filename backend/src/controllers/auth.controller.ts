import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, phone, role } = req.body;

        if (!email || !password || !fullName || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                fullName,
                phone,
                role,
            },
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '24h',
        });

        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Use raw query to ensure we get isSuspended even if client is outdated
        const users: any[] = await prisma.$queryRaw`
            SELECT id, email, "passwordHash", "fullName", role, "isSuspended" 
            FROM "User" 
            WHERE email = ${email}
        `;
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
            // Check suspension status (handle DB case sensitivity)
            const isSuspended = user.isSuspended ?? user.issuspended ?? false;

            if (isSuspended) {
                return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
            }
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '24h',
        });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAgents = async (req: Request, res: Response) => {
    try {
        const agents = await prisma.user.findMany({
            where: { role: 'AGENT' },
            select: { id: true, fullName: true, email: true, phone: true }
        });
        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching agents' });
    }
};

export const createAgent = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, phone } = req.body;

        if (!email || !password || !fullName || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const agent = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                fullName,
                phone,
                role: 'AGENT',
            },
        });

        res.status(201).json({
            message: 'Agent created successfully',
            agent: { id: agent.id, email: agent.email, fullName: agent.fullName, phone: agent.phone }
        });
    } catch (error) {
        console.error('Create agent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteAgent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const agentId = Number(id);

        const user = await prisma.user.findUnique({ where: { id: agentId } });
        if (!user) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        if (user.role !== 'AGENT') {
            return res.status(400).json({ message: 'User is not a delivery agent' });
        }

        // Optional: Check if agent has active jobs before deleting
        const activeJobs = await prisma.transaction.count({
            where: { agentId, status: { not: 'COMPLETED' } }
        });

        if (activeJobs > 0) {
            return res.status(400).json({ message: 'Cannot delete agent with active delivery jobs' });
        }

        await prisma.user.delete({ where: { id: agentId } });
        res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Delete agent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
