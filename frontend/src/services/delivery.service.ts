import api from './api';
import { Transaction } from './transaction.service';

export const getAgentJobs = async (agentId: number) => {
    const response = await api.get<Transaction[]>(`/delivery/agent/${agentId}`);
    return response.data;
};

export const verifyDelivery = async (data: {
    transactionId: number;
    otp: string;
    agentLat?: number;
    agentLng?: number;
}) => {
    const response = await api.post('/delivery/verify', data);
    return response.data;
};

export const uploadDeliveryPhoto = async (data: { transactionId: number; photoUrl: string }) => {
    const response = await api.post('/delivery/upload-photo', data);
    return response.data;
};

// Admin function
export const assignAgent = async (data: { transactionId: number; agentId: number }) => {
    const response = await api.post('/delivery/assign', data);
    return response.data;
};

export const confirmReturn = async (transactionId: number) => {
    const response = await api.post('/delivery/confirm-return', { transactionId });
    return response.data;
};
