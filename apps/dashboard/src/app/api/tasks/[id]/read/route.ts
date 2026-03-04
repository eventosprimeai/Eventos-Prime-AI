import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// POST /api/tasks/[id]/read -- Mark all unread messages in this task as read by the user
export async function POST(request: Request, context: { params: { id: string } }) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await context.params;

        if (!id) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

        // Fetch messages that the user hasn't read
        const unreadMessages = await prisma.taskMessage.findMany({
            where: {
                taskId: id,
                authorId: { not: user.id },
                NOT: {
                    readBy: { has: user.id }
                }
            },
            select: { id: true, readBy: true }
        });

        // Prisma doesn't support array push in updateMany cleanly for PostgreSQL arrays.
        // We do it iteratively since usually it's just a few messages.
        const updatePromises = unreadMessages.map(msg => {
            return prisma.taskMessage.update({
                where: { id: msg.id },
                data: {
                    readBy: {
                        push: user.id
                    }
                }
            });
        });

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true, count: unreadMessages.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
