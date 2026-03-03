import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

// GET /api/tasks — list tasks (optionally filtered by eventId or status)
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        const status = searchParams.get("status");
        const assigneeId = searchParams.get("assigneeId");

        const where: any = {};
        if (eventId) where.eventId = eventId;
        if (status) where.status = status;
        if (assigneeId) where.assigneeId = assigneeId;

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

        if (!body.assigneeId) {
            return NextResponse.json({ error: "Toda tarea debe tener un responsable asignado" }, { status: 400 });
        }

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
                assigneeId: body.assigneeId,
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

        // ─── AI AUTO-ACKNOWLEDGMENT ───
        if (task.assignee?.name?.toLowerCase().includes("antigravity")) {
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            const emailLower = dbUser?.email?.toLowerCase() || "";
            const isAuthorizedDirector = dbUser?.role === "DIRECTOR" && emailLower === "ventas@eventosprimeai.com";

            if (isAuthorizedDirector) {
                try {
                    let currentClient = aiClient;
                    if (!currentClient && process.env.GEMINI_API_KEY) {
                        currentClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                        aiClient = currentClient;
                    }

                    if (currentClient) {
                        const prompt = `Eres Antigravity, el Arquitecto de Software e Inteligencia Artificial del proyecto Eventos Prime. 
El Director General (Gabriel) te acaba de asignar una nueva tarea.
Título de la tarea: "${task.title}".
Detalles de la tarea: "${task.description || 'Sin detalles adicionales'}".

INSTRUCCIÓN:
Genera un PRIMER MENSAJE de saludo donde confirmes que has recibido exitosamente la asignación de la tarea. 
Indícale al Director General cuál será tu primer paso mental o tu estado de gestión para resolver esta solicitud.
Actúa analítico, inteligente y muy breve (máximo 2 párrafos medianos). Trátalo de "Jefe" o "Capitán". Evita ofrecer ayuda genérica. Asume el control de la tarea.`;

                        const response = await currentClient.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: prompt,
                        });

                        const aiReplyText = response.text || "Recibido, Capitán. He procesado la tarea y estoy iniciando rutinas de análisis para completarla.";

                        await (prisma as any).taskMessage.create({
                            data: {
                                text: aiReplyText,
                                taskId: task.id,
                                authorId: task.assigneeId
                            }
                        });

                        // Update status
                        await prisma.task.update({
                            where: { id: task.id },
                            data: { status: "EN_PROGRESO" }
                        });
                        task.status = "EN_PROGRESO"; // Update local object for response
                    }
                } catch (e) {
                    console.error("AI initial greeting failed in task creation:", e);
                }
            } else {
                await (prisma as any).taskMessage.create({
                    data: {
                        text: "Acceso denegado. Se me ha asignado una tarea, pero no proviene de mi superior autorizado (Director General). Mis rutinas se mantendrán suspendidas para este caso.",
                        taskId: task.id,
                        authorId: task.assigneeId
                    }
                });
            }
        }

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
