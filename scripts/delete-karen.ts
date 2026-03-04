import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching users...");
    const users = await prisma.user.findMany();
    const karen = users.find(u => u.name.toLowerCase().includes('karen'));

    if (karen) {
        console.log(`Deleting dependencies for Karen: ${karen.email}.`);

        await prisma.taskMessage.deleteMany({ where: { authorId: karen.id } });
        await prisma.evidence.deleteMany({ where: { userId: karen.id } });
        await prisma.voiceNote.deleteMany({ where: { userId: karen.id } });
        await prisma.task.deleteMany({ where: { assigneeId: karen.id } });
        await prisma.task.deleteMany({ where: { creatorId: karen.id } });

        await prisma.user.delete({ where: { id: karen.id } });
        console.log("Deleted from Prisma completely.");
    } else {
        console.log("Karen not found in the Prisma database.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
