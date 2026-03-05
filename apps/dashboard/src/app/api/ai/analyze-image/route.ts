import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini, parseJSON } from "@/lib/ai/vertex";
import { NextResponse } from "next/server";

// POST /api/ai/analyze-image — Analyze event photos and describe them
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { imageBase64, context } = await request.json();
        if (!imageBase64) return NextResponse.json({ error: "Se requiere imageBase64" }, { status: 400 });

        const text = await callGemini({
            prompt: `Analiza esta foto de un evento y devuelve JSON:

{
  "descripcion": "descripción detallada de lo que muestra la imagen (2-3 oraciones)",
  "categoria": "Montaje"|"Escenario"|"Público"|"Artistas"|"Logística"|"Catering"|"Decoración"|"Iluminación"|"Sonido"|"Backstage"|"Seguridad"|"Otro",
  "personas": número estimado de personas visibles,
  "elementos": ["lista", "de", "elementos", "principales", "visibles"],
  "calidad": "Alta"|"Media"|"Baja",
  "sugerencia": "sugerencia breve para mejorar esa área del evento basado en la foto"
}

${context ? `Contexto del evento: ${context}` : ""}
Responde SOLO con el JSON.`,
            imageBase64,
            temperature: 0.3,
            maxTokens: 500,
        });

        return NextResponse.json({ success: true, analysis: parseJSON(text) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
