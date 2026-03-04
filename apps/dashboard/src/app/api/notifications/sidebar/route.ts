import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        // 1. Pending tasks assigned to me (Excluding Consultas)
        const pendingTasks = await (prisma as any).task.count({
            where: {
                assigneeId: user.id,
                status: "PENDIENTE",
                isConsulta: false
            }
        });

        // 2. Unread messages in tasks where I am assignee OR creator, AND I am not the author of the message (Excluding Consultas)
        const unreadMessages = await (prisma as any).taskMessage.count({
            where: {
                authorId: { not: user.id },
                NOT: { readBy: { has: user.id } },
                task: {
                    isConsulta: false,
                    OR: [
                        { assigneeId: user.id },
                        { creatorId: user.id }
                    ]
                }
            }
        });

        const totalCount = pendingTasks + unreadMessages;

        return NextResponse.json({ count: totalCount, pendingTasks, unreadMessages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
