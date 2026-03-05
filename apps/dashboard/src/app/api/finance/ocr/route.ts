import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as crypto from "crypto";

// Generate JWT for Google Cloud service account auth
function createJWT(serviceAccount: any): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        scope: "https://www.googleapis.com/auth/cloud-platform",
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signInput = `${b64Header}.${b64Payload}`;

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signInput);
    const signature = sign.sign(serviceAccount.private_key, "base64url");

    return `${signInput}.${signature}`;
}

// Get access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
    const jwt = createJWT(serviceAccount);
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const data = await res.json();
    if (!data.access_token) throw new Error("No se pudo obtener access token de GCP");
    return data.access_token;
}

// POST /api/finance/ocr — Extract data from receipt/deposit using Vertex AI (GCP credits)
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "Se requiere imageBase64 (imagen o PDF en base64)" }, { status: 400 });
        }

        // Load service account credentials
        const fs = await import("fs");
        const path = await import("path");
        let serviceAccount: any;
        try {
            const credPath = path.join(process.cwd(), "..", "..", "credentials", "gcp-service-account.json");
            serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf-8"));
        } catch {
            // Try alternative paths
            try {
                const credPath2 = path.join(process.cwd(), "credentials", "gcp-service-account.json");
                serviceAccount = JSON.parse(fs.readFileSync(credPath2, "utf-8"));
            } catch {
                return NextResponse.json({ error: "No se encontraron credenciales GCP. Verifica credentials/gcp-service-account.json" }, { status: 500 });
            }
        }

        // Get access token for Vertex AI
        const accessToken = await getAccessToken(serviceAccount);
        const projectId = serviceAccount.project_id; // eventosprime-ai
        const location = "us-central1";

        // Clean base64 and detect mime type
        let base64Data = imageBase64;
        let mimeType = "image/jpeg";

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

        // Call Vertex AI endpoint (uses GCP $300 credits, no rate limit issues)
        const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash:generateContent`;

        const geminiRes = await fetch(vertexUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Data } },
                    ],
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Vertex AI error:", geminiRes.status, errText);

            // Fallback to AI Studio key if Vertex fails
            const fallbackKey = process.env.GEMINI_API_KEY;
            if (fallbackKey && geminiRes.status !== 429) {
                console.log("Falling back to AI Studio API key...");
                const fallbackRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${fallbackKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
                            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
                        }),
                    }
                );
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    const text = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                        return NextResponse.json({ success: true, extracted: JSON.parse(jsonStr), source: "ai-studio-fallback" });
                    }
                }
            }

            return NextResponse.json({
                error: `Error de Vertex AI (${geminiRes.status}). ${errText.substring(0, 200)}`,
            }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            return NextResponse.json({
                error: "Gemini no pudo analizar el documento. Intenta con una imagen más clara.",
            }, { status: 422 });
        }

        let parsed;
        try {
            const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json({
                error: "No se pudo interpretar la respuesta como datos financieros.",
                rawResponse: responseText.substring(0, 300),
            }, { status: 422 });
        }

        return NextResponse.json({
            success: true,
            extracted: parsed,
            source: "vertex-ai",
        });
    } catch (error: any) {
        console.error("OCR route error:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
