import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/finance/budgets — List budget lines for an event
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

        const budgetLines = await prisma.budgetLine.findMany({
            where: { eventId },
            orderBy: { category: "asc" },
        });

        // Calculate executed amounts from actual transactions
        const transactions = await prisma.financialTransaction.findMany({
            where: { eventId, type: "GASTO", status: { not: "ANULADO" } },
            select: { category: true, amount: true },
        });

        const executedByCategory: Record<string, number> = {};
        for (const t of transactions) {
            executedByCategory[t.category] = (executedByCategory[t.category] || 0) + Number(t.amount);
        }

        const result = budgetLines.map(bl => ({
            ...bl,
            planned: Number(bl.planned),
            executed: executedByCategory[bl.category] || 0,
            difference: Number(bl.planned) - (executedByCategory[bl.category] || 0),
            percentage: executedByCategory[bl.category]
                ? Math.round((executedByCategory[bl.category] / Number(bl.planned)) * 100)
                : 0,
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/finance/budgets — Create a budget line
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { category, subcategory, planned, eventId } = body;

        if (!category || !planned || !eventId) {
            return NextResponse.json({ error: "category, planned y eventId son requeridos" }, { status: 400 });
        }

        const budgetLine = await prisma.budgetLine.create({
            data: {
                category,
                subcategory,
                planned: parseFloat(planned),
                eventId,
            },
        });

        return NextResponse.json(budgetLine, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
