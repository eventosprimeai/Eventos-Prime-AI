import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/finance/ocr — Extract data from receipt/deposit image or PDF using Gemini Vision
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { imageBase64, mimeType: providedMime } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "Se requiere imageBase64 (imagen o PDF en base64)" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY no configurada en el servidor" }, { status: 500 });
        }

        // Clean base64 and detect mime type
        let base64Data = imageBase64;
        let mimeType = providedMime || "image/jpeg";

        // Handle data URL format: data:image/png;base64,XXXXX or data:application/pdf;base64,XXXXX
        const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
            mimeType = dataUrlMatch[1];
            base64Data = dataUrlMatch[2];
        }

        const prompt = `Analiza este documento financiero (puede ser una imagen de recibo, factura, depósito bancario, transferencia, ticket de compra, estado de cuenta, o un PDF de factura electrónica).

Extrae la siguiente información y devuélvela ÚNICAMENTE como JSON válido, sin texto adicional ni markdown:

{
  "tipo": "INGRESO" o "GASTO" (depósitos/transferencias recibidas/ventas = INGRESO, pagos/compras/comisiones/servicios = GASTO),
  "monto": número decimal (el monto principal de la transacción, SIN impuestos si el IVA está separado),
  "montoIVA": número decimal o null (monto del IVA si se identifica como línea separada),
  "tasaIVA": número o null (porcentaje de IVA, ej: 15, 12),
  "fecha": "YYYY-MM-DD" (fecha de la transacción),
  "descripcion": "texto descriptivo breve del concepto o servicio",
  "categoria": una de estas opciones exactas: "Marketing", "Producción", "Sonido", "Iluminación", "Escenario", "Logística", "Seguridad", "Catering", "Artistas", "Decoración", "Transporte", "Alquiler de Equipos", "Personal", "Seguros", "Comisión Bancaria", "Impuestos", "Servicios Básicos", "Tecnología", "Venta de Tickets", "Patrocinios", "Otros Ingresos", "Otro",
  "referencia": "número de factura, referencia de transferencia, RUC, o identificador único" o null,
  "banco": "nombre del banco si es visible" o null,
  "proveedor": "nombre de la empresa o persona que emite el documento" o null,
  "confianza": número del 0 al 100 indicando qué tan seguro estás de los datos extraídos
}

IMPORTANTE: Responde SOLO con el objeto JSON, sin explicaciones, sin comillas triples, sin markdown.`;

        // Call Gemini API with the document
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Data,
                                },
                            },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini API error:", geminiRes.status, errText);
            return NextResponse.json({
                error: `Error de Gemini API (${geminiRes.status}). Verifica que GEMINI_API_KEY sea válida.`,
                details: errText.substring(0, 200),
            }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            return NextResponse.json({
                error: "Gemini no pudo analizar el documento. Intenta con una imagen más clara.",
                rawResponse: JSON.stringify(geminiData).substring(0, 300),
            }, { status: 422 });
        }

        // Parse JSON from response (handle markdown code blocks if they slip through)
        let parsed;
        try {
            const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json({
                error: "No se pudo interpretar la respuesta de Gemini como datos financieros.",
                rawResponse: responseText.substring(0, 300),
            }, { status: 422 });
        }

        return NextResponse.json({
            success: true,
            extracted: parsed,
        });
    } catch (error: any) {
        console.error("OCR route error:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
