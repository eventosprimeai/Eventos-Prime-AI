import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await params;

        // Optionally, check if the user is authorized to delete the task 
        // (For example, only the creator or standard director can drop tasks)
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        const task = await prisma.task.findUnique({ where: { id } });

        if (!task) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        if (dbUser?.role !== "DIRECTOR" && task.creatorId !== user.id) {
            return NextResponse.json({ error: "No tienes permisos para eliminar esta tarea" }, { status: 403 });
        }

        // The TaskMessage relation has onDelete: Cascade, so deleting the task deletes messages. 
        // Same for Evidences if they were configured with Cascade (but let's do manual evidence cleanup if necessary)
        await prisma.evidence.deleteMany({ where: { taskId: id } });
        await prisma.voiceNote.deleteMany({ where: { taskId: id } });
        await (prisma as any).taskMessage.deleteMany({ where: { taskId: id } });

        await prisma.task.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Tarea eliminada exitosamente" });

    } catch (error: any) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ error: error.message || "Error al eliminar" }, { status: 500 });
    }
}
