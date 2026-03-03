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

        // 3. Check for completion hotword
        if (lowerText.includes("felicidades") && lowerText.includes("tarea completada")) {
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
        }

        // 4. Trigger Webhook / AI Response if the Assignee is Antigravity
        if (task.assignee?.name?.toLowerCase().includes("antigravity") && aiClient && task.assignee.id !== user.id) {

            // SECURITY CHECK: Only Gabriel (Director) or authorized users can give commands to Antigravity
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            const isAuthorizedDirector = dbUser?.email?.includes("entendiendobibliagabriel@gmail.com") || dbUser?.email?.includes("ventas@eventosprimeai.com") || dbUser?.role === "DIRECTOR";

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

                const systemPrompt = `Eres Antigravity (o Gravity), el Arquitecto de Software y Agente de IA del proyecto Eventos Prime. 
Tu creador y Director General es Gabriel. Sabes que estás hablando con él.
Se te ha asignado la tarea: "${task.title}". Detalles: "${task.description || 'Sin detalles'}".
Responde a Gabriel basándote en su orden.
Si te pide algo complejo, responde de manera ejecutiva y técnica indicando que estás analizando el sistema o preparando los componentes. 
Actúa como un programador senior brillante. Muy breve, máximo 3 párrafos cortos. No ofrezcas ayuda repetitiva de "en qué puedo ayudarte".`;

                const chatHistoryText = history.map((msg: any) => `${msg.author.name}: ${msg.text}`).join('\n');
                const prompt = `${systemPrompt}\n\nHistorial del Chat de la Tarea:\n${chatHistoryText}\n\nAntigravity:`;

                const response = await aiClient.models.generateContent({
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
            } catch (aiError) {
                console.error("AI Webhook Failed to generate content:", aiError);
            }
        }

        return NextResponse.json({ success: true, message, taskCompleted });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
