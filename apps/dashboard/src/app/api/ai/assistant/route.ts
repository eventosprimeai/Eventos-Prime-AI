import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/vertex";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// POST /api/ai/assistant — AI chat assistant with database context
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { message } = await request.json();
        if (!message) return NextResponse.json({ error: "Se requiere message" }, { status: 400 });

        // Gather context from database
        let dbContext = "";
        try {
            const [userCount, eventCount, taskCount, supplierCount] = await Promise.all([
                prisma.user.count(),
                prisma.event.count(),
                prisma.task.count(),
                prisma.supplier.count(),
            ]);

            // Get recent events
            const events = await prisma.event.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { name: true, status: true, createdAt: true } });

            // Get pending tasks
            const pendingTasks = await prisma.task.findMany({
                where: { status: { not: "COMPLETADA" } },
                take: 10,
                orderBy: { dueDate: "asc" },
                select: { title: true, status: true, priority: true, dueDate: true, assignee: { select: { name: true } } },
            });

            // Financial data
            let finData = "";
            try {
                const accounts = await (prisma as any).financialAccount.findMany({ select: { name: true, type: true, balance: true } });
                const txSummary = await (prisma as any).financialTransaction.groupBy({
                    by: ["type"],
                    _sum: { amount: true },
                    _count: true,
                });
                finData = `\nCuentas financieras: ${JSON.stringify(accounts)}\nResumen transacciones: ${JSON.stringify(txSummary)}`;
            } catch { finData = "\n(Módulo financiero sin datos aún)"; }

            dbContext = `
DATOS ACTUALES DE LA EMPRESA:
- Usuarios: ${userCount}
- Eventos: ${eventCount}
- Tareas pendientes: ${taskCount}
- Proveedores: ${supplierCount}

Eventos recientes: ${JSON.stringify(events)}
Tareas pendientes: ${JSON.stringify(pendingTasks)}
${finData}`;
        } catch (e) {
            dbContext = "(No se pudo acceder a todos los datos de la base)";
        }

        const systemPrompt = `Eres el Asistente IA de Eventos Prime, una empresa de producción de eventos y festivales en Ecuador.

Tu rol es ayudar al equipo con:
- Consultas sobre datos de la empresa (eventos, tareas, finanzas, equipo)
- Análisis y recomendaciones operativas
- Resúmenes ejecutivos
- Responder preguntas generales sobre gestión de eventos

Responde siempre en español, de forma concisa y profesional. Usa emojis para hacer las respuestas más visuales.
Si te preguntan algo que no puedes responder con los datos disponibles, dilo honestamente.

${dbContext}`;

        const response = await callGemini({
            prompt: message,
            systemInstruction: systemPrompt,
            temperature: 0.5,
            maxTokens: 1500,
        });

        return NextResponse.json({ success: true, response });
    } catch (error: any) {
        console.error("Assistant error:", error);
        return NextResponse.json({ error: error.message || "Error del asistente" }, { status: 500 });
    }
}
