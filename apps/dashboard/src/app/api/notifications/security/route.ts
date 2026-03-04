import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const target = body.target || "Ruta Protegida Desconocida";

        // Find all Directors and Admins
        const admins = await (prisma as any).user.findMany({
            where: { role: { in: ["DIRECTOR", "ADMIN"] }, active: true },
            select: { id: true }
        });

        // Get the violator's details
        const violator = await (prisma as any).user.findUnique({
            where: { id: user.id },
            select: { name: true, jobTitle: true, category: true, role: true }
        });

        const violatorName = violator?.name || user.email || "Usuario Desconocido";
        const violatorRole = violator?.jobTitle || violator?.category || violator?.role || "Sin Rol";

        // Create a notification for each admin
        const notificationsToCreate = admins.map((admin: any) => ({
            title: "⚠️ Alerta de Seguridad (Acceso Denegado)",
            message: `El usuario ${violatorName} (${violatorRole}) intentó acceder sin permisos a: ${target}.`,
            channel: "security",
            userId: admin.id,
            data: { violatorId: user.id, target }
        }));

        if (notificationsToCreate.length > 0) {
            await (prisma as any).notification.createMany({
                data: notificationsToCreate
            });
        }

        // Also create an audit log
        await prisma.auditLog.create({
            data: {
                action: "UNAUTHORIZED_ACCESS_ATTEMPT",
                entity: "Security",
                userId: user.id,
                changes: { target, ip: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
