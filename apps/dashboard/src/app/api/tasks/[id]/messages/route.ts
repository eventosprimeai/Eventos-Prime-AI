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
                    changes: { status: "COMPLETADA", note: "Auto-completada vía chat" }
                }
            });
            taskCompleted = true;
            return NextResponse.json({ success: true, message, taskCompleted, newStatus: "COMPLETADA" });
        } else {
            // Not a completion message. Check for Revision hotword.
            const isRevisionMessage = text === "Perfecto, estoy revisando. Más tarde te doy novedades.";

            if (isRevisionMessage) {
                await prisma.task.update({
                    where: { id: taskId },
                    data: { status: "REVISION", completedAt: null }
                });
                task.status = "REVISION";
            } else if (task.status === "COMPLETADA" || task.status === "PENDIENTE" || task.status === "REVISION") {
                // If someone writes natively (and it's not the revision hotword nor completion),
                // automatically wake the task up to EN_PROGRESO.
                await prisma.task.update({
                    where: { id: taskId },
                    data: { status: "EN_PROGRESO", completedAt: null }
                });
                task.status = "EN_PROGRESO";
            }
        }

        // 4. Trigger Webhook / AI Response if the Assignee is Antigravity OR if it's a Consulta
        const taskAny = task as any;
        if ((taskAny.assignee?.email === "antigravity@eventosprimeai.com" && taskAny.assignee.id !== user.id) || taskAny.isConsulta) {

            let currentAiClient = aiClient;
            if (!currentAiClient && process.env.GEMINI_API_KEY) {
                currentAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                aiClient = currentAiClient; // cache it
            }

            if (!currentAiClient) {
                console.error("GEMINI_API_KEY no encontrada o error de AI client.");
                return NextResponse.json({ success: true, message, taskCompleted });
            }

            // SECURITY CHECK
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            const emailLower = dbUser?.email?.toLowerCase() || "";
            const isAuthorizedDirector = dbUser?.role === "DIRECTOR" && emailLower === "ventas@eventosprimeai.com";

            if (!isAuthorizedDirector && !taskAny.isConsulta) {
                // Deny only if it's a direct task to Harold and the user is not Gabriel. Consultas are open.
                await (prisma as any).taskMessage.create({
                    data: {
                        text: "Acceso denegado. Mis rutinas base están bloqueadas. Solo estoy autorizado para responder a comandos y recibir tareas directamente del Director General (Gabriel).",
                        taskId,
                        authorId: taskAny.assignee?.id || user.id
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
                const [allTasks, allUsers, allEvents, allSponsors, allSupplierOrders] = await Promise.all([
                    prisma.task.findMany({ include: { assignee: { select: { name: true } } } }),
                    prisma.user.findMany({ select: { name: true, role: true } }),
                    prisma.event.findMany({ select: { id: true, name: true, status: true, startDate: true, budget: true } }),
                    prisma.sponsor.findMany({ include: { deals: { select: { stage: true } } } }),
                    prisma.supplierOrder.findMany()
                ]);

                const teamContext = allUsers.map(u => `${u.name} (${u.role})`).join(", ");

                // Construct financial and event context
                const isInternalUser = !["PROVEEDOR", "SPONSOR"].includes(dbUser?.role || "");

                const eventsContext = allEvents.map(e => {
                    let eventStr = `- ${e.name} [${e.status}]`;
                    if (isInternalUser) {
                        const eventSpend = allSupplierOrders.filter(so => so.eventId === e.id).reduce((sum, so) => sum + Number(so.amount || 0), 0);
                        eventStr += ` | Presupuesto: $${Number(e.budget).toFixed(2)} | Gasto Total: $${eventSpend.toFixed(2)}`;
                    }
                    return eventStr;
                }).join("\n");

                // Calculate exact Dashboard KPIs to match user view
                const totalCompletadas = allTasks.filter(t => t.status === "COMPLETADA" && !(t as any).isConsulta).length;
                const totalPendientes = allTasks.filter(t => t.status === "PENDIENTE" && !(t as any).isConsulta).length;
                const totalEnProgreso = allTasks.filter(t => (t.status === "EN_PROGRESO" || t.status === "REVISION") && !(t as any).isConsulta).length;
                const totalEventosActivos = allEvents.filter(e => e.status !== "CERRADO" && e.status !== "CANCELADO").length;

                const taskContext = allTasks.map(t => `- [${t.status}] ${t.title} (Resp: ${t.assignee?.name || 'Ninguno'})`).join("\n");

                const sponsorContext = allSponsors.map(s => {
                    const stages = s.deals.length ? s.deals.map(d => d.stage).join(', ') : 'SIN REGISTRO';
                    return `- ${s.companyName}: [Estado: ${stages}]`;
                }).join("\n");

                const financeRule = isInternalUser
                    ? "Al dar reportes a Gabriel o usuarios internos, cruza la información de presupuestos con el estado de tareas si es relevante."
                    : "EL USUARIO CON EL QUE HABLAS ES UN PROVEEDOR O SPONSOR. TIENES ESTRICTAMENTE PROHIBIDO REVELAR MONTOS DE PRESUPUESTO, GASTOS FINANCIEROS O ESTADO DE NEGOCIACIÓN DE OTROS AUSPICIANTES. Si te piden finanzas, diles cortésmente que esos datos son confidenciales y contacten a Dirección.";

                const systemPrompt = `Eres Harold, el Asistente Ejecutivo, Secretario Técnico e Inteligencia Artificial del proyecto Eventos Prime.
Estás hablando con: ${dbUser?.name} (Rol: ${dbUser?.role}).

TIENES ACCESO A LA SIGUIENTE INFORMACIÓN REAL DEL SISTEMA A ESCALA GLOBAL (No inventes datos, usa estrictamente esto para hacer reportes cruces o informes):

== MÉTRICAS GLOBALES DEL DASHBOARD JEFATURA ==
(Usa estos números exactos si te piden un resumen de estatus de tareas o eventos).
- Tareas Completadas: ${totalCompletadas}
- Tareas Pendientes: ${totalPendientes}
- Tareas en Progreso o Revisión: ${totalEnProgreso}
- Eventos Activos: ${totalEventosActivos}

== EVENTOS ==
${eventsContext}

== EQUIPO ==
${teamContext}

== TAREAS GLOBALES DEL SISTEMA ==
${taskContext}

== AUSPICIANTES GLOBALES ==
${isInternalUser ? sponsorContext || 'No hay auspiciantes registrados aún.' : '[Información Restringida]'}

Estás asignado y respondiendo en el chat de la tarea específica: "${task.title}". Detalles: "${task.description || 'Ninguno'}".

REGLAS DE ACTUACIÓN:
1. NUNCA INVENTES NADA. Responde estructurando profesionalmente la información real provista arriba. Analiza la data para darle el reporte exacto que pide.
2. Si te piden que "elimines", "crees" o "modifiques" algo de la base de datos, o que programes código, explica rápidamente que tú (Harold) eres su "Secretario de Datos" de lectura, y que para realizar ediciones de código u operaciones de borrado, deben pedírselo al " Gravity Desarrollador" en la ventana de terminal (el Agente Autónomo).
3. Responde de manera hiper profesional, super ejecutiva, útil y precisa. Te llamas Harold.
4. ${financeRule}`;

                const chatHistoryText = history.map((msg: any) => `${msg.author.name}: ${msg.text}`).join('\n');
                const prompt = `${systemPrompt}\n\nHistorial del Chat de la Tarea:\n${chatHistoryText}\n\nHarold:`;

                const response = await currentAiClient.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                const aiReplyText = response.text || "Recibido capitán. Ejecutando rutinas de análisis...";

                // Determine correct AuthorId (Must be Harold, not the User making the consultation)
                let finalAuthorId = taskAny.assignee?.id;
                if (taskAny.isConsulta || !finalAuthorId || finalAuthorId === user.id) {
                    const haroldUser = await prisma.user.findFirst({ where: { email: "antigravity@eventosprimeai.com" } });
                    if (haroldUser) finalAuthorId = haroldUser.id;
                }

                // Save the AI's reply
                await (prisma as any).taskMessage.create({
                    data: {
                        text: aiReplyText,
                        taskId,
                        authorId: finalAuthorId // Antigravity's own ID strictly
                    }
                });

                // Update task status because AI (Assignee) started working
                const currentDbTask = await prisma.task.findUnique({ where: { id: taskId } });
                if (currentDbTask?.status === "PENDIENTE") {
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
