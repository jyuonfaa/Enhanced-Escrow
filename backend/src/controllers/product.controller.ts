import { Request, Response } from 'express';
import prisma from '../prisma';

// Create Product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, imageUrl, sellerId } = req.body;
        const authUser = (req as any).user;
        const sellerIdNum = Number(sellerId);

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 1) {
            return res.status(400).json({ message: 'Price must be at least 1 GHS.' });
        }

        // Security: Ensure the authenticated user matches the sellerId in the body
        // and that the user actually has the SELLER role.
        const seller = await prisma.user.findUnique({ where: { id: sellerIdNum } });

        if (!seller || seller.role !== 'SELLER') {
            return res.status(403).json({ message: 'Only users with the SELLER role can list products.' });
        }

        if (authUser.role !== 'ADMIN' && authUser.userId !== sellerIdNum) {
            return res.status(403).json({ message: 'Unauthorized. You can only list products for your own account.' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parsedPrice,
                imageUrl,
                sellerId: sellerIdNum,
            },
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
};

// Get All Products (for Buyers)
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                seller: {
                    isSuspended: false
                }
            },
            include: { seller: { select: { fullName: true, email: true, isSuspended: true } } },
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Get Seller Products
export const getSellerProducts = async (req: Request, res: Response) => {
    try {
        const { sellerId } = req.params;
        const products = await prisma.product.findMany({
            where: { sellerId: Number(sellerId) },
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching seller products' });
    }
};

// Get Single Product
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: { seller: { select: { fullName: true, isSuspended: true } } },
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Hide if seller is suspended
        if (product.seller.isSuspended) {
            return res.status(403).json({ message: 'Product is currently unavailable' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product' });
    }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Ownership check
        const product = await prisma.product.findUnique({ where: { id: Number(id) } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const authUser = (req as any).user;
        if (authUser.role === 'SELLER' && product.sellerId !== authUser.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await prisma.product.delete({ where: { id: Number(id) } });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, imageUrl } = req.body;

        // Ownership check
        const product = await prisma.product.findUnique({ where: { id: Number(id) } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const authUser = (req as any).user;
        if (authUser.role === 'SELLER' && product.sellerId !== authUser.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        let parsedPrice;
        if (price !== undefined) {
            parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 1) {
                return res.status(400).json({ message: 'Price must be at least 1 GHS.' });
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name,
                description,
                price: parsedPrice,
                imageUrl,
            },
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
};
