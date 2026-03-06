import { NextRequest, NextResponse } from "next/server";
import { prisma, ParticipantStage } from "@eventos-prime/db";

const WEBHOOK_SECRET = process.env.MARKETING_WEBHOOK_SECRET || "prime-marketing-123";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Missing lead ID" }, { status: 400 });
        }

        const data = await request.json();

        const updateData: any = {};
        if (data.stage) updateData.stage = data.stage;
        if (data.notes) updateData.notes = data.notes;
        if (data.contactName) updateData.contactName = data.contactName;
        if (data.contactEmail) updateData.contactEmail = data.contactEmail;
        if (data.contactPhone) updateData.contactPhone = data.contactPhone;

        const updatedLead = await prisma.participant.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: updatedLead }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating marketing lead:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
