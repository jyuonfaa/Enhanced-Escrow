import api from './api';
import { Transaction } from './transaction.service';

export interface Dispute {
    id: number;
    transactionId: number;
    initiatorId: number;
    reason: string;
    sellerResponse?: string;
    itemStatus?: string; // RECEIVED, BOUNCED
    status: string; // OPEN, RESOLVED
    decision?: string; // REFUND_BUYER, RELEASE_SELLER
    decisionReason?: string;
    createdAt: string;
    updatedAt: string;
    transaction?: Transaction;
    initiator?: {
        fullName: string;
        role: string;
        phone: string;
    }
}

export const createDispute = async (data: { transactionId: number; initiatorId: number; reason: string }) => {
    const response = await api.post('/disputes', data);
    return response.data;
};

export const getAllDisputes = async () => {
    const response = await api.get<Dispute[]>('/disputes');
    return response.data;
};

export const resolveDispute = async (data: { disputeId: number; decision: string; decisionReason: string; adminId: number }) => {
    const response = await api.post('/disputes/resolve', data);
    return response.data;
};

export const respondToDispute = async (data: { disputeId: number; response: string }) => {
    const response = await api.post('/disputes/respond', data);
    return response.data;
};
