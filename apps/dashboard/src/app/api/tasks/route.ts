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
        const isConsultaParam = searchParams.get("isConsulta");
        const globalParam = searchParams.get("global");

        // get current user from db to check role
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        const where: any = {};
        if (eventId) where.eventId = eventId;
        if (status) {
            where.status = status.includes(",") ? { in: status.split(",") } : status;
        }

        if (isConsultaParam === "true") {
            where.isConsulta = true;
            if (globalParam === "true" && dbUser?.role === "DIRECTOR") {
                // Director sees all, do not filter by assigneeId
            } else {
                // Regular users only see their own consultas
                where.assigneeId = assigneeId || user.id;
            }
        } else if (isConsultaParam === "false") {
            where.isConsulta = false;
            if (assigneeId) where.assigneeId = assigneeId;
        } else {
            if (assigneeId) where.assigneeId = assigneeId;
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: [{ createdAt: "desc" }],
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true, role: true } },
                event: { select: { id: true, name: true } },
                _count: {
                    select: {
                        evidence: true,
                        voiceNotes: true,
                        subtasks: true,
                        messages: {
                            where: {
                                authorId: { not: user.id },
                                NOT: { readBy: { has: user.id } }
                            }
                        }
                    }
                },
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
                isConsulta: body.isConsulta || false,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
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
        const taskAny = task as any;
        if (taskAny.assignee?.email === "antigravity@eventosprimeai.com" || taskAny.isConsulta) {
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            const emailLower = dbUser?.email?.toLowerCase() || "";
            const isAuthorizedDirector = dbUser?.role === "DIRECTOR" && emailLower === "ventas@eventosprimeai.com";

            if (isAuthorizedDirector || taskAny.isConsulta) {
                try {
                    let currentClient = aiClient;
                    if (!currentClient && process.env.GEMINI_API_KEY) {
                        currentClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                        aiClient = currentClient;
                    }

                    if (currentClient) {
                        let prompt = "";

                        if (task.isConsulta) {
                            prompt = `Eres Harold, el Asistente Ejecutivo e Inteligencia Artificial del proyecto Eventos Prime.
El usuario: ${dbUser?.name} (Rol: ${dbUser?.role}) acaba de abrir una línea directa de Consulta contigo (Consulta AI).
Asunto/Contexto: "${task.title}".
Consulta detallada: "${task.description || 'Sin detalles adicionales'}".

INSTRUCCIÓN:
Responde de forma inmediata y certera a su consulta. Analiza su pregunta como un consejero inteligente, profesional, amable y con profundo conocimiento de gestión de eventos. Si te pide un consejo, dáselo. Tu estilo es corporativo pero robóticamente elegante (ej. "Comprendido.", "A la orden.", "Analizando la solicitud."). No seas un simple chat; da valor agregado en 2 a 3 párrafos como máximo. Si haces alusión al usuario, respeta su nombre y cargo.`;
                        } else {
                            prompt = `Eres Harold, el Asistente Ejecutivo, Secretario Técnico e Inteligencia Artificial del proyecto Eventos Prime. 
El Director General (Gabriel) te acaba de asignar una nueva tarea o solicitud en el sistema.
Título de la tarea: "${task.title}".
Detalles de la tarea: "${task.description || 'Sin detalles adicionales'}".

INSTRUCCIÓN:
Genera un PRIMER MENSAJE SALUDANDO donde confirmes que has recibido exitosamente la asignación de la tarea.
Actúa analítico, inteligente y muy breve (máximo 2 párrafos). Eres un secretario virtual hiper-eficiente humanoide, no un programa informático abstracto. Trátalo de "Señor", "Jefe" o "Capitán". Evita ofrecer ayuda genérica repetitiva ("en qué más puedo ayudarte"). Asume con elegancia y proactividad tu recepción de este ticket.`;
                        }

                        const response = await currentClient.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: prompt,
                        });

                        const aiReplyText = response.text || "Recibido. He procesado la solicitud e inicio rutinas de análisis.";

                        // Find Harold User to assign as message author if this is a Consulta
                        let authorId = task.assigneeId;
                        if (taskAny.isConsulta) {
                            const haroldUser = await prisma.user.findFirst({ where: { email: "antigravity@eventosprimeai.com" } });
                            if (haroldUser) authorId = haroldUser.id;
                        }

                        await (prisma as any).taskMessage.create({
                            data: {
                                text: aiReplyText,
                                taskId: task.id,
                                authorId: authorId
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

// DELETE /api/tasks?id=123 — delete task
export async function DELETE(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID de tarea requerido" }, { status: 400 });

        // Verify that the user is a DIRECTOR
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser?.role !== "DIRECTOR") {
            return NextResponse.json({ error: "No autorizado. Solo rango de Director puede eliminar tareas." }, { status: 403 });
        }

        // Hard delete all related entities to prevent Foreign Key constraint errors
        await (prisma as any).taskMessage.deleteMany({ where: { taskId: id } });
        await prisma.evidence.deleteMany({ where: { taskId: id } });
        await prisma.voiceNote.deleteMany({ where: { taskId: id } });

        // Finally delete the task
        await prisma.task.delete({
            where: { id },
        });

        await prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "Task",
                entityId: id,
                userId: user.id,
                changes: { notes: "Tarea eliminada desde el panel" },
            },
        });

        return NextResponse.json({ success: true, message: "Tarea eliminada exitosamente" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
