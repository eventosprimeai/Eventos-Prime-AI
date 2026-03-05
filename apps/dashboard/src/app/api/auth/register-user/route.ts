import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, personType, area, category, jobTitle, avatarUrl, contractType, contractEventId } = body;

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
                jobTitle,
                contractType,
                contractEventId
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
                    contractType: contractType || null,
                    contractEventId: contractEventId || null,
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
                    contractType: contractType || null,
                    contractEventId: contractEventId || null,
                    avatarUrl: avatarUrl || null
                }
            });

            // 3. Dispatch the welcome email asynchronously
            // Skip sending welcome email if it's an AI agent (avoids bounce from fake email)
            if (personType !== "Profesional IA") {
                sendWelcomeEmail({ email, name, password, jobTitle, personType, category, contractType })
                    .catch(err => console.error("Error dispatching welcome email:", err));
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Generador de responsabilidades
function getRoleResponsibilitiesHTML(jobTitle: string = "", category: string = ""): string {
    const combined = `${jobTitle} ${category}`.toLowerCase();
    let bullets = [
        'Cumplir con las tareas operativas asignadas a tu cargo.',
        'Colaborar proactivamente con el resto del equipo en plataforma.',
        'Reportar avances y novedades desde tu panel de usuario.'
    ];

    if (combined.includes('director')) {
        bullets = [
            'Liderar la visión estratégica y supervisar la ejecución general.',
            'Aprobar presupuestos y tomar decisiones críticas para el evento.',
            'Evaluar métricas globales y asegurar el cumplimiento de objetivos.'
        ];
    } else if (combined.includes('socio') || combined.includes('partner')) {
        bullets = [
            'Participar en la toma de decisiones conjuntas del proyecto y su estructuración.',
            'Apoyar en la expansión comercial, relaciones públicas de alto nivel y networking.',
            'Supervisar la rentabilidad financiera y asegurar retornos de inversión del evento.'
        ];
    } else if (combined.includes('finanz') || combined.includes('contable')) {
        bullets = [
            'Controlar presupuestos, costos e ingresos de taquillas o ventas.',
            'Ejecutar negociaciones financieras y realizar pagos a proveedores/staff.',
            'Proveer reportes de rendimiento económico para la junta directiva.'
        ];
    } else if (combined.includes('marketing') || combined.includes('comercial') || combined.includes('ventas')) {
        bullets = [
            'Diseñar estrategias de posicionamiento de marca y experiencia de usuario.',
            'Manejar campañas de publicidad (Ads), Email Marketing y Redes Sociales.',
            'Coordinar la captación de leads, venta de entradas y fidelización de asistentes.'
        ];
    } else if (combined.includes('operacion') || combined.includes('logístic')) {
        bullets = [
            'Planificar la logística de todos los insumos, locación y personal para el evento.',
            'Coordinar el montaje, desmontaje y operaciones in-situ generales o de backstage.',
            'Garantizar que todas las áreas funcionen el día del evento sin contratiempos.'
        ];
    } else if (combined.includes('producción') || combined.includes('técnic')) {
        bullets = [
            'Ejecutar las especificaciones técnicas (audio, luces, pantallas, stage, etc).',
            'Coordinar con exactitud el minutaje de agendas de artistas o ponentes.',
            'Asegurar una experiencia audiovisual de altísimo impacto visual y sonoro.'
        ];
    } else if (combined.includes('staff') || combined.includes('coordinador')) {
        bullets = [
            'Brindar atención directa y protocolo al asistente en la sede del evento.',
            'Apoyar y supervisar a las diversas áreas operativas preasignadas.',
            'Solucionar cualquier tipo de contingencia o improvisto inmediato cara a cara.'
        ];
    } else if (combined.includes('proveedor') || combined.includes('agencia')) {
        bullets = [
            'Suministrar productos o servicios de acuerdo a los términos del contrato.',
            'Asegurar el cumplimiento estricto de estándares de calidad solicitados.',
            'Proveer en tiempo y forma soporte técnico o el material requerido.'
        ];
    }

    return bullets.map(b => `<li style="margin-bottom: 12px; display: flex; align-items: start;"><span style="color: #facc15; margin-right: 8px;">✓</span> ${b}</li>`).join('');
}


async function sendWelcomeEmail(userData: any) {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const downloadUrl = `${loginUrl}/descarga`;
    const resendApiKey = process.env.RESEND_API_KEY;

    // Use default title or categorize it
    const displayNameRole = userData.jobTitle || userData.personType || "Miembro de Equipo";

    const htmlTemplate = `
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0d0d14; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a35; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(135deg, #1e1e2e 0%, #11111a 100%); padding: 50px 30px; text-align: center; border-bottom: 3px solid #facc15;">
                <h1 style="margin: 0; color: #facc15; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-transform: uppercase;">EVENTOS<span style="color: #ffffff;">PRIME</span> AI</h1>
                <p style="margin: 12px 0 0 0; color: #a1a1aa; font-size: 16px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Sistema Operativo Central</p>
            </div>
            
            <div style="padding: 40px;">
                <h2 style="margin-top: 0; color: #ffffff; font-size: 24px; font-weight: 700;">¡Bienvenido/a a bordo, ${userData.name}!</h2>
                <p style="color: #d4d4d8; font-size: 16px; line-height: 1.6;">
                    Nos complace oficializar tu acceso a la plataforma integral de <strong>Eventos Prime AI</strong>. Tu perfil ha sido registrado y activado exitosamente en nuestra estructura organizativa bajo el rol de <strong>${displayNameRole}</strong>.
                </p>
                
                <div style="background-color: #181825; padding: 30px; border-radius: 12px; margin: 35px 0; border: 1px solid #2a2a35;">
                    <h3 style="margin-top: 0; margin-bottom: 20px; color: #facc15; font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #2a2a35; padding-bottom: 10px;">🛡️ Tus Credenciales de Acceso</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #2a2a35; color: #a1a1aa; width: 40%;">Perfil Asignado:</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #2a2a35; color: #ffffff; font-weight: 600;">${userData.personType} - ${displayNameRole}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #2a2a35; color: #a1a1aa;">Usuario (Email):</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #2a2a35; color: #ffffff; font-weight: 600;">${userData.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; color: #a1a1aa;">Contraseña:</td>
                            <td style="padding: 12px 0; color: #ffffff; font-family: monospace; font-size: 18px; font-weight: 600; letter-spacing: 2px; background: #2a2a35; border-radius: 4px; padding-left: 10px;">${userData.password}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #1a1a24; padding: 30px; border-radius: 12px; margin: 35px 0; border: 1px solid #2a2a35; border-left: 4px solid #facc15;">
                    <h3 style="margin-top: 0; margin-bottom: 15px; color: #ffffff; font-size: 18px;">🎯 Tus Funciones y Responsabilidades</h3>
                    <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">Como parte vital de nuestro ecosistema, estas son algunas de tus áreas clave de enfoque:</p>
                    <ul style="list-style: none; padding: 0; margin: 0; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                        ${getRoleResponsibilitiesHTML(userData.jobTitle, userData.category)}
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 45px 0; display: flex; flex-direction: column; gap: 15px;">
                    <p style="color: #a1a1aa; font-size: 16px; margin: 0;">Para comenzar a operar, descarga la app móvil ahora:</p>
                    <a href="${downloadUrl}" style="background-color: #facc15; color: #000000; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; transition: background-color 0.3s; box-shadow: 0 4px 15px rgba(250, 204, 21, 0.3);">
                        📥 Descargar App (iOS / Android)
                    </a>
                    
                    <a href="${loginUrl}/login" style="color: #a1a1aa; text-decoration: underline; font-size: 14px; margin-top: 10px;">
                        O iniciar sesión desde la web
                    </a>
                </div>
                
                <p style="color: #a1a1aa; font-size: 14px; text-align: center; line-height: 1.6; margin-top: 40px; border-top: 1px solid #2a2a35; padding-top: 30px;">
                    Te recomendamos iniciar sesión de inmediato y, si es necesario, completar tus datos en el perfil.<br><br>
                    <strong>La Dirección General<br><span style="color: #facc15;">Eventos Prime AI</span></strong>
                </p>
            </div>
        </div>
    `;

    console.log('[EMAIL DISPATCH SYSTEM] Rendered payload generated.');

    if (resendApiKey) {
        try {
            const resend = new Resend(resendApiKey);
            const data = await resend.emails.send({
                from: 'Eventos Prime AI <noreply@eventosprimeai.com>',
                to: userData.email,
                subject: '🚀 ¡Bienvenido al equipo de Eventos Prime AI!',
                html: htmlTemplate,
            });
            console.log(`[EMAIL DISPATCH SYSTEM] Sent via Resend successfully to ${userData.email}`, data);
        } catch (error) {
            console.error('[EMAIL DISPATCH SYSTEM] Resend Error:', error);
            console.log(`Fallback HTML render:\n${htmlTemplate}`);
        }
    } else {
        console.warn('\n[EMAIL DISPATCH SYSTEM] Missing RESEND_API_KEY in environment variables. Email could not be sent. Logged below:\n');
        console.log(htmlTemplate);
        console.warn('--- END EMAIL LOG ---\n');
    }
}

