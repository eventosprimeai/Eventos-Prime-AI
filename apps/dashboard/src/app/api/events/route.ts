import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/events — list all events
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const isPublic = searchParams.get('public') === 'true';

        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isPublic) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        if (isPublic) {
            const publicEvents = await prisma.event.findMany({
                where: { status: { notIn: ["CERRADO", "CANCELADO"] } },
                select: { id: true, name: true, status: true },
                orderBy: { createdAt: "desc" }
            });
            return NextResponse.json(publicEvents);
        }

        const events = await prisma.event.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        tasks: { where: { status: { notIn: ["COMPLETADA", "CANCELADA"] } } },
                        sponsorDeals: true,
                        tickets: true
                    }
                },
            },
        });

        return NextResponse.json(events);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/events — create a new event
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || (dbUser.role !== "DIRECTOR" && dbUser.role !== "ADMIN")) {
            return NextResponse.json({ error: "Solo los Directores o Socios pueden crear eventos" }, { status: 403 });
        }

        const body = await request.json();

        const event = await prisma.event.create({
            data: {
                name: body.name,
                description: body.description || null,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                location: body.location || null,
                venue: body.venue || null,
                capacity: body.capacity || 0,
                budget: body.budget || 0,
                status: "PLANIFICADO",
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Event",
                entityId: event.id,
                userId: user.id,
                changes: body,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
