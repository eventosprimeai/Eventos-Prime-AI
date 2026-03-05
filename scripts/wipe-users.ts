import { PrismaClient } from "@eventos-prime/db";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local from dashboard package
dotenv.config({ path: path.join(process.cwd(), 'apps', 'dashboard', '.env.local') });

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jnogbvdxsqjckvmyhioz.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function purgeAllNonEssentialUsers() {
    console.log("Fetching all users from Prisma...");
    const users = await prisma.user.findMany();

    const idsToKeep = [];
    const haroldUsers = users.filter((u: any) => u.email.toLowerCase().includes('harold') || u.name?.toLowerCase().includes('harold'));

    if (haroldUsers.length > 0) {
        idsToKeep.push(...haroldUsers.map((u: any) => u.id));
        haroldUsers.forEach(u => console.log(`Keeping user: ${u.name} (${u.email})`));
    } else {
        console.log("WARNING: NO HAROLD FOUND IN PRISMA.");
    }

    // Delete Prisma users not in idsToKeep
    if (idsToKeep.length > 0) {
        const result = await prisma.user.deleteMany({
            where: { id: { notIn: idsToKeep } }
        });
        console.log(`Deleted ${result.count} non-essential users from Prisma DB.`);
    } else {
        const result = await prisma.user.deleteMany();
        console.log(`Deleted ${result.count} users from Prisma DB.`);
    }

    // Now deal with Supabase Auth users
    console.log("Fetching Supabase Auth users...");
    const { data: { users: authUsers }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error("Error fetching Supabase users:", error);
        return;
    }

    for (const authUser of authUsers) {
        if (authUser.email?.toLowerCase().includes('harold') || authUser.user_metadata?.name?.toLowerCase().includes('harold')) {
            console.log(`Keeping SUPABASE auth user: ${authUser.email}`);
        } else {
            console.log(`Deleting SUPABASE auth user: ${authUser.email} [${authUser.id}]`);
            await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        }
    }

    console.log("\n--- PURGE COMPLETE ---");
}

purgeAllNonEssentialUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
