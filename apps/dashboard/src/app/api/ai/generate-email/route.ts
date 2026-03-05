import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/vertex";
import { NextResponse } from "next/server";

// POST /api/ai/generate-email — Generate professional emails for suppliers
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { type, supplierName, eventName, details } = await request.json();
        if (!type || !supplierName) return NextResponse.json({ error: "Se requiere type y supplierName" }, { status: 400 });

        const typePrompts: Record<string, string> = {
            cotizacion: `Genera un email profesional de solicitud de cotización al proveedor "${supplierName}" para el evento "${eventName || "próximo evento"}".
Detalle: ${details || "Solicitar precios y disponibilidad de servicios"}`,
            seguimiento: `Genera un email de seguimiento profesional al proveedor "${supplierName}" sobre una cotización para el evento "${eventName || "el evento"}".
Detalle: ${details || "Consultar estado de la cotización pendiente"}`,
            confirmacion: `Genera un email de confirmación de servicio contratado al proveedor "${supplierName}" para el evento "${eventName || "el evento"}".
Detalle: ${details || "Confirmar fecha, hora y condiciones del servicio"}`,
            agradecimiento: `Genera un email de agradecimiento post-evento al proveedor "${supplierName}" por su participación en "${eventName || "el evento"}".
Detalle: ${details || "Agradecer y dejar las puertas abiertas para futuras colaboraciones"}`,
        };

        const response = await callGemini({
            prompt: typePrompts[type] || typePrompts.cotizacion,
            systemInstruction: `Eres el asistente de comunicaciones de Eventos Prime, empresa de producción de eventos y festivales en Ecuador.
Genera emails en español, profesionales pero cálidos. Firma como "Equipo Eventos Prime". No inventes datos específicos que no se te proporcionen.`,
            temperature: 0.5,
            maxTokens: 600,
        });

        return NextResponse.json({ success: true, email: response });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
