import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data wipe to leave the system as new (keeping structures and functions)...');

    const tablesToTruncate = [
        'events', 'tasks', 'task_messages', 'evidence', 'voice_notes',
        'sponsors', 'sponsor_deals', 'suppliers', 'supplier_orders',
        'tickets', 'checkins', 'payments', 'checklists', 'checklist_items',
        'gps_logs', 'incidents', 'notifications', 'audit_logs',
        'financial_accounts', 'financial_transactions', 'budget_lines',
        'bank_statements', 'bank_statement_entries', 'generated_documents', 'ai_chat_messages'
    ];

    console.log(`Truncating tables: ${tablesToTruncate.join(', ')}`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablesToTruncate.map(t => `"${t}"`).join(', ')} CASCADE;`);

    console.log('Data wipe successful! Database is now clean.');
}

main()
    .catch((e) => {
        console.error('Error during wipe:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
