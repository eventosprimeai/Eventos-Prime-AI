import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

let cachedToken: { token: string; expires: number } | null = null;

function getServiceAccount() {
    const paths = [
        path.join(process.cwd(), "..", "..", "credentials", "gcp-service-account.json"),
        path.join(process.cwd(), "credentials", "gcp-service-account.json"),
        path.join(process.cwd(), "..", "credentials", "gcp-service-account.json"),
    ];
    for (const p of paths) {
        try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { }
    }
    throw new Error("No se encontraron credenciales GCP");
}

function createJWT(sa: any): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: sa.client_email, sub: sa.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now, exp: now + 3600,
        scope: "https://www.googleapis.com/auth/cloud-platform",
    };
    const b64H = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64P = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const input = `${b64H}.${b64P}`;
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(input);
    return `${input}.${sign.sign(sa.private_key, "base64url")}`;
}

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
    const sa = getServiceAccount();
    const jwt = createJWT(sa);
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const data = await res.json();
    if (!data.access_token) throw new Error("No se pudo obtener access token");
    cachedToken = { token: data.access_token, expires: Date.now() + 3500000 };
    return data.access_token;
}

interface GeminiOptions {
    prompt: string;
    imageBase64?: string;
    imageMimeType?: string;
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
}

export async function callGemini(options: GeminiOptions): Promise<string> {
    const { prompt, imageBase64, imageMimeType, temperature = 0.3, maxTokens = 2048, systemInstruction } = options;
    const token = await getAccessToken();
    const sa = getServiceAccount();
    const projectId = sa.project_id;
    const location = "us-central1";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash:generateContent`;

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
        let base64Data = imageBase64;
        let mimeType = imageMimeType || "image/jpeg";
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) { mimeType = match[1]; base64Data = match[2]; }
        parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const body: any = {
        contents: [{ role: "user", parts }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
    };
    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        // Fallback to AI Studio
        const fallbackKey = process.env.GEMINI_API_KEY;
        if (fallbackKey) {
            const fbBody: any = {
                contents: [{ parts }],
                generationConfig: { temperature, maxOutputTokens: maxTokens },
            };
            if (systemInstruction) {
                fbBody.systemInstruction = { parts: [{ text: systemInstruction }] };
            }
            const fbRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${fallbackKey}`,
                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fbBody) }
            );
            if (fbRes.ok) {
                const fbData = await fbRes.json();
                return fbData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
        }
        throw new Error(`Gemini error ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export function parseJSON(text: string): any {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
}
