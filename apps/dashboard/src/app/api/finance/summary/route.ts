import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@eventos-prime/db";
import { NextResponse } from "next/server";

// GET /api/finance/summary — Financial KPIs for the dashboard
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || (dbUser.role !== "DIRECTOR" && dbUser.role !== "ADMIN")) {
            return NextResponse.json({ error: "No tienes permisos para ver finanzas" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        const period = searchParams.get("period") || "month"; // month, year, all

        // Calculate date range
        const now = new Date();
        let fromDate: Date;
        if (period === "month") {
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "year") {
            fromDate = new Date(now.getFullYear(), 0, 1);
        } else {
            fromDate = new Date(2020, 0, 1);
        }

        const where: any = {
            date: { gte: fromDate },
            status: { not: "ANULADO" },
        };
        if (eventId) where.eventId = eventId;

        // Fetch all non-voided transactions in period
        const transactions = await prisma.financialTransaction.findMany({
            where,
            select: { type: true, amount: true, category: true, taxAmount: true },
        });

        let totalIngresos = 0;
        let totalGastos = 0;
        let totalIVACobrado = 0;
        let totalIVAPagado = 0;
        const gastosPorCategoria: Record<string, number> = {};

        for (const t of transactions) {
            const amt = Number(t.amount);
            const tax = Number(t.taxAmount || 0);

            if (t.type === "INGRESO") {
                totalIngresos += amt;
                totalIVACobrado += tax;
            } else if (t.type === "GASTO") {
                totalGastos += amt;
                totalIVAPagado += tax;
                gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + amt;
            }
        }

        // Accounts summary
        const accounts = await prisma.financialAccount.findMany({
            where: { active: true },
            select: { name: true, balance: true, type: true },
        });

        const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

        // Recent transactions
        const recentTransactions = await prisma.financialTransaction.findMany({
            where: { status: { not: "ANULADO" } },
            include: {
                registeredBy: { select: { name: true, avatarUrl: true } },
                event: { select: { name: true } },
            },
            orderBy: { date: "desc" },
            take: 5,
        });

        // Budget vs real (if event selected)
        let budgetComparison: { category: string; planned: number; executed: number; difference: number; percentage: number }[] = [];
        if (eventId) {
            const budgetLines = await prisma.budgetLine.findMany({
                where: { eventId },
            });

            budgetComparison = budgetLines.map(bl => ({
                category: bl.category,
                planned: Number(bl.planned),
                executed: gastosPorCategoria[bl.category] || 0,
                difference: Number(bl.planned) - (gastosPorCategoria[bl.category] || 0),
                percentage: gastosPorCategoria[bl.category]
                    ? Math.round((gastosPorCategoria[bl.category] / Number(bl.planned)) * 100)
                    : 0,
            }));
        }

        return NextResponse.json({
            kpis: {
                totalIngresos: Math.round(totalIngresos * 100) / 100,
                totalGastos: Math.round(totalGastos * 100) / 100,
                balanceNeto: Math.round((totalIngresos - totalGastos) * 100) / 100,
                totalBalance: Math.round(totalBalance * 100) / 100,
                totalIVACobrado: Math.round(totalIVACobrado * 100) / 100,
                totalIVAPagado: Math.round(totalIVAPagado * 100) / 100,
                transactionCount: transactions.length,
            },
            gastosPorCategoria,
            accounts,
            recentTransactions,
            budgetComparison,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
