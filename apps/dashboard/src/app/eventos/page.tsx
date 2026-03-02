"use client";

import { useState } from "react";

// Types for the event form
interface EventFormData {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    budget: number;
    capacity: number;
}

export default function EventosPage() {
    const [showForm, setShowForm] = useState(false);
    const [events] = useState([
        {
            id: "prime-festival-2026",
            name: "Prime Festival 2026",
            status: "PLANIFICADO",
            startDate: "2026-06-01",
            endDate: "2026-06-02",
            location: "Por definir",
            budget: 0,
            capacity: 500,
            tasksCount: 0,
            sponsorsCount: 0,
        },
    ]);

    const [formData, setFormData] = useState<EventFormData>({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        budget: 0,
        capacity: 0,
    });

    const statusColors: Record<string, { bg: string; color: string; border: string }> = {
        BORRADOR: { bg: "rgba(113, 113, 122, 0.15)", color: "var(--color-text-muted)", border: "rgba(113, 113, 122, 0.3)" },
        PLANIFICADO: { bg: "rgba(245, 158, 11, 0.15)", color: "var(--color-warning)", border: "rgba(245, 158, 11, 0.3)" },
        EN_VIVO: { bg: "rgba(34, 197, 94, 0.15)", color: "var(--color-success)", border: "rgba(34, 197, 94, 0.3)" },
        CERRADO: { bg: "rgba(14, 165, 233, 0.15)", color: "var(--color-info)", border: "rgba(14, 165, 233, 0.3)" },
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        Eventos
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Gestiona todos tus eventos desde aquí
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: "var(--space-2) var(--space-5)",
                        background: "var(--gradient-gold)",
                        color: "var(--color-bg-primary)",
                        border: "none",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                    }}
                >
                    + Nuevo Evento
                </button>
            </div>

            {/* Create Event Form */}
            {showForm && (
                <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                        Crear Nuevo Evento
                    </h3>
                    <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Nombre del evento</label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Prime Festival 2026"
                                style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Fecha inicio</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Fecha fin</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Ubicación</label>
                            <input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ciudad, lugar..."
                                style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Presupuesto ($)</label>
                            <input
                                type="number"
                                value={formData.budget || ""}
                                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                placeholder="0.00"
                                style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Aforo máximo</label>
                            <input
                                type="number"
                                value={formData.capacity || ""}
                                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                placeholder="500"
                                style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}
                            />
                        </div>
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "var(--space-2) var(--space-5)", background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
                                Cancelar
                            </button>
                            <button type="submit" style={{ padding: "var(--space-2) var(--space-5)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700 }}>
                                Crear Evento
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Events List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {events.map((event) => {
                    const sc = statusColors[event.status] || statusColors.BORRADOR;
                    return (
                        <div key={event.id} className="event-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700 }}>
                                        {event.name}
                                    </h3>
                                    <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                                        <span>📅 {event.startDate}</span>
                                        <span>📍 {event.location}</span>
                                        <span>👥 {event.capacity} aforo</span>
                                    </div>
                                </div>
                                <span style={{
                                    padding: "var(--space-1) var(--space-3)",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "var(--text-xs)",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    background: sc.bg,
                                    color: sc.color,
                                    border: `1px solid ${sc.border}`,
                                }}>
                                    {event.status}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-6)", marginTop: "var(--space-4)", fontSize: "var(--text-sm)" }}>
                                <span style={{ color: "var(--color-text-secondary)" }}>✅ {event.tasksCount} tareas</span>
                                <span style={{ color: "var(--color-text-secondary)" }}>🏢 {event.sponsorsCount} sponsors</span>
                                <span style={{ color: "var(--color-text-secondary)" }}>💰 ${event.budget.toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
