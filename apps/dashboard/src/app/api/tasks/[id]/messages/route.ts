import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const params = await context.params;
        const taskId = params.id;

        const messages = await (prisma as any).taskMessage.findMany({
            where: { taskId },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true, role: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json(messages);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const params = await context.params;
        const taskId = params.id;
        const body = await request.json();
        const { text } = body;

        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
        }

        // 1. Create the message
        const message = await (prisma as any).taskMessage.create({
            data: {
                text,
                taskId,
                authorId: user.id
            },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true, role: true } }
            }
        });

        // 2. Check for completion hotword
        const lowerText = text.toLowerCase();
        let taskCompleted = false;

        if (lowerText.includes("felicidades") && lowerText.includes("tarea completada")) {
            // Update task status to completada
            await prisma.task.update({
                where: { id: taskId },
                data: { status: "COMPLETADA", completedAt: new Date() }
            });

            // Log it
            await prisma.auditLog.create({
                data: {
                    action: "UPDATE",
                    entity: "Task",
                    entityId: taskId,
                    userId: user.id,
                    changes: { status: "COMPLETADA", note: "Auto-completada vía chat de IA" }
                }
            });
            taskCompleted = true;
        }

        return NextResponse.json({ success: true, message, taskCompleted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
