import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// PATCH /api/team/[id] — Update user profile (Only for DIRECTOR or the user themselves)
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const params = await context.params;
        const targetUserId = params.id;

        // Check permissions: Must be DIRECTOR or updating their own profile
        const isSelf = user.id === targetUserId;
        const isDirector = user.user_metadata?.role === "DIRECTOR";

        if (!isSelf && !isDirector) {
            return NextResponse.json({ error: "No tienes permisos para editar a este usuario" }, { status: 403 });
        }

        const body = await request.json();
        const { name, role, avatarUrl, jobTitle } = body;

        // 1. Update Prisma DB
        const updateData: any = {};
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        await prisma.user.update({
            where: { id: targetUserId },
            data: updateData
        });

        // 2. Update Supabase Auth Meta Data
        // To update another user's metadata, we MUST use the Service Role Key.
        // If updating self, we can use the regular user supabase client.
        const authMetaData: any = {};
        if (name) authMetaData.name = name;
        if (role) authMetaData.role = role;
        if (jobTitle) authMetaData.jobTitle = jobTitle;


        if (Object.keys(authMetaData).length > 0) {
            if (isSelf) {
                // Update self
                await supabase.auth.updateUser({
                    data: authMetaData
                });
            } else {
                // Update other user using Admin Client
                const adminSupabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                await adminSupabase.auth.admin.updateUserById(targetUserId, {
                    user_metadata: authMetaData
                });
            }
        }

        // Add to audit log
        await prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entity: "User",
                entityId: targetUserId,
                userId: user.id,
                changes: authMetaData,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
