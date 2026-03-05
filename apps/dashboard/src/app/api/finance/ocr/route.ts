import { createServerSupabase } from "@/lib/supabase/server";
import { callGemini, parseJSON } from "@/lib/ai/vertex";
import { NextResponse } from "next/server";

const OCR_PROMPT = `Analiza este documento financiero (recibo, factura, depósito, transferencia, ticket, estado de cuenta, o PDF de factura electrónica).

Extrae la información y devuélvela ÚNICAMENTE como JSON válido:

{
  "tipo": "INGRESO" o "GASTO",
  "monto": número decimal (SIN impuestos si el IVA está separado),
  "montoIVA": número o null,
  "tasaIVA": número o null (porcentaje, ej: 15),
  "fecha": "YYYY-MM-DD",
  "descripcion": "concepto breve",
  "categoria": "Marketing"|"Producción"|"Sonido"|"Iluminación"|"Escenario"|"Logística"|"Seguridad"|"Catering"|"Artistas"|"Decoración"|"Transporte"|"Alquiler de Equipos"|"Personal"|"Seguros"|"Comisión Bancaria"|"Impuestos"|"Servicios Básicos"|"Tecnología"|"Venta de Tickets"|"Patrocinios"|"Otros Ingresos"|"Otro",
  "referencia": "nro factura/RUC/ref" o null,
  "banco": "nombre banco" o null,
  "proveedor": "empresa/persona emisora" o null,
  "confianza": 0-100
}

Responde SOLO con el JSON.`;

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { imageBase64 } = await request.json();
        if (!imageBase64) return NextResponse.json({ error: "Se requiere imageBase64" }, { status: 400 });

        const text = await callGemini({ prompt: OCR_PROMPT, imageBase64 });
        const extracted = parseJSON(text);

        return NextResponse.json({ success: true, extracted });
    } catch (error: any) {
        console.error("OCR error:", error);
        return NextResponse.json({ error: error.message || "Error al procesar documento" }, { status: 500 });
    }
}
