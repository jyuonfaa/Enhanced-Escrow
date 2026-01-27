import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 1. Create a Seller
    const hashedPassword = await bcrypt.hash('password123', 10);
    const seller = await prisma.user.upsert({
        where: { email: 'seller@test.com' },
        update: {},
        create: {
            email: 'seller@test.com',
            passwordHash: hashedPassword,
            fullName: 'Test Seller',
            phone: '1234567890',
            role: 'SELLER',
        },
    });

    // 1.1 Create an Admin (Specific user request)
    const adminPassword = await bcrypt.hash('12345678', 10);
    await prisma.user.upsert({
        where: { email: 'admin@gmail.com' },
        update: {},
        create: {
            email: 'admin@gmail.com',
            passwordHash: adminPassword,
            fullName: 'System Admin',
            phone: '0000000000',
            role: 'ADMIN',
        },
    });

    // 2. Create products for this seller
    await prisma.product.createMany({
        data: [
            {
                name: 'Gaming Laptop',
                description: 'High performance gaming laptop with RTX 4080',
                price: 2500,
                imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302',
                sellerId: seller.id,
            },
            {
                name: 'Wireless Headphones',
                description: 'Noise cancelling overhead headphones',
                price: 350,
                imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
                sellerId: seller.id,
            },
            {
                name: 'Minimalist Watch',
                description: 'Elegant stainless steel watch',
                price: 150,
                imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
                sellerId: seller.id,
            }
        ]
    });

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
