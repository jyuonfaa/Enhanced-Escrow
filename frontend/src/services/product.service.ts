import api from './api';

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    sellerId: number;
    seller?: {
        fullName: string;
    };
}

export const getProducts = async () => {
    const response = await api.get<Product[]>('/products');
    return response.data;
};

export const getSellerProducts = async (sellerId: number) => {
    const response = await api.get<Product[]>(`/products/seller/${sellerId}`);
    return response.data;
};

export const createProduct = async (productData: Partial<Product>) => {
    const response = await api.post<Product>('/products', productData);
    return response.data;
};

export const getProductById = async (id: number) => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
};

export const deleteProduct = async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const updateProduct = async (id: number, productData: Partial<Product>) => {
    const response = await api.put<Product>(`/products/${id}`, productData);
    return response.data;
};
