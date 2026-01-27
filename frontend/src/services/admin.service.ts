import api from './api';

export interface AdminStats {
    users: number;
    transactions: number;
    products: number;
    openDisputes: number;
    escrowHeld: number;
}

export interface GlobalUser {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    isSuspended: boolean;
    createdAt: string;
}

export interface GlobalTransaction {
    id: number;
    amount: number;
    status: string;
    createdAt: string;
    product: {
        name: string;
    };
    buyer: {
        fullName: string;
        email: string;
    };
    seller: {
        fullName: string;
        email: string;
    };
    agent?: {
        fullName: string;
    };
    deliveryAddress?: string;
    buyerLat?: number;
    buyerLng?: number;
    agentLat?: number;
    agentLng?: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getAllUsers = async (): Promise<GlobalUser[]> => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const toggleUserSuspension = async (userId: number, isSuspended: boolean) => {
    const response = await api.patch(`/admin/users/${userId}/suspend`, { isSuspended });
    return response.data;
};

export const getAllTransactions = async (): Promise<GlobalTransaction[]> => {
    const response = await api.get('/admin/transactions');
    return response.data;
};
