import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load directly from .env.local to aim at Production Supabase DB keys and url
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log("-----------------------------------------");
    console.log("   EVENTOS PRIME AI - DELETE USER UTILITY");
    console.log("-----------------------------------------");

    const emailToDelete = process.argv[2];

    if (!emailToDelete) {
        console.error("❌ Error: No email provided. Usage: npx ts-node scripts/delete-user.ts [email]");
        process.exit(1);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("❌ Error: Missing Supabase credentials in .env.local");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log(`\n🔍 Searching for user with email: ${emailToDelete}...`);

    try {
        // Find user by email directly through Supabase Auth Admin API
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) throw usersError;

        const targetUser = usersData.users.find(u => u.email === emailToDelete);

        if (!targetUser) {
            console.log(`\n⚠️  No user found in Supabase Auth with email: ${emailToDelete}`);
        } else {
            console.log(`\n✅ Found user in Supabase Auth: ID ${targetUser.id}`);

            // Delete from Supabase Auth
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
            if (deleteAuthError) {
                console.error(`❌ Error deleting from Supabase Auth:`, deleteAuthError);
            } else {
                console.log(`✅ User ${emailToDelete} successfully deleted from Supabase Auth.`);
            }

            // Also delete from Prisma if exists
            try {
                const prismaUser = await prisma.user.findUnique({
                    where: { id: targetUser.id }
                });

                if (prismaUser) {
                    await prisma.user.delete({
                        where: { id: targetUser.id }
                    });
                    console.log(`✅ User ${emailToDelete} successfully deleted from Postgres (Prisma).`);
                } else {
                    console.log(`ℹ️  User ${emailToDelete} was not found in Prisma records.`);
                }
            } catch (prismaErr) {
                console.log(`ℹ️  Error sweeping Prisma (might be due to cascades or not existing): ${prismaErr}`);
            }

        }

        console.log("\n✅ Cleanup operation finished.");

    } catch (e) {
        console.error("\n❌ Fatal Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
