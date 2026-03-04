import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const callerRole = user.user_metadata?.role;
        if (callerRole !== "DIRECTOR" && callerRole !== "ADMIN") {
            return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
        }

        const alerts = await (prisma as any).notification.findMany({
            where: { userId: user.id, channel: "security", read: false },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { user: { select: { name: true, email: true, role: true } } }
        });

        return NextResponse.json({ alerts, logs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
