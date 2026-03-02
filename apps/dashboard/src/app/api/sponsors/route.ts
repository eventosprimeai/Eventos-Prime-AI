import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/sponsors — list sponsors with their deals
export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const sponsors = await prisma.sponsor.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                deals: {
                    orderBy: { updatedAt: "desc" },
                    include: {
                        event: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return NextResponse.json(sponsors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/sponsors — create a new sponsor + initial deal
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();

        const sponsor = await prisma.sponsor.create({
            data: {
                companyName: body.companyName,
                industry: body.industry || null,
                contactName: body.contactName || null,
                contactEmail: body.contactEmail || null,
                contactPhone: body.contactPhone || null,
                website: body.website || null,
                notes: body.notes || null,
                affinityScore: body.affinityScore || null,
                ...(body.eventId ? {
                    deals: {
                        create: {
                            stage: "PROSPECTO",
                            dealValue: body.dealValue || null,
                            eventId: body.eventId,
                        },
                    },
                } : {}),
            },
            include: { deals: true },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Sponsor",
                entityId: sponsor.id,
                userId: user.id,
                changes: body,
            },
        });

        return NextResponse.json(sponsor, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/sponsors — update sponsor deal stage (pipeline move)
export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();

        if (body.dealId && body.stage) {
            const deal = await prisma.sponsorDeal.update({
                where: { id: body.dealId },
                data: {
                    stage: body.stage,
                    lastContactAt: new Date(),
                    ...(body.stage === "CERRADO" ? { closedAt: new Date() } : {}),
                    ...(body.dealValue !== undefined ? { dealValue: body.dealValue } : {}),
                    ...(body.notes !== undefined ? { notes: body.notes } : {}),
                },
            });

            await prisma.auditLog.create({
                data: {
                    action: "UPDATE_STAGE",
                    entity: "SponsorDeal",
                    entityId: body.dealId,
                    userId: user.id,
                    changes: { stage: body.stage },
                },
            });

            return NextResponse.json(deal);
        }

        if (body.sponsorId) {
            const sponsor = await prisma.sponsor.update({
                where: { id: body.sponsorId },
                data: {
                    ...(body.companyName ? { companyName: body.companyName } : {}),
                    ...(body.contactName ? { contactName: body.contactName } : {}),
                    ...(body.contactEmail ? { contactEmail: body.contactEmail } : {}),
                    ...(body.contactPhone ? { contactPhone: body.contactPhone } : {}),
                    ...(body.notes !== undefined ? { notes: body.notes } : {}),
                },
            });
            return NextResponse.json(sponsor);
        }

        return NextResponse.json({ error: "dealId o sponsorId requerido" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
