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

    console.log('4. Deleting all Users except ADMINs...');
    const deleteResult = await prisma.user.deleteMany({
        where: {
            role: {
                not: 'ADMIN'
            }
        }
    });

    console.log(`Reset complete. Removed ${deleteResult.count} non-admin users.`);

    // Ensure the main admin exists
    const adminEmail = 'admin@gmail.com';
    const adminPassword = await bcrypt.hash('12345678', 10);
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: adminPassword,
            fullName: 'System Admin',
            phone: '0000000000',
            role: 'ADMIN',
        },
    });

    const remainingUsers = await prisma.user.findMany({
        select: { id: true, email: true, role: true }
    });

    console.log('Remaining Accounts:', remainingUsers);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
