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
                supplierOrders: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        supplier: { select: { id: true, companyName: true, category: true, contactName: true } },
                    },
                },
                participants: {
                    orderBy: { createdAt: "desc" },
                },
                incidents: {
                    orderBy: { createdAt: "desc" }
                },
                _count: {
                    select: {
                        tasks: { where: { status: { notIn: ["COMPLETADA", "CANCELADA"] } } },
                        sponsorDeals: true,
                        tickets: true,
                        supplierOrders: true,
                        participants: true,
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

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || (dbUser.role !== "DIRECTOR" && dbUser.role !== "ADMIN")) {
            return NextResponse.json({ error: "Solo Socios/Directores pueden eliminar eventos por completo" }, { status: 403 });
        }

        const { id } = await params;

        // Verify existance and get name for audit log
        const eventData = await prisma.event.findUnique({ where: { id } });
        if (!eventData) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

        // User requested: "eliminarlo por completo, que no haya rastro"
        // Since Prisma schema does not have onDelete: Cascade for everything, 
        // we must manually delete child relations in correct order inside a transaction:

        await prisma.$transaction(async (tx) => {
            // Level 3 / Deep dependencies
            await tx.taskMessage.deleteMany({ where: { task: { eventId: id } } });
            await tx.evidence.deleteMany({ where: { task: { eventId: id } } });
            await tx.voiceNote.deleteMany({ where: { task: { eventId: id } } });
            await tx.checklistItem.deleteMany({ where: { checklist: { eventId: id } } });
            await tx.checkIn.deleteMany({ where: { ticket: { eventId: id } } });
            await tx.payment.deleteMany({ where: { ticket: { eventId: id } } });

            // Level 2 / Direct Sub-children
            // First we need to delete any Subtasks that depend on other tasks in this event
            // Note: deleteMany doesn't handle self-relations recursively easily, but since they both 
            // share eventId, if we delete them all, it might complain about foreign keys if it processes parents first.
            // Prisma handles deleteMany in a single query usually, but occasionally self relations struggle. 
            // To be safe we first detach parents:
            await tx.task.updateMany({ where: { eventId: id }, data: { parentId: null } });

            // Now delete Level 2 relations
            await tx.task.deleteMany({ where: { eventId: id } });
            await tx.sponsorDeal.deleteMany({ where: { eventId: id } });
            await tx.ticket.deleteMany({ where: { eventId: id } });
            await tx.checklist.deleteMany({ where: { eventId: id } });
            await tx.incident.deleteMany({ where: { eventId: id } });
            await tx.supplierOrder.deleteMany({ where: { eventId: id } });
            await tx.participant.deleteMany({ where: { eventId: id } });
            await tx.budgetLine.deleteMany({ where: { eventId: id } });
            await tx.financialTransaction.deleteMany({ where: { eventId: id } });

            // Remove event linkage from any user's contractEventId
            await tx.user.updateMany({ where: { contractEventId: id }, data: { contractEventId: null } });

            // Remove logs
            await tx.auditLog.deleteMany({ where: { entityId: id, entity: "Event" } });

            // Finally, delete the Event itself
            await tx.event.delete({ where: { id } });
        });

        // Add a log for the deletion on the user's generic logs
        await prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "Event",
                entityId: id,
                userId: user.id,
                changes: { name: eventData.name, message: "Eliminación forzada por completo" },
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
