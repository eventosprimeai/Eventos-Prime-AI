import { NextRequest, NextResponse } from "next/server";
import { prisma, ParticipantStage } from "@eventos-prime/db";

const WEBHOOK_SECRET = process.env.MARKETING_WEBHOOK_SECRET || "prime-marketing-123";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        if (!data.name || !data.eventId) {
            return NextResponse.json({ error: "Missing required fields: name, eventId" }, { status: 400 });
        }

        const newLead = await prisma.participant.create({
            data: {
                name: data.name,
                type: data.type || "INSTITUCION",
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                stage: data.stage || ParticipantStage.PROSPECTO,
                notes: data.notes,
                source: data.source || "Webhook",
                city: data.city,
                website: data.website,
                socialUrl: data.socialUrl,
                eventId: data.eventId,
            }
        });

        return NextResponse.json({ success: true, data: newLead }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating marketing lead:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
