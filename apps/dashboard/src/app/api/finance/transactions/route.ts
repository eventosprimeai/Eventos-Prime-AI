import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/finance/transactions — List transactions with filters
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        const type = searchParams.get("type");
        const category = searchParams.get("category");
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const status = searchParams.get("status");

        const where: any = {};
        if (eventId) where.eventId = eventId;
        if (type) where.type = type;
        if (category) where.category = category;
        if (status) where.status = status;
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const transactions = await prisma.financialTransaction.findMany({
            where,
            include: {
                account: { select: { name: true, bankName: true } },
                event: { select: { name: true } },
                supplier: { select: { companyName: true } },
                registeredBy: { select: { name: true, avatarUrl: true } },
                approvedBy: { select: { name: true } },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json(transactions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/finance/transactions — Create a transaction
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const {
            type, category, subcategory, description, amount,
            taxAmount, taxRate, date, reference,
            attachmentUrl, attachmentName, ocrData,
            accountId, eventId, supplierId,
        } = body;

        if (!type || !category || !description || !amount || !date || !eventId) {
            return NextResponse.json({ error: "Campos requeridos: type, category, description, amount, date, eventId" }, { status: 400 });
        }

        const transaction = await prisma.financialTransaction.create({
            data: {
                type,
                category,
                subcategory,
                description,
                amount: parseFloat(amount),
                taxAmount: taxAmount ? parseFloat(taxAmount) : null,
                taxRate: taxRate ? parseFloat(taxRate) : null,
                date: new Date(date),
                reference,
                attachmentUrl,
                attachmentName,
                ocrData,
                accountId,
                eventId,
                supplierId,
                registeredById: user.id,
            },
            include: {
                account: { select: { name: true } },
                event: { select: { name: true } },
                registeredBy: { select: { name: true } },
            },
        });

        // Update account balance if linked
        if (accountId) {
            const delta = type === "INGRESO" ? parseFloat(amount) : -parseFloat(amount);
            await prisma.financialAccount.update({
                where: { id: accountId },
                data: { balance: { increment: delta } },
            });
        }

        return NextResponse.json(transaction, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
