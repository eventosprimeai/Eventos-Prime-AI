import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/team — get all users with their task counts
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const team = await prisma.user.findMany({
            where: {
                active: true,
                role: { in: ["DIRECTOR", "ADMIN", "COORDINADOR", "STAFF"] }
            },
            select: {
                id: true,
                name: true,
                role: true,
                avatarUrl: true,
                _count: {
                    select: {
                        assignedTasks: true
                    }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(team);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
