import { PrismaClient } from '../packages/db/node_modules/@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data wipe...');

    // Delete all transactional data related to tasks, events, sponsors, etc.
    // Order of deletion needs to respect foreign key constraints

    await prisma.taskMessage.deleteMany({});
    await prisma.evidence.deleteMany({});
    await prisma.voiceNote.deleteMany({});

    await prisma.aIChatMessage.deleteMany({});
    await prisma.generatedDocument.deleteMany({});

    await prisma.bankStatementEntry.deleteMany({});
    await prisma.bankStatement.deleteMany({});

    await prisma.financialTransaction.deleteMany({});
    await prisma.financialAccount.deleteMany({});

    await prisma.budgetLine.deleteMany({});

    await prisma.checkIn.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.ticket.deleteMany({});

    await prisma.checklistItem.deleteMany({});
    await prisma.checklist.deleteMany({});

    await prisma.supplierOrder.deleteMany({});
    await prisma.supplier.deleteMany({});

    await prisma.sponsorDeal.deleteMany({});
    await prisma.sponsor.deleteMany({});

    await prisma.incident.deleteMany({});

    await prisma.gpsLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});

    // Since tasks can have subtasks, parent/child relationships
    // Instead of deleting one by one, we can execute a raw query to truncate or just deleteMany starting from lowest level but deleteMany works.
    console.log('Deleting tasks (handling self-relations)...');
    await prisma.$executeRaw`TRUNCATE TABLE tasks CASCADE;`

    console.log('Deleting events...');
    // Event has relations to a lot, if any left, clear them. CASCADE handled tasks.
    await prisma.$executeRaw`TRUNCATE TABLE events CASCADE;`

    console.log('Data wipe complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
