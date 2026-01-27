import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number; role: string };
        console.log(`AuthenticateToken: Decoded token for user [${decoded.userId}] with role [${decoded.role}]`);
        (req as AuthRequest).user = decoded;
        next();
    } catch (error) {
        console.error('AuthenticateToken: Invalid token error:', error);
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;
        if (!user) {
            console.log('AuthorizeRole: No user found in request');
            return res.sendStatus(401);
        }

        console.log(`AuthorizeRole: Checking access for role [${user.role}] against allowed roles [${roles.join(', ')}]`);
        if (!roles.includes(user.role)) {
            console.log(`AuthorizeRole: ACCESS DENIED for role [${user.role}]`);
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }

        console.log(`AuthorizeRole: ACCESS GRANTED for role [${user.role}]`);
        next();
    };
};
