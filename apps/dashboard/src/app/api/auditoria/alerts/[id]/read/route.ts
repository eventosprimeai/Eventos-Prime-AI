import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const updated = await (prisma as any).notification.update({
            where: { id, userId: user.id },
            data: { read: true }
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
