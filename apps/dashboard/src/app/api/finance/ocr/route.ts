import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/finance/ocr — Extract data from receipt/deposit image using Gemini Vision
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { imageBase64, imageUrl } = body;

        if (!imageBase64 && !imageUrl) {
            return NextResponse.json({ error: "Se requiere imageBase64 o imageUrl" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
        }

        // Prepare image data for Gemini
        let imageContent: any;
        if (imageBase64) {
            // Remove data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            imageContent = {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data,
                },
            };
        } else if (imageUrl) {
            // Fetch the image and convert to base64
            const imgRes = await fetch(imageUrl);
            const buffer = await imgRes.arrayBuffer();
            const base64Data = Buffer.from(buffer).toString("base64");
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            imageContent = {
                inlineData: {
                    mimeType: contentType,
                    data: base64Data,
                },
            };
        }

        const prompt = `Analiza esta imagen de un comprobante financiero (puede ser un recibo, factura, depósito bancario, transferencia, ticket de compra, o estado de cuenta).

Extrae la siguiente información y devuélvela ÚNICAMENTE como JSON válido, sin texto adicional:

{
  "tipo": "INGRESO" o "GASTO" (determina según el contexto: depósitos/transferencias recibidas = INGRESO, pagos/compras/comisiones = GASTO),
  "monto": número decimal (el monto principal de la transacción, sin impuestos),
  "montoIVA": número decimal o null (si se identifica IVA separado),
  "tasaIVA": número o null (porcentaje de IVA si se identifica, ej: 15),
  "fecha": "YYYY-MM-DD" (fecha de la transacción),
  "descripcion": "texto descriptivo breve del concepto",
  "categoria": una de estas: "Marketing", "Producción", "Sonido", "Iluminación", "Escenario", "Logística", "Seguridad", "Catering", "Artistas", "Decoración", "Transporte", "Alquiler de Equipos", "Personal", "Seguros", "Comisión Bancaria", "Impuestos", "Servicios Básicos", "Tecnología", "Venta de Tickets", "Patrocinios", "Otros Ingresos", "Otro",
  "referencia": "número de factura, referencia de transferencia, o identificador único visible" o null,
  "banco": "nombre del banco si es visible" o null,
  "proveedor": "nombre de la empresa/persona que emite" o null,
  "confianza": número del 0 al 100 indicando qué tan seguro estás de los datos extraídos
}

Si no puedes identificar algún campo, usa null. Responde SOLO con el JSON, sin explicaciones.`;

        // Call Gemini API
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            imageContent,
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
            return NextResponse.json({ error: `Error de Gemini API: ${geminiRes.status}`, details: errText }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            return NextResponse.json({ error: "No se pudo obtener respuesta de Gemini" }, { status: 500 });
        }

        // Parse JSON from response (handle markdown code blocks)
        let parsed;
        try {
            const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json({
                error: "No se pudo parsear la respuesta de Gemini",
                rawResponse: responseText,
            }, { status: 422 });
        }

        return NextResponse.json({
            success: true,
            extracted: parsed,
            rawResponse: responseText,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
