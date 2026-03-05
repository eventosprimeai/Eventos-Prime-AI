import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/vertex";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// Permission levels by role/area
const PERMISSION_MAP: Record<string, string[]> = {
    // Full access
    DIRECTOR: ["eventos", "tareas", "finanzas", "equipo", "proveedores", "reportes", "auditoria"],
    ADMIN: ["eventos", "tareas", "finanzas", "equipo", "proveedores", "reportes", "auditoria"],

    // Department-based access
    "Finanzas": ["finanzas", "proveedores", "reportes", "tareas"],
    "Marketing": ["eventos", "tareas", "proveedores", "reportes"],
    "Producción": ["eventos", "tareas", "proveedores", "equipo"],
    "Operaciones": ["eventos", "tareas", "equipo"],
    "Logística": ["eventos", "tareas"],

    // Default staff
    STAFF: ["tareas"],
};

function getUserPermissions(user: { role: string; area: string | null; jobTitle: string | null }): string[] {
    // Directors and admins get everything
    if (user.role === "DIRECTOR" || user.role === "ADMIN") return PERMISSION_MAP.DIRECTOR;
    if (user.jobTitle?.toLowerCase().includes("director")) return PERMISSION_MAP.DIRECTOR;

    // Check area
    if (user.area && PERMISSION_MAP[user.area]) return PERMISSION_MAP[user.area];

    // Default
    return PERMISSION_MAP.STAFF;
}

