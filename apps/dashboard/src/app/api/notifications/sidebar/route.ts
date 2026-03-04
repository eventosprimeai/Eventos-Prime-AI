import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        // 1. Pending tasks assigned to me
        const pendingTasks = await prisma.task.count({
            where: {
                assigneeId: user.id,
                status: "PENDIENTE"
            }
        });

        // 2. Unread messages in tasks where I am assignee OR creator, AND I am not the author of the message
        const unreadMessages = await prisma.taskMessage.count({
            where: {
                authorId: { not: user.id },
                NOT: { readBy: { has: user.id } },
                task: {
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
