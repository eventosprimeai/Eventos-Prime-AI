import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/vertex";
import { NextResponse } from "next/server";

// POST /api/ai/report-summary — Generate executive AI summary of financial data
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { financialData } = await request.json();
        if (!financialData) return NextResponse.json({ error: "Se requiere financialData" }, { status: 400 });

        const response = await callGemini({
            prompt: `Genera un resumen ejecutivo breve (máximo 4 párrafos) de estos datos financieros de una empresa de eventos:

${JSON.stringify(financialData)}

Incluye:
1. Estado general de salud financiera
2. Tendencias principales (qué categorías consumen más presupuesto)
3. Alertas o puntos de atención
4. Recomendaciones concretas

Responde en español, tono ejecutivo pero accesible. Usa emojis para visual.`,
            systemInstruction: "Eres el analista financiero IA de Eventos Prime, empresa de producción de eventos en Ecuador.",
            temperature: 0.4,
            maxTokens: 800,
        });

        return NextResponse.json({ success: true, summary: response });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
