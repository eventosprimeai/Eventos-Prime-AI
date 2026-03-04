import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, personType, area, category, jobTitle, avatarUrl } = body;

        // Validar formato básico de email para asegurar cuentas reales (con excepción de harold si ya existe)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return NextResponse.json({ error: "Formato de correo electrónico inválido." }, { status: 400 });
        }

        function mapCategoryToRole(cat: string) {
            if (cat === "Socio") return "ADMIN";
            if (cat === "Sponsor") return "SPONSOR";
            if (["Proveedor", "Agencia Externa", "Empresa Aliada", "Consultor", "Artista"].includes(cat)) return "PROVEEDOR";
            if (["Staff Administrativo"].includes(cat)) return "COORDINADOR";
            return "STAFF";
        }

        const role = mapCategoryToRole(category);

        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create user in Supabase with admin API
        // Do NOT store avatarUrl in user_metadata to avoid gigantic cookies (HTTP 431)
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Automatically confirm the email
            user_metadata: {
                name,
                role,
                personType,
                area,
                category,
                jobTitle
            }
        });

        if (authError) throw authError;

        if (authData?.user) {
            // 2. Insert into Prisma DB directly with the base64 avatar
            await (prisma as any).user.upsert({
                where: { id: authData.user.id },
                update: {
                    name,
                    role: role as any,
                    personType: personType || null,
                    area: area || null,
                    category: category || null,
                    jobTitle: jobTitle || null,
                    avatarUrl: avatarUrl || null
                },
                create: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    name,
                    role: role as any,
                    personType: personType || null,
                    area: area || null,
                    category: category || null,
                    jobTitle: jobTitle || null,
                    avatarUrl: avatarUrl || null
                }
            });

            // 3. Dispatch the welcome email asynchronously (placeholder layout ready for SMTP)
            sendWelcomeEmail({ email, name, password, jobTitle, personType })
                .catch(err => console.error("Error dispatching welcome email:", err));
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function sendWelcomeEmail(userData: any) {
    // Aquí implementaremos el envío real SMTP (ej. Resend, SendGrid o Nodemailer)
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const htmlTemplate = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0f; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
            <div style="background: linear-gradient(135deg, #2a2a35 0%, #1a1a24 100%); padding: 40px 20px; text-align: center; border-bottom: 2px solid #facc15;">
                <h1 style="margin: 0; color: #facc15; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Eventos<span style="color: #ffffff;">Prime</span> AI</h1>
                <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 16px;">Sistema Operativo Central</p>
            </div>
            
            <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #ffffff; font-size: 22px;">¡Bienvenido/a al equipo, ${userData.name}!</h2>
                <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
                    Nos complace oficializar tu acceso a la plataforma integral de <strong>Eventos Prime AI</strong>. Tu perfil ha sido registrado exitosamente bajo la estructura organizativa.
                </p>
                
                <div style="background-color: #1f2937; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #374151;">
                    <h3 style="margin-top: 0; color: #facc15; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Tus Credenciales de Acceso</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #374151; color: #9ca3af; width: 40%;">Perfil Asignado:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #374151; color: #ffffff; font-weight: 600;">${userData.personType} - ${userData.jobTitle}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #374151; color: #9ca3af;">Usuario (Email):</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #374151; color: #ffffff; font-weight: 600;">${userData.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #9ca3af;">Contraseña Temporal:</td>
                            <td style="padding: 10px 0; color: #ffffff; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${userData.password}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${loginUrl}/login" style="background-color: #facc15; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                        Acceder al Panel Central
                    </a>
                </div>
                
                <p style="color: #9ca3af; font-size: 14px; text-align: center; line-height: 1.5; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
                    Por razones de seguridad, te recomendamos iniciar sesión de inmediato y actualizar tu contraseña si el sistema te lo solicita.<br><br>
                    <strong>El Equipo de Dirección<br>Eventos Prime AI</strong>
                </p>
            </div>
        </div>
    `;

    console.log(`\n\n[EMAIL DISPATCH SYSTEM READY]`);
    console.log(`Queued welcome email for: ${userData.email}`);
    console.log(`Rendered HTML Engine:\n`, htmlTemplate, `\n\n`);
    // NOTE: This will later utilize Resend/SMTP bindings.
}
