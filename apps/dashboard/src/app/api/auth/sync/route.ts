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

        // Do not use avatarUrl from metadata anymore
        const name = user.user_metadata?.name || user.email?.split("@")[0] || "Usuario";
        const role = user.user_metadata?.role || "STAFF";

        const dbUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {
                name,
                role: role as any,
                // We keep existing avatarUrl in DB intact
            },
            create: {
                id: user.id,
                email: user.email!,
                name,
                role: role as any,
                // Avatar will be null initially if logged in via other means
            },
        });

        return NextResponse.json({ success: true, dbUser });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
