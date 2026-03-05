"use client";

import { useEffect, useState } from "react";

interface Event { id: string; name: string; }
interface BudgetLine {
    id: string; category: string; subcategory: string | null;
    planned: number; executed: number; difference: number; percentage: number;
}

const BUDGET_CATEGORIES = [
    "Marketing", "Producción", "Sonido", "Iluminación", "Escenario",
    "Logística", "Seguridad", "Catering", "Artistas", "Decoración",
    "Transporte", "Alquiler de Equipos", "Personal", "Seguros", "Tecnología", "Otro",
];

export default function PresupuestoPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [newPlanned, setNewPlanned] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/events").then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d); });
    }, []);

    useEffect(() => {
        if (selectedEvent) loadBudget();
    }, [selectedEvent]);

    async function loadBudget() {
        setLoading(true);
        const res = await fetch(`/api/finance/budgets?eventId=${selectedEvent}`);
        setBudgetLines(await res.json());
        setLoading(false);
    }

    async function addLine() {
        if (!newCategory || !newPlanned || !selectedEvent) return;
        setSaving(true);
        await fetch("/api/finance/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory, planned: newPlanned, eventId: selectedEvent }),
        });
        setNewCategory(""); setNewPlanned(""); setShowAdd(false); setSaving(false);
        loadBudget();
    }

    function formatCurrency(n: number) {
        return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
    }

    const totalPlanned = budgetLines.reduce((s, b) => s + b.planned, 0);
    const totalExecuted = budgetLines.reduce((s, b) => s + b.executed, 0);
    const totalDiff = totalPlanned - totalExecuted;

    return (
        <div style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--color-text-primary)" }}>
                        📊 Presupuesto
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Planificación vs ejecución real por categoría
                    </p>
                </div>
                <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{
                    padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)",
                    background: "var(--color-bg-input)", border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)", fontWeight: 600, fontSize: "var(--text-sm)",
                }}>
                    <option value="">Seleccionar evento</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            {!selectedEvent ? (
                <div className="glass-card" style={{ padding: "var(--space-12)", textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: "var(--space-4)" }}>📊</div>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-lg)" }}>Selecciona un evento para ver su presupuesto</p>
                </div>
            ) : loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>⏳ Cargando presupuesto...</div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                        <div className="glass-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Presupuestado</div>
                            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-accent)" }}>{formatCurrency(totalPlanned)}</div>
                        </div>
                        <div className="glass-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Ejecutado</div>
                            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "#ff5252" }}>{formatCurrency(totalExecuted)}</div>
                        </div>
                        <div className="glass-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Disponible</div>
                            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: totalDiff >= 0 ? "#00e676" : "#ff5252" }}>{formatCurrency(totalDiff)}</div>
                        </div>
                    </div>

                    {/* Budget Table */}
                    <div className="glass-card" style={{ padding: "var(--space-5)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                            <h3 style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Líneas de Presupuesto</h3>
                            <button onClick={() => setShowAdd(true)} style={{
                                padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)", border: "none",
                                background: "var(--color-accent)", color: "#000", fontWeight: 700, cursor: "pointer",
                            }}>+ Agregar Línea</button>
                        </div>

                        {budgetLines.length === 0 && !showAdd ? (
                            <p style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                                No hay líneas de presupuesto. Agrega la primera.
                            </p>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                        {["Categoría", "Presupuestado", "Ejecutado", "Diferencia", "% Avance", ""].map(h => (
                                            <th key={h} style={{
                                                textAlign: "left", padding: "var(--space-2) var(--space-3)",
                                                fontSize: "var(--text-xs)", color: "var(--color-text-muted)",
                                                textTransform: "uppercase", fontWeight: 600,
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {budgetLines.map(b => (
                                        <tr key={b.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                            <td style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>{b.category}</td>
                                            <td style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>{formatCurrency(b.planned)}</td>
                                            <td style={{ padding: "var(--space-3)", color: "#ff5252", fontWeight: 600, fontSize: "var(--text-sm)" }}>{formatCurrency(b.executed)}</td>
                                            <td style={{ padding: "var(--space-3)", color: b.difference >= 0 ? "#00e676" : "#ff5252", fontWeight: 700, fontSize: "var(--text-sm)" }}>{formatCurrency(b.difference)}</td>
                                            <td style={{ padding: "var(--space-3)", width: 200 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--color-bg-input)", overflow: "hidden" }}>
                                                        <div style={{
                                                            height: "100%",
                                                            width: `${Math.min(b.percentage, 100)}%`,
                                                            background: b.percentage > 100 ? "#ff5252" : b.percentage > 80 ? "#ffa726" : "#00e676",
                                                            borderRadius: 4,
                                                            transition: "width 0.5s ease",
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: b.percentage > 100 ? "#ff5252" : b.percentage > 80 ? "#ffa726" : "#00e676", minWidth: 40, textAlign: "right" }}>
                                                        {b.percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td />
                                        </tr>
                                    ))}
                                    {/* Add row */}
                                    {showAdd && (
                                        <tr style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(124,77,255,0.05)" }}>
                                            <td style={{ padding: "var(--space-2) var(--space-3)" }}>
                                                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{
                                                    padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-md)",
                                                    background: "var(--color-bg-input)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)",
                                                }}>
                                                    <option value="">Categoría</option>
                                                    {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: "var(--space-2) var(--space-3)" }}>
                                                <input type="number" step="0.01" value={newPlanned} onChange={e => setNewPlanned(e.target.value)} placeholder="$0.00"
                                                    style={{ width: 120, padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-md)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }} />
                                            </td>
                                            <td colSpan={3} style={{ padding: "var(--space-2) var(--space-3)" }}>
                                                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                                    <button onClick={addLine} disabled={saving || !newCategory || !newPlanned} style={{
                                                        padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-md)", border: "none",
                                                        background: "var(--color-accent)", color: "#000", fontWeight: 700, fontSize: "var(--text-xs)", cursor: "pointer",
                                                        opacity: (!newCategory || !newPlanned) ? 0.5 : 1,
                                                    }}>{saving ? "..." : "✓ Guardar"}</button>
                                                    <button onClick={() => setShowAdd(false)} style={{
                                                        padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-md)",
                                                        background: "var(--color-bg-input)", border: "1px solid var(--color-border)",
                                                        color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", cursor: "pointer",
                                                    }}>Cancelar</button>
                                                </div>
                                            </td>
                                            <td />
                                        </tr>
                                    )}
                                    {/* Total row */}
                                    {budgetLines.length > 0 && (
                                        <tr style={{ background: "rgba(124,77,255,0.05)" }}>
                                            <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>TOTAL</td>
                                            <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "var(--color-accent)", fontSize: "var(--text-sm)" }}>{formatCurrency(totalPlanned)}</td>
                                            <td style={{ padding: "var(--space-3)", fontWeight: 800, color: "#ff5252", fontSize: "var(--text-sm)" }}>{formatCurrency(totalExecuted)}</td>
                                            <td style={{ padding: "var(--space-3)", fontWeight: 800, color: totalDiff >= 0 ? "#00e676" : "#ff5252", fontSize: "var(--text-sm)" }}>{formatCurrency(totalDiff)}</td>
                                            <td style={{ padding: "var(--space-3)" }}>
                                                <span style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                                                    {totalPlanned > 0 ? Math.round((totalExecuted / totalPlanned) * 100) : 0}%
                                                </span>
                                            </td>
                                            <td />
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
