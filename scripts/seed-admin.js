const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'hrdtes2026';

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    console.log(`Checking if admin user exists...`);
    const existingAdmin = await prisma.user.findUnique({
        where: { username }
    });

    if (existingAdmin) {
        console.log(`Admin user already exists. Updating password...`);
        await prisma.user.update({
            where: { username },
            data: {
                password: hashedPassword,
                role: 'ADMIN' // ensure role is ADMIN
            }
        });
        console.log(`Admin user updated successfully.`);
    } else {
        console.log(`Admin user not found. Creating new admin user...`);
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name: 'Administrator',
                role: 'ADMIN'
            }
        });
        console.log(`Admin user created successfully.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
