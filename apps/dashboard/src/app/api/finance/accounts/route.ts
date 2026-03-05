import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/finance/accounts — List all financial accounts
export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const accounts = await prisma.financialAccount.findMany({
            where: { active: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/finance/accounts — Create a new financial account
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await request.json();
        const { name, type, bankName, accountNum, currency } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
        }

        const account = await prisma.financialAccount.create({
            data: { name, type, bankName, accountNum, currency: currency || "USD" },
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
