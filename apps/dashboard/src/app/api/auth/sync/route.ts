import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No user found" }, { status: 401 });
        }

        // Upsert user into Prisma
        const name = user.user_metadata?.name || user.email?.split("@")[0] || "Usuario";
        const role = user.user_metadata?.role || "STAFF";
        const avatarUrl = user.user_metadata?.avatarUrl || null;

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                name,
                role,
                avatarUrl,
                // Do not update email in case it wasn't verified
            },
            create: {
                id: user.id,
                email: user.email!,
                name,
                role,
                avatarUrl,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
