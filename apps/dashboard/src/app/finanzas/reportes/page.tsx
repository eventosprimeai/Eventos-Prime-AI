"use client";

import { useEffect, useState } from "react";

interface Transaction {
    id: string; type: string; category: string; description: string;
    amount: number; taxAmount: number | null; date: string; status: string;
    event: { name: string } | null;
    registeredBy: { name: string } | null;
}

type ReportType = "pl" | "category" | "monthly";

export default function ReportesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<ReportType>("pl");
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const res = await fetch("/api/finance/transactions");
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
    }

    function formatCurrency(n: number) {
        return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
    }

    // P&L Report
    function getPLData() {
        const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year && t.status !== "ANULADO");
        const ingresos = filtered.filter(t => t.type === "INGRESO");
        const gastos = filtered.filter(t => t.type === "GASTO");
        const totalIngresos = ingresos.reduce((s, t) => s + Number(t.amount), 0);
        const totalGastos = gastos.reduce((s, t) => s + Number(t.amount), 0);
        const totalIVACobrado = ingresos.reduce((s, t) => s + Number(t.taxAmount || 0), 0);
        const totalIVAPagado = gastos.reduce((s, t) => s + Number(t.taxAmount || 0), 0);

        // Group gastos by category
        const gastosByCategory: Record<string, number> = {};
        gastos.forEach(t => { gastosByCategory[t.category] = (gastosByCategory[t.category] || 0) + Number(t.amount); });
        const ingresosByCategory: Record<string, number> = {};
        ingresos.forEach(t => { ingresosByCategory[t.category] = (ingresosByCategory[t.category] || 0) + Number(t.amount); });

        return { totalIngresos, totalGastos, totalIVACobrado, totalIVAPagado, gastosByCategory, ingresosByCategory };
    }

    // Monthly Report
    function getMonthlyData() {
        const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year && t.status !== "ANULADO");
        const months = Array.from({ length: 12 }, (_, i) => {
            const monthTx = filtered.filter(t => new Date(t.date).getMonth() === i);
            const ingresos = monthTx.filter(t => t.type === "INGRESO").reduce((s, t) => s + Number(t.amount), 0);
            const gastos = monthTx.filter(t => t.type === "GASTO").reduce((s, t) => s + Number(t.amount), 0);
            return {
                month: new Date(year, i).toLocaleString("es-EC", { month: "long" }),
                ingresos, gastos, balance: ingresos - gastos, count: monthTx.length,
            };
        });
        return months;
    }

    function exportCSV() {
        let csv = "";
        if (reportType === "pl") {
            const pl = getPLData();
            csv = "Concepto,Monto\n";
            csv += `Total Ingresos,${pl.totalIngresos}\n`;
            Object.entries(pl.ingresosByCategory).forEach(([cat, amt]) => { csv += `  ${cat},${amt}\n`; });
            csv += `Total Gastos,${pl.totalGastos}\n`;
            Object.entries(pl.gastosByCategory).forEach(([cat, amt]) => { csv += `  ${cat},${amt}\n`; });
            csv += `Utilidad Neta,${pl.totalIngresos - pl.totalGastos}\n`;
            csv += `IVA Cobrado,${pl.totalIVACobrado}\n`;
            csv += `IVA Pagado,${pl.totalIVAPagado}\n`;
        } else if (reportType === "monthly") {
            csv = "Mes,Ingresos,Gastos,Balance,Transacciones\n";
            getMonthlyData().forEach(m => { csv += `${m.month},${m.ingresos},${m.gastos},${m.balance},${m.count}\n`; });
        } else {
            const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year);
            csv = "Fecha,Tipo,Categoría,Descripción,Monto,IVA,Estado\n";
            filtered.forEach(t => { csv += `${t.date},${t.type},${t.category},"${t.description}",${t.amount},${t.taxAmount || 0},${t.status}\n`; });
        }
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `reporte_${reportType}_${year}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    const pl = getPLData();
    const monthly = getMonthlyData();

    return (
        <div style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--color-text-primary)" }}>
                        📈 Reportes Financieros
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Informes de P&L, análisis mensual y exportación de datos
                    </p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} style={{
                        padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-lg)",
                        background: "var(--color-bg-input)", border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)", fontWeight: 600,
                    }}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={exportCSV} style={{
                        padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)", border: "none",
                        background: "var(--color-accent)", color: "#000", fontWeight: 700, cursor: "pointer",
                    }}>📥 Exportar CSV</button>
                </div>
            </div>

            {/* Report Type Selector */}
            <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
                {[
                    { key: "pl" as ReportType, label: "📊 Estado de Resultados (P&L)" },
                    { key: "monthly" as ReportType, label: "📅 Resumen Mensual" },
                    { key: "category" as ReportType, label: "📒 Detalle por Transacción" },
                ].map(r => (
                    <button key={r.key} onClick={() => setReportType(r.key)} style={{
                        padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)",
                        border: reportType === r.key ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                        background: reportType === r.key ? "rgba(124,77,255,0.1)" : "var(--color-bg-input)",
                        color: reportType === r.key ? "var(--color-accent)" : "var(--color-text-secondary)",
                        fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer",
                    }}>{r.label}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>⏳ Cargando...</div>
            ) : (
                <>
                    {/* P&L Report */}
                    {reportType === "pl" && (
                        <div className="glass-card" style={{ padding: "var(--space-6)" }}>
                            <h2 style={{ fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", textAlign: "center", fontSize: "var(--text-xl)" }}>
                                Estado de Resultados — {year}
                            </h2>
                            <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 600, margin: "0 auto" }}>
                                <tbody>
                                    <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                                        <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "#00e676", fontSize: "var(--text-lg)" }}>INGRESOS</td>
                                        <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "#00e676", fontSize: "var(--text-lg)", textAlign: "right" }}>{formatCurrency(pl.totalIngresos)}</td>
                                    </tr>
                                    {Object.entries(pl.ingresosByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                                        <tr key={cat} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                            <td style={{ padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-6)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>{cat}</td>
                                            <td style={{ padding: "var(--space-2) var(--space-3)", textAlign: "right", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>{formatCurrency(amt)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ borderBottom: "2px solid var(--color-border)", marginTop: "var(--space-4)" }}>
                                        <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "#ff5252", fontSize: "var(--text-lg)", paddingTop: "var(--space-4)" }}>GASTOS</td>
                                        <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "#ff5252", fontSize: "var(--text-lg)", textAlign: "right", paddingTop: "var(--space-4)" }}>{formatCurrency(pl.totalGastos)}</td>
                                    </tr>
                                    {Object.entries(pl.gastosByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                                        <tr key={cat} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                            <td style={{ padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-6)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>{cat}</td>
                                            <td style={{ padding: "var(--space-2) var(--space-3)", textAlign: "right", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>{formatCurrency(amt)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ borderTop: "3px solid var(--color-accent)", background: "rgba(124,77,255,0.05)" }}>
                                        <td style={{ padding: "var(--space-4)", fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--color-text-primary)" }}>UTILIDAD NETA</td>
                                        <td style={{ padding: "var(--space-4)", fontWeight: 800, fontSize: "var(--text-xl)", textAlign: "right", color: (pl.totalIngresos - pl.totalGastos) >= 0 ? "#00e676" : "#ff5252" }}>
                                            {formatCurrency(pl.totalIngresos - pl.totalGastos)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Monthly Report */}
                    {reportType === "monthly" && (
                        <div className="glass-card" style={{ padding: "var(--space-6)" }}>
                            <h2 style={{ fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", textAlign: "center", fontSize: "var(--text-xl)" }}>
                                Resumen Mensual — {year}
                            </h2>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                                        {["Mes", "Ingresos", "Gastos", "Balance", "Txs"].map(h => (
                                            <th key={h} style={{ textAlign: h === "Mes" ? "left" : "right", padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthly.map((m, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", opacity: m.count === 0 ? 0.4 : 1 }}>
                                            <td style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "var(--text-sm)", textTransform: "capitalize" }}>{m.month}</td>
                                            <td style={{ padding: "var(--space-3)", textAlign: "right", color: "#00e676", fontWeight: 600, fontSize: "var(--text-sm)" }}>{formatCurrency(m.ingresos)}</td>
                                            <td style={{ padding: "var(--space-3)", textAlign: "right", color: "#ff5252", fontWeight: 600, fontSize: "var(--text-sm)" }}>{formatCurrency(m.gastos)}</td>
                                            <td style={{ padding: "var(--space-3)", textAlign: "right", color: m.balance >= 0 ? "#00e676" : "#ff5252", fontWeight: 700, fontSize: "var(--text-sm)" }}>{formatCurrency(m.balance)}</td>
                                            <td style={{ padding: "var(--space-3)", textAlign: "right", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>{m.count}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ borderTop: "3px solid var(--color-accent)", background: "rgba(124,77,255,0.05)" }}>
                                        <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "var(--color-text-primary)" }}>TOTAL</td>
                                        <td style={{ padding: "var(--space-3)", textAlign: "right", fontWeight: 800, color: "#00e676" }}>{formatCurrency(monthly.reduce((s, m) => s + m.ingresos, 0))}</td>
                                        <td style={{ padding: "var(--space-3)", textAlign: "right", fontWeight: 800, color: "#ff5252" }}>{formatCurrency(monthly.reduce((s, m) => s + m.gastos, 0))}</td>
                                        <td style={{ padding: "var(--space-3)", textAlign: "right", fontWeight: 800, color: monthly.reduce((s, m) => s + m.balance, 0) >= 0 ? "#00e676" : "#ff5252" }}>
                                            {formatCurrency(monthly.reduce((s, m) => s + m.balance, 0))}
                                        </td>
                                        <td style={{ padding: "var(--space-3)", textAlign: "right", fontWeight: 800, color: "var(--color-text-muted)" }}>{monthly.reduce((s, m) => s + m.count, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Transaction Detail */}
                    {reportType === "category" && (
                        <div className="glass-card" style={{ padding: "var(--space-6)" }}>
                            <h2 style={{ fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", textAlign: "center", fontSize: "var(--text-xl)" }}>
                                Detalle de Transacciones — {year}
                            </h2>
                            {transactions.filter(t => new Date(t.date).getFullYear() === year).length === 0 ? (
                                <p style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>No hay transacciones en {year}</p>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                                            {["Fecha", "Tipo", "Categoría", "Descripción", "Monto", "IVA", "Estado"].map(h => (
                                                <th key={h} style={{ textAlign: "left", padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.filter(t => new Date(t.date).getFullYear() === year).map(t => (
                                            <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                                <td style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{new Date(t.date).toLocaleDateString("es-EC")}</td>
                                                <td style={{ padding: "var(--space-2) var(--space-3)" }}>
                                                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: t.type === "INGRESO" ? "#00e676" : "#ff5252" }}>{t.type}</span>
                                                </td>
                                                <td style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{t.category}</td>
                                                <td style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-primary)" }}>{t.description}</td>
                                                <td style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)", fontWeight: 700, color: t.type === "INGRESO" ? "#00e676" : "#ff5252" }}>{formatCurrency(Number(t.amount))}</td>
                                                <td style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{t.taxAmount ? formatCurrency(Number(t.taxAmount)) : "—"}</td>
                                                <td style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{t.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
