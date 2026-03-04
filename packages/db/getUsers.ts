import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log(users.map(u => ({ id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl })));
}

main().finally(() => prisma.$disconnect());
