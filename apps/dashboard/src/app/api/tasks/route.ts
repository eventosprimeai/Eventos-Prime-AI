import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/tasks — list tasks (optionally filtered by eventId or status)
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        const status = searchParams.get("status");

        const where: any = {};
        if (eventId) where.eventId = eventId;
        if (status) where.status = status;

        const tasks = await prisma.task.findMany({
            where,
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                event: { select: { id: true, name: true } },
                _count: { select: { evidence: true, voiceNotes: true, subtasks: true } },
            },
        });

        return NextResponse.json(tasks);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/tasks — create a new task
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();

        const task = await prisma.task.create({
            data: {
                title: body.title,
                description: body.description || null,
                priority: body.priority || "MEDIA",
                status: "PENDIENTE",
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                evidenceRequired: body.evidenceRequired ?? true,
                slaHours: body.slaHours || null,
                eventId: body.eventId,
                assigneeId: body.assigneeId || null,
                creatorId: user.id,
                parentId: body.parentId || null,
            },
            include: {
                assignee: { select: { id: true, name: true } },
                event: { select: { id: true, name: true } },
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Task",
                entityId: task.id,
                userId: user.id,
                changes: body,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/tasks — update task status
export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

        if (updates.status === "COMPLETADA") {
            updates.completedAt = new Date();
        }

        const task = await prisma.task.update({
            where: { id },
            data: updates,
        });

        await prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entity: "Task",
                entityId: id,
                userId: user.id,
                changes: updates,
            },
        });

        return NextResponse.json(task);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
