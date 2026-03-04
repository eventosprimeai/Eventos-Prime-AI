import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    const harold = await prisma.user.findFirst({ where: { email: "antigravity@eventosprimeai.com" } });
    if (!harold) return;

    // Find messages written by someone else but that clearly belong to Harold AI
    const aiMessages = await prisma.taskMessage.findMany({
        where: {
            authorId: { not: harold.id },
            text: {
                contains: "Director Gabriel"
            }
        }
    });

    for (const msg of aiMessages) {
        console.log("Fixing author for message:", msg.id);
        await prisma.taskMessage.update({
            where: { id: msg.id },
            data: { authorId: harold.id }
        });
    }

    const aiMessages2 = await prisma.taskMessage.findMany({
        where: {
            authorId: { not: harold.id },
            text: {
                contains: "Comprendido"
            }
        }
    });

    for (const msg of aiMessages2) {
        console.log("Fixing author for message:", msg.id);
        await prisma.taskMessage.update({
            where: { id: msg.id },
            data: { authorId: harold.id }
        });
    }

    console.log("Done fixing DB.");
}

fix().finally(() => prisma.$disconnect());
