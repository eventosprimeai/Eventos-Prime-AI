import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const targetUserId = params.id;

        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const callerRole = user.user_metadata?.role;
        if (callerRole !== "DIRECTOR" && callerRole !== "ADMIN") {
            return NextResponse.json({ error: "Permiso denegado. Solo administradores o directores pueden desactivar cuentas." }, { status: 403 });
        }

        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch user from DB first
        const dbUser = await (prisma as any).user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, active: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const newActiveState = !dbUser.active;

        // Revoke access or restore it in Supabase Auth by setting an invalid password or ban if needed.
        // Easiest "ban" at Supabase auth level is using the ban_duration from admin api, but simple "user_metadata" ban is useful too.
        // The most robust way in standard Supabase to prevent sign in is `admin.updateUserById(id, { ban_duration: "876000h" })`
        // Or simply updating user_metadata { active: false } and using RLS or middleware to block them.
        const { error: authError } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: { active: newActiveState },
            ban_duration: newActiveState ? "none" : "876000h" // Ban them for 100 years if deactivating
        });

        if (authError) {
            throw new Error(`Auth Error: ${authError.message}`);
        }

        // Update Prisma DB
        const updatedUser = await (prisma as any).user.update({
            where: { id: targetUserId },
            data: { active: newActiveState }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: newActiveState ? "RESTORE_USER" : "DEACTIVATE_USER",
                entity: "User",
                entityId: targetUserId,
                userId: user.id,
                changes: { email: dbUser.email, active: newActiveState }
            }
        });

        return NextResponse.json({ success: true, active: newActiveState, message: newActiveState ? "Usuario restaurado" : "Usuario desactivado y acceso revocado" });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
