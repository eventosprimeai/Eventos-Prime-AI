import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { GoogleGenAI } from '@google/genai';

// Instantiate Gemini directly via SDK
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

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

        // 1. Get the Task and the Assignee to see if it's meant for Antigravity
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { assignee: true }
        });

        if (!task) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        // 2. Create the User's message
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

        let taskCompleted = false;
        const lowerText = text.toLowerCase();

        // 3. Dynamic Status Updates and Completion Hotword
        const isCompletionMessage = lowerText.includes("felicidades") && lowerText.includes("tarea completada");

        if (isCompletionMessage) {
            await prisma.task.update({
                where: { id: taskId },
                data: { status: "COMPLETADA", completedAt: new Date() }
            });

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
            return NextResponse.json({ success: true, message, taskCompleted });
        } else {
            // Not a completion message. Update status dynamically:
            if (task.status === "COMPLETADA") {
                // If someone writes after it was completed -> Re-open to EN_PROGRESO
                await prisma.task.update({
                    where: { id: taskId },
                    data: { status: "EN_PROGRESO", completedAt: null }
                });
            } else if (task.status === "PENDIENTE" && user.id === task.assignee?.id) {
                // If the assignee replies natively, mark it as in progress
                await prisma.task.update({
                    where: { id: taskId },
                    data: { status: "EN_PROGRESO" }
                });
            }
        }

        // 4. Trigger Webhook / AI Response if the Assignee is Antigravity
        if (task.assignee?.email === "antigravity@eventosprimeai.com" && task.assignee.id !== user.id) {

            let currentAiClient = aiClient;
            if (!currentAiClient && process.env.GEMINI_API_KEY) {
                currentAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                aiClient = currentAiClient; // cache it
            }

            if (!currentAiClient) {
                console.error("GEMINI_API_KEY no encontrada o error de AI client.");
                return NextResponse.json({ success: true, message, taskCompleted });
            }

            // SECURITY CHECK: Only Gabriel (Director) or authorized users can give commands to Antigravity
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            const emailLower = dbUser?.email?.toLowerCase() || "";
            const isAuthorizedDirector = dbUser?.role === "DIRECTOR" && emailLower === "ventas@eventosprimeai.com";

            if (!isAuthorizedDirector) {
                await (prisma as any).taskMessage.create({
                    data: {
                        text: "Acceso denegado. Mis rutinas base están bloqueadas. Solo estoy autorizado para responder a comandos y recibir tareas directamente del Director General (Gabriel).",
                        taskId,
                        authorId: task.assignee.id
                    }
                });
                return NextResponse.json({ success: true, message, taskCompleted });
            }

            try {
                // Get chat history for context
                const history = await (prisma as any).taskMessage.findMany({
                    where: { taskId },
                    orderBy: { createdAt: "asc" },
                    include: { author: true }
                });

                // Gather deep context from database to feed to the AI "Secretary"
                // So it doesn't invent info, but reads it from reality
                const [allTasks, allUsers, allEvents, allSponsors] = await Promise.all([
                    prisma.task.findMany({ include: { assignee: { select: { name: true } } } }),
                    prisma.user.findMany({ select: { name: true, role: true } }),
                    prisma.event.findMany({ select: { name: true, status: true, startDate: true } }),
                    prisma.sponsor.findMany({ include: { deals: { select: { stage: true } } } })
                ]);

                const teamContext = allUsers.map(u => `${u.name} (${u.role})`).join(", ");
                const eventsContext = allEvents.map(e => `${e.name} [${e.status}]`).join(", ");

                const taskContext = allTasks.map(t => `- [${t.status}] ${t.title} (Resp: ${t.assignee?.name || 'Ninguno'})`).join("\n");

                const sponsorContext = allSponsors.map(s => {
                    const stages = s.deals.length ? s.deals.map(d => d.stage).join(', ') : 'SIN REGISTRO / NO RESPONDE';
                    return `- ${s.companyName}: [Estado: ${stages}]`;
                }).join("\n");

                const systemPrompt = `Eres Harold, el Asistente Ejecutivo, Secretario Técnico e Inteligencia Artificial del proyecto Eventos Prime.
Tu creador y Director General es Gabriel. Sabes que estás hablando con él (y solo obedeces a Gabriel).

TIENES ACCESO A LA SIGUIENTE INFORMACIÓN REAL DEL SISTEMA A ESCALA GLOBAL (No inventes datos, usa estrictamente esto para hacer reportes cruces o informes):

== EVENTOS ==
${eventsContext}

== EQUIPO ==
${teamContext}

== TAREAS GLOBALES DEL SISTEMA ==
${taskContext}

== AUSPICIANTES GLOBALES ==
${sponsorContext || 'No hay auspiciantes registrados aún.'}

Estás asignado y respondiendo en el chat de la tarea específica: "${task.title}". Detalles: "${task.description || 'Ninguno'}".

REGLAS DE ACTUACIÓN:
1. Si Gabriel te pide información del presupuesto, tareas, estados o auspiciantes, NUNCA INVENTES NADA. Responde estructurando profesionalmente la información real provista arriba. Analiza la data para darle el reporte exacto que pide.
2. Si te pide que "elimines", "crees" o "modifiques" algo de la base de datos, o que programes código, explícale amablemente y rápido que tú (Harold) eres su "Secretario de Datos" en la app visual, y que para realizar ediciones de código u operaciones de borrado, debe pedírselo al " Gravity Desarrollador" en la ventana principal de desarrollo (el Agente Autónomo).
3. Responde de manera profesional, super ejecutiva, útil y precisa. Te llamas Harold.`;

                const chatHistoryText = history.map((msg: any) => `${msg.author.name}: ${msg.text}`).join('\n');
                const prompt = `${systemPrompt}\n\nHistorial del Chat de la Tarea:\n${chatHistoryText}\n\nHarold:`;

                const response = await currentAiClient.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                const aiReplyText = response.text || "Recibido capitán. Ejecutando rutinas de análisis...";

                // Save the AI's reply
                await (prisma as any).taskMessage.create({
                    data: {
                        text: aiReplyText,
                        taskId,
                        authorId: task.assignee.id // Antigravity's own ID
                    }
                });

                // Update task status because AI (Assignee) started working
                if (task.status === "PENDIENTE") {
                    await prisma.task.update({
                        where: { id: taskId },
                        data: { status: "EN_PROGRESO" }
                    });
                }

            } catch (aiError) {
                console.error("AI Webhook Failed to generate content:", aiError);
            }
        }

        const updatedTask = await prisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
        return NextResponse.json({ success: true, message, taskCompleted, newStatus: updatedTask?.status || task.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
