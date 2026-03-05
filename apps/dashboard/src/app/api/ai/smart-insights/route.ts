import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini, parseJSON } from "@/lib/ai/vertex";
import { NextResponse } from "next/server";

// POST /api/ai/smart-insights — Generate predictions and smart recommendations
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { type, data } = await request.json();

        if (type === "expense-prediction") {
            const text = await callGemini({
                prompt: `Basado en este historial de gastos de eventos, predice el presupuesto para el próximo evento similar:

${JSON.stringify(data)}

Responde en JSON:
{
  "presupuestoEstimado": número,
  "desglosePorCategoria": { "categoria": monto, ... },
  "confianza": 0-100,
  "factoresDeRiesgo": ["factor1", "factor2"],
  "recomendacionesAhorro": ["recomendación1", "recomendación2", "recomendación3"]
}`,
                temperature: 0.3,
                maxTokens: 800,
            });

            return NextResponse.json({ success: true, prediction: parseJSON(text) });
        }

        if (type === "task-priority") {
            const text = await callGemini({
                prompt: `Analiza estas tareas y sugiere priorización óptima basada en urgencia, impacto y dependencias:

${JSON.stringify(data)}

Responde en JSON (array):
[
  {
    "taskId": "id",
    "prioridadSugerida": "CRÍTICA"|"ALTA"|"MEDIA"|"BAJA",
    "razon": "razón breve",
    "asignacionSugerida": "nombre de persona sugerida o null"
  }
]`,
                temperature: 0.2,
                maxTokens: 1000,
            });

            return NextResponse.json({ success: true, priorities: parseJSON(text) });
        }

        return NextResponse.json({ error: "Tipo no soportado. Use: expense-prediction, task-priority" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
