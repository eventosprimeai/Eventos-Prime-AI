import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/events/[id] — get a single event with details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await params;

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                tasks: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        assignee: { select: { id: true, name: true, role: true } },
                    },
                },
                sponsorDeals: {
                    include: {
                        sponsor: { select: { id: true, companyName: true, industry: true } },
                    },
                },
                incidents: {
                    orderBy: { createdAt: "desc" }
                },
                _count: {
                    select: {
                        tasks: { where: { status: { notIn: ["COMPLETADA", "CANCELADA"] } } },
                        sponsorDeals: true,
                        tickets: true,
                        checklists: true,
                        incidents: true
                    }
                },
            },
        });

        if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

        return NextResponse.json(event);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/events/[id] — update event
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();

        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
        if (body.location !== undefined) updateData.location = body.location;
        if (body.venue !== undefined) updateData.venue = body.venue;
        if (body.capacity !== undefined) updateData.capacity = body.capacity;
        if (body.budget !== undefined) updateData.budget = body.budget;
        if (body.status !== undefined) updateData.status = body.status;

        const event = await prisma.event.update({
            where: { id },
            data: updateData,
        });

        await prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entity: "Event",
                entityId: id,
                userId: user.id,
                changes: body,
            },
        });

        return NextResponse.json(event);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/events/[id] — delete event
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await params;

        // Check for related records
        const counts = await prisma.event.findUnique({
            where: { id },
            include: {
                _count: { select: { tasks: true, sponsorDeals: true, tickets: true } },
            },
        });

        if (!counts) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

        const total = counts._count.tasks + counts._count.sponsorDeals + counts._count.tickets;
        if (total > 0) {
            return NextResponse.json({
                error: `No se puede eliminar: tiene ${counts._count.tasks} tareas, ${counts._count.sponsorDeals} sponsors y ${counts._count.tickets} tickets asociados. Elimina estos registros primero.`,
            }, { status: 400 });
        }

        await prisma.event.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "Event",
                entityId: id,
                userId: user.id,
                changes: { name: counts.name },
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
