import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RESETTING DATABASE ---');

    console.log('1. Deleting all Disputes...');
    await prisma.dispute.deleteMany({});

    console.log('2. Deleting all Transactions...');
    await prisma.transaction.deleteMany({});

    console.log('3. Deleting all Products...');
    await prisma.product.deleteMany({});

    console.log('4. Deleting all Users...');
    await prisma.user.deleteMany({});

    const passwordHash = await bcrypt.hash('12345678', 10);

    console.log('5. Creating Default Test Users...');
    
    // Create Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@gmail.com',
            passwordHash,
            fullName: 'System Administrator',
            phone: '0000000000',
            role: 'ADMIN',
        },
    });

    // Create Seller
    const seller = await prisma.user.create({
        data: {
            email: 'seller@gmail.com',
            passwordHash,
            fullName: 'John Seller',
            phone: '0123456789',
            role: 'SELLER',
        },
    });

    // Create Buyer
    const buyer = await prisma.user.create({
        data: {
            email: 'buyer@gmail.com',
            passwordHash,
            fullName: 'Alice Buyer',
            phone: '0987654321',
            role: 'BUYER',
        },
    });

    // Create Agent
    const agent = await prisma.user.create({
        data: {
            email: 'agent@gmail.com',
            passwordHash,
            fullName: 'Flash Courier',
            phone: '0555555555',
            role: 'AGENT',
        },
    });

    console.log('6. Creating Sample Products...');
    await prisma.product.createMany({
        data: [
            {
                name: 'iPhone 15 Pro',
                description: 'Titanium design, A17 Pro chip. Excellent condition.',
                price: 999.99,
                imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=400',
                sellerId: seller.id,
            },
            {
                name: 'MacBook Air M2',
                description: 'Midnight color, 8GB RAM, 256GB SSD.',
                price: 1199.00,
                imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?auto=format&fit=crop&q=80&w=400',
                sellerId: seller.id,
            },
            {
                name: 'Sony WH-1000XM5',
                description: 'Industry-leading noise canceling headphones.',
                price: 349.99,
                imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&q=80&w=400',
                sellerId: seller.id,
            }
        ]
    });

    console.log('--- SEEDING COMPLETE ---');
    console.log('Accounts Created:');
    console.log('- admin@gmail.com (ADMIN)');
    console.log('- seller@gmail.com (SELLER)');
    console.log('- buyer@gmail.com (BUYER)');
    console.log('- agent@gmail.com (AGENT)');
    console.log('Password for all: 12345678');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
