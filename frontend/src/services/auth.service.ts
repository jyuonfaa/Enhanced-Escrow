import api from './api';

export interface User {
    id: number;
    email: string;
    fullName: string;
    role: string;
}

export const getAgents = async () => {
    const response = await api.get<User[]>('/auth/agents');
    return response.data;
};

export const createAgent = async (data: any) => {
    const response = await api.post('/auth/agents', data);
    return response.data;
};

export const deleteAgent = async (id: number) => {
    const response = await api.delete(`/auth/agents/${id}`);
    return response.data;
};
