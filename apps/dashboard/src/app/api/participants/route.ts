import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/participants?eventId=xxx — list participants for an event
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        const where: any = {};
        if (eventId) where.eventId = eventId;

        const participants = await prisma.participant.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                event: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(participants);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/participants — create a participant
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();

        if (!body.name || !body.eventId) {
            return NextResponse.json({ error: "name y eventId son requeridos" }, { status: 400 });
        }

        const participant = await prisma.participant.create({
            data: {
                name: body.name,
                type: body.type || null,
                contactName: body.contactName || null,
                contactEmail: body.contactEmail || null,
                contactPhone: body.contactPhone || null,
                stage: "CONTACTADO",
                notes: body.notes || null,
                eventId: body.eventId,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Participant",
                entityId: participant.id,
                userId: user.id,
                changes: body,
            },
        });

        return NextResponse.json(participant, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/participants — update participant stage
export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { participantId, stage, notes } = body;

        if (!participantId) {
            return NextResponse.json({ error: "participantId requerido" }, { status: 400 });
        }

        const updateData: any = {};
        if (stage) updateData.stage = stage;
        if (notes !== undefined) updateData.notes = notes;

        const participant = await prisma.participant.update({
            where: { id: participantId },
            data: updateData,
        });

        return NextResponse.json(participant);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
