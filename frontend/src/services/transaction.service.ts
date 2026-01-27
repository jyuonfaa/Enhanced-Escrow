import api from './api';
import { Product } from './product.service';

export interface Transaction {
    id: number;
    buyerId: number;
    sellerId: number;
    productId: number;
    agentId?: number;
    amount: number;
    status: string;
    escrowCode?: string;
    deliveryPhotoUrl?: string;
    deliveredAt?: string;
    createdAt: string;
    product: Product;
    buyer?: { fullName: string; phone: string };
    seller?: { fullName: string; phone: string };
    agent?: { fullName: string; phone: string };
    disputes?: any[];
    deliveryAddress?: string;
    buyerLat?: number;
    buyerLng?: number;
    agentLat?: number;
    agentLng?: number;
    isPending?: boolean;
}

export const createTransaction = async (data: {
    buyerId: number;
    sellerId: number;
    productId: number;
    amount: number;
    deliveryAddress: string;
    buyerLat?: number;
    buyerLng?: number;
}) => {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
};

export const getUserTransactions = async (userId: number, role: string) => {
    const response = await api.get<Transaction[]>(`/transactions/${role}/${userId}`);
    return response.data;
};

export const getSellerStats = async (sellerId: number) => {
    const response = await api.get<{ salesMade: number; escrowBalance: number }>(`/transactions/stats/${sellerId}`);
    return response.data;
};