// POST /api/ai/assistant — AI chat with permissions + history
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { message } = await request.json();
        if (!message) return NextResponse.json({ error: "Se requiere message" }, { status: 400 });

        // Get user profile from DB
        const dbUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { id: true, name: true, role: true, area: true, jobTitle: true },
        });

        if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        const permissions = getUserPermissions(dbUser);
        const dataAccessed: string[] = [];
        let wasRestricted = false;

        // Save user message to history
        try {
            await (prisma as any).aIChatMessage.create({
                data: { userId: dbUser.id, role: "user", content: message },
            });
        } catch { }

        // Build context based on permissions
        let dbContext = "";

        try {
            // Always: basic counts
            const userCount = await prisma.user.count();
            dbContext += `\nUsuarios en el sistema: ${userCount}`;

            // Events (if permitted)
            if (permissions.includes("eventos")) {
                dataAccessed.push("eventos");
                const eventCount = await prisma.event.count();
                const events = await prisma.event.findMany({
                    take: 5, orderBy: { createdAt: "desc" },
                    select: { name: true, status: true, startDate: true, location: true },
                });
                dbContext += `\nEventos totales: ${eventCount}\nEventos recientes: ${JSON.stringify(events)}`;
            }

            // Tasks (if permitted - only their own for STAFF, all for managers)
            if (permissions.includes("tareas")) {
                dataAccessed.push("tareas");
                const taskWhere = permissions.includes("equipo")
                    ? { status: { not: "COMPLETADA" as const } }
                    : { assigneeId: dbUser.id, status: { not: "COMPLETADA" as const } };
                const tasks = await prisma.task.findMany({
                    where: taskWhere,
                    take: 10, orderBy: { dueDate: "asc" },
                    select: { title: true, status: true, priority: true, dueDate: true, assignee: { select: { name: true } } },
                });
                const taskCount = await prisma.task.count({ where: taskWhere });
                dbContext += `\nTareas pendientes: ${taskCount}\nDetalle tareas: ${JSON.stringify(tasks)}`;
            }

            // Finance (if permitted)
            if (permissions.includes("finanzas")) {
                dataAccessed.push("finanzas");
                try {
                    const accounts = await (prisma as any).financialAccount.findMany({
                        select: { name: true, type: true, balance: true },
                    });
                    const txSummary = await (prisma as any).financialTransaction.groupBy({
                        by: ["type"], _sum: { amount: true }, _count: true,
                    });
                    const recentTx = await (prisma as any).financialTransaction.findMany({
                        take: 5, orderBy: { date: "desc" },
                        select: { type: true, category: true, description: true, amount: true, date: true },
                    });
                    dbContext += `\nCuentas financieras: ${JSON.stringify(accounts)}`;
                    dbContext += `\nResumen transacciones: ${JSON.stringify(txSummary)}`;
                    dbContext += `\nÚltimas transacciones: ${JSON.stringify(recentTx)}`;
                } catch { dbContext += "\n(Módulo financiero sin datos aún)"; }
            } else {
                // If they ask about finance but don't have permission
                if (message.toLowerCase().match(/(gast|ingres|dinero|plata|financ|cuent|presupuest|cobr|pag|factur)/)) {
                    wasRestricted = true;
                    dbContext += "\n⚠️ RESTRICCIÓN: Este usuario NO tiene acceso a información financiera. NO le des datos financieros.";
                }
            }

            // Suppliers (if permitted)
            if (permissions.includes("proveedores")) {
                dataAccessed.push("proveedores");
                const supplierCount = await prisma.supplier.count();
                dbContext += `\nProveedores totales: ${supplierCount}`;
            }

            // Team (if permitted)
            if (permissions.includes("equipo")) {
                dataAccessed.push("equipo");
                const team = await prisma.user.findMany({
                    where: { active: true },
                    select: { name: true, area: true, jobTitle: true },
                });
                dbContext += `\nEquipo activo: ${JSON.stringify(team)}`;
            }
        } catch (e) {
            dbContext += "\n(Error parcial al acceder a los datos)";
        }

        // Build restricted topics message
        const restrictedTopics = ["eventos", "tareas", "finanzas", "equipo", "proveedores", "reportes"]
            .filter(t => !permissions.includes(t));

        const systemPrompt = `Eres el Asistente IA de Eventos Prime, una empresa de producción de eventos y festivales en Ecuador.

USUARIO ACTUAL: ${dbUser.name} (${dbUser.jobTitle || "Staff"}, Área: ${dbUser.area || "General"}, Rol: ${dbUser.role})
PERMISOS: Tiene acceso a: ${permissions.join(", ")}
${restrictedTopics.length > 0 ? `TEMAS RESTRINGIDOS (NO dar información sobre): ${restrictedTopics.join(", ")}` : "ACCESO COMPLETO a toda la información."}

${wasRestricted ? "⚠️ IMPORTANTE: Este usuario NO tiene permiso para ver datos de alguna categoría que está pidiendo. Infórmale amablemente que no tiene acceso y sugiere qué sí puede consultar." : ""}

DATOS DISPONIBLES:
${dbContext}

REGLAS:
1. Responde siempre en español, conciso y profesional
2. Usa emojis para hacer las respuestas visuales
3. Si te preguntan algo fuera de sus permisos, di amablemente: "No tienes acceso a esa información. Puedo ayudarte con: [listar lo que sí puede]"
4. Si no tienes datos suficientes, dilo honestamente — NUNCA inventes números
5. Dirígete al usuario por su nombre`;

        const response = await callGemini({
            prompt: message,
            systemInstruction: systemPrompt,
            temperature: 0.5,
            maxTokens: 1500,
        });

        // Save assistant response to history
        try {
            await (prisma as any).aIChatMessage.create({
                data: {
                    userId: dbUser.id,
                    role: "assistant",
                    content: response,
                    dataAccessed: dataAccessed.join(","),
                    wasRestricted,
                },
            });
        } catch { }

        return NextResponse.json({
            success: true,
            response,
            permissions,
            dataAccessed,
            wasRestricted,
        });
    } catch (error: any) {
        console.error("Assistant error:", error);
        return NextResponse.json({ error: error.message || "Error del asistente" }, { status: 500 });
    }
}

// GET /api/ai/assistant — Get chat history
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const history = await (prisma as any).aIChatMessage.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
                id: true, role: true, content: true,
                dataAccessed: true, wasRestricted: true, createdAt: true,
            },
        });

        return NextResponse.json(history.reverse());
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
