import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/team — get all users with their task counts
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const isManage = searchParams.get('manage') === 'true';

        let whereClause: any = {
            email: { not: "antigravity@eventosprimeai.com" } // Harold no se muestra en el equipo
        };

        if (!isManage) {
            whereClause.active = true;
            whereClause.role = { in: ["DIRECTOR", "ADMIN", "COORDINADOR", "STAFF"] };
        }

        const team = await (prisma as any).user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                personType: true,
                category: true,
                jobTitle: true,
                avatarUrl: true,
                _count: {
                    select: {
                        assignedTasks: {
                            where: { isConsulta: false }
                        }
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
