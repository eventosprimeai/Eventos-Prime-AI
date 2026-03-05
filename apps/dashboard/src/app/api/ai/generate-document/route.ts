import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/vertex";
import { NextResponse } from "next/server";

// POST /api/ai/generate-document — Generate document drafts (contracts, proposals, invoices)
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { type, data } = await request.json();
        if (!type) return NextResponse.json({ error: "Se requiere type" }, { status: 400 });

        const docPrompts: Record<string, string> = {
            contrato_proveedor: `Genera un contrato de servicios entre Eventos Prime (contratante) y el proveedor "${data?.supplierName || "[PROVEEDOR]"}" para el evento "${data?.eventName || "[EVENTO]"}".

Datos del servicio:
- Servicio: ${data?.service || "[DESCRIPCIÓN DEL SERVICIO]"}
- Fecha del evento: ${data?.eventDate || "[FECHA]"}
- Monto acordado: $${data?.amount || "[MONTO]"}
- Forma de pago: ${data?.paymentTerms || "50% anticipo, 50% post-evento"}

Genera un contrato completo en español con: partes, objeto, obligaciones, monto, forma de pago, vigencia, penalidades por incumplimiento, y firmas.`,

            propuesta_patrocinio: `Genera una propuesta de patrocinio para la empresa "${data?.sponsorName || "[EMPRESA]"}" para participar en el evento "${data?.eventName || "[EVENTO]"}".

Datos:
- Fecha del evento: ${data?.eventDate || "[FECHA]"}
- Público esperado: ${data?.audience || "[CANTIDAD]"} personas
- Paquetes disponibles: ${data?.packages || "Gold ($5000), Silver ($3000), Bronze ($1500)"}

Genera una propuesta atractiva con: descripción del evento, beneficios para el patrocinador, paquetes con detalle, contacto.`,

            orden_compra: `Genera una orden de compra de Eventos Prime para el proveedor "${data?.supplierName || "[PROVEEDOR]"}".

Items:
${data?.items || "- [ITEM 1] - $[MONTO]\n- [ITEM 2] - $[MONTO]"}

Incluye: número de orden, fecha, datos del proveedor, items con cantidades y precios, subtotal, IVA 15%, total, condiciones de entrega.`,
        };

        const response = await callGemini({
            prompt: docPrompts[type] || `Genera un documento de tipo "${type}" con estos datos: ${JSON.stringify(data)}`,
            systemInstruction: `Eres el asistente legal y administrativo de Eventos Prime, empresa de producción de eventos en Ecuador.
Genera documentos profesionales, completos y listos para usar. Usa formato legible con secciones numeradas.
RUC de Eventos Prime: [A COMPLETAR]. Dirección: Guayaquil, Ecuador.`,
            temperature: 0.3,
            maxTokens: 3000,
        });

        return NextResponse.json({ success: true, document: response, type });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
