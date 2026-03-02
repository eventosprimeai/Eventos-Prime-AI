"use client";

import { useEffect, useState } from "react";

interface Event {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    location: string | null;
    venue: string | null;
    capacity: number;
    budget: string;
    _count: { tasks: number; sponsorDeals: number; tickets: number };
}

export default function EventosPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        venue: "",
        capacity: "",
        budget: "",
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) setEvents(await res.json());
        } catch { } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    capacity: parseInt(form.capacity) || 0,
                    budget: parseFloat(form.budget) || 0,
                }),
            });

            if (res.ok) {
                setForm({ name: "", description: "", startDate: "", endDate: "", location: "", venue: "", capacity: "", budget: "" });
                setShowForm(false);
                fetchEvents();
            }
        } catch { } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "var(--space-2) var(--space-3)",
        background: "var(--color-bg-input)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        color: "var(--color-text-primary)",
        fontSize: "var(--text-sm)",
        fontFamily: "var(--font-sans)",
    };

    const statusConfig: Record<string, { label: string; color: string }> = {
        BORRADOR: { label: "Borrador", color: "var(--color-text-muted)" },
        PLANIFICADO: { label: "Planificado", color: "var(--color-info)" },
        PRE_PRODUCCION: { label: "Pre-producción", color: "var(--color-gold-400)" },
        EN_VIVO: { label: "🔴 En vivo", color: "var(--color-rag-red)" },
        POST_PRODUCCION: { label: "Post-producción", color: "var(--color-prime-400)" },
        CERRADO: { label: "Cerrado", color: "var(--color-success)" },
        CANCELADO: { label: "Cancelado", color: "var(--color-error)" },
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        Eventos
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        {events.length} evento{events.length !== 1 ? "s" : ""} registrado{events.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{
                    padding: "var(--space-2) var(--space-5)",
                    background: showForm ? "var(--color-bg-card)" : "var(--gradient-gold)",
                    color: showForm ? "var(--color-text-secondary)" : "var(--color-bg-primary)",
                    border: showForm ? "1px solid var(--color-border)" : "none",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                }}>
                    {showForm ? "Cancelar" : "+ Crear Evento"}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "var(--space-4)" }}>Nuevo Evento</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Nombre del evento *
                            </label>
                            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Prime Festival 2026" style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Descripción
                            </label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del evento..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Fecha inicio *
                            </label>
                            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Fecha fin *
                            </label>
                            <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Ciudad
                            </label>
                            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Guayaquil" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Venue
                            </label>
                            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Ej: Centro de Convenciones" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Capacidad
                            </label>
                            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="5000" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Presupuesto (USD)
                            </label>
                            <input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="50000" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                        <button type="button" onClick={() => setShowForm(false)} style={{
                            padding: "var(--space-2) var(--space-4)",
                            background: "var(--color-bg-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            color: "var(--color-text-secondary)",
                            fontSize: "var(--text-sm)",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                        }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} style={{
                            padding: "var(--space-2) var(--space-5)",
                            background: "var(--gradient-gold)",
                            color: "var(--color-bg-primary)",
                            border: "none",
                            borderRadius: "var(--radius-lg)",
                            fontSize: "var(--text-sm)",
                            fontWeight: 700,
                            cursor: saving ? "not-allowed" : "pointer",
                            fontFamily: "var(--font-sans)",
                            opacity: saving ? 0.7 : 1,
                        }}>
                            {saving ? "Guardando..." : "Crear Evento"}
                        </button>
                    </div>
                </form>
            )}

            {/* Events List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
            ) : events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-16)", background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-xl)" }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>🎪</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>No hay eventos creados aún</p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                        Haz click en &quot;+ Crear Evento&quot; para empezar
                    </p>
                </div>
            ) : (
                <div className="event-grid">
                    {events.map((event) => {
                        const status = statusConfig[event.status] || { label: event.status, color: "var(--color-text-muted)" };
                        const start = new Date(event.startDate);
                        const daysUntil = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                        return (
                            <div key={event.id} className="event-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "var(--space-3)" }}>
                                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700 }}>
                                        {event.name}
                                    </h3>
                                    <span style={{
                                        fontSize: "var(--text-xs)",
                                        padding: "var(--space-1) var(--space-2)",
                                        borderRadius: "var(--radius-full)",
                                        background: `${status.color}20`,
                                        color: status.color,
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                    }}>
                                        {status.label}
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                                        📅 {start.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
                                        {daysUntil > 0 && <span style={{ color: "var(--color-gold-400)", fontWeight: 600 }}> — en {daysUntil} días</span>}
                                        {daysUntil === 0 && <span style={{ color: "var(--color-rag-red)", fontWeight: 600 }}> — ¡Hoy!</span>}
                                    </p>
                                    {event.location && <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>📍 {event.location}{event.venue && ` — ${event.venue}`}</p>}
                                    {event.capacity > 0 && <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>👥 Capacidad: {event.capacity.toLocaleString()}</p>}
                                </div>

                                <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                                    <span>📋 {event._count.tasks} tareas</span>
                                    <span>🏢 {event._count.sponsorDeals} sponsors</span>
                                    <span>🎟️ {event._count.tickets} tickets</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
