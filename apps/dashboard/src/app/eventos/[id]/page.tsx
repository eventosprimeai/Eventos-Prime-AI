"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface EventDetail {
    id: string;
    name: string;
    description: string | null;
    status: string;
    startDate: string;
    endDate: string;
    location: string | null;
    venue: string | null;
    capacity: number;
    budget: string;
    createdAt: string;
    tasks: { id: string; title: string; status: string; priority: string; assignee: { name: string } | null }[];
    sponsorDeals: { id: string; stage: string; sponsor: { companyName: string; industry: string | null } }[];
    _count: { tasks: number; sponsorDeals: number; tickets: number; checklists: number; incidents: number };
}

const statusConfig: Record<string, { label: string; color: string }> = {
    BORRADOR: { label: "Borrador", color: "#71717a" },
    PLANIFICADO: { label: "Planificado", color: "#38bdf8" },
    PRE_PRODUCCION: { label: "Pre-producción", color: "#facc15" },
    EN_VIVO: { label: "🔴 En vivo", color: "#ef4444" },
    POST_PRODUCCION: { label: "Post-producción", color: "#7dd3fc" },
    CERRADO: { label: "Cerrado", color: "#22c55e" },
    CANCELADO: { label: "Cancelado", color: "#ef4444" },
};

const allStatuses = ["BORRADOR", "PLANIFICADO", "PRE_PRODUCCION", "EN_VIVO", "POST_PRODUCCION", "CERRADO", "CANCELADO"];

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [form, setForm] = useState({
        name: "", description: "", startDate: "", endDate: "",
        location: "", venue: "", capacity: "", budget: "", status: "",
    });

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
                setForm({
                    name: data.name,
                    description: data.description || "",
                    startDate: data.startDate.split("T")[0],
                    endDate: data.endDate.split("T")[0],
                    location: data.location || "",
                    venue: data.venue || "",
                    capacity: String(data.capacity),
                    budget: String(data.budget),
                    status: data.status,
                });
            } else {
                router.push("/eventos");
            }
        } catch { router.push("/eventos"); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    capacity: parseInt(form.capacity) || 0,
                    budget: parseFloat(form.budget) || 0,
                }),
            });
            if (res.ok) {
                setEditing(false);
                fetchEvent();
            } else {
                const data = await res.json();
                alert("Error: " + data.error);
            }
        } catch { alert("Error de conexión"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (deleting) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/eventos");
            } else {
                const data = await res.json();
                alert(data.error);
                setConfirmDelete(false);
            }
        } catch { alert("Error de conexión"); }
        finally { setDeleting(false); }
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

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
        );
    }

    if (!event) return null;

    const status = statusConfig[event.status] || { label: event.status, color: "#71717a" };
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const daysUntil = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <div className="animate-fade-in">
            {/* Back + Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <button onClick={() => router.push("/eventos")} style={{
                    display: "flex", alignItems: "center", gap: "var(--space-2)",
                    background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>
                    ← Volver a Eventos
                </button>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    {!editing ? (
                        <>
                            <button onClick={() => setEditing(true)} style={{
                                padding: "var(--space-2) var(--space-4)",
                                background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                                color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "var(--font-sans)",
                            }}>✏️ Editar</button>
                            <button onClick={() => setConfirmDelete(true)} style={{
                                padding: "var(--space-2) var(--space-4)",
                                background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-lg)",
                                color: "var(--color-error)", fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "var(--font-sans)",
                            }}>🗑️ Eliminar</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setEditing(false); fetchEvent(); }} style={{
                                padding: "var(--space-2) var(--space-4)",
                                background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                                color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "var(--font-sans)",
                            }}>Cancelar</button>
                            <button onClick={handleSave} disabled={saving} style={{
                                padding: "var(--space-2) var(--space-5)",
                                background: "var(--gradient-gold)", border: "none", borderRadius: "var(--radius-lg)",
                                color: "var(--color-bg-primary)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", opacity: saving ? 0.7 : 1,
                            }}>{saving ? "Guardando..." : "💾 Guardar Cambios"}</button>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            {confirmDelete && (
                <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                    <h3 style={{ color: "var(--color-error)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                        ⚠️ ¿Eliminar este evento?
                    </h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                        Esta acción no se puede deshacer. Se eliminará <strong>{event.name}</strong> permanentemente.
                    </p>
                    <div style={{ display: "flex", gap: "var(--space-3)" }}>
                        <button onClick={() => setConfirmDelete(false)} style={{
                            padding: "var(--space-2) var(--space-4)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                            color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "var(--font-sans)",
                        }}>No, cancelar</button>
                        <button onClick={handleDelete} disabled={deleting} style={{
                            padding: "var(--space-2) var(--space-5)", background: "var(--color-error)", border: "none", borderRadius: "var(--radius-lg)",
                            color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)",
                        }}>{deleting ? "Eliminando..." : "Sí, eliminar evento"}</button>
                    </div>
                </div>
            )}

            {/* Event Header */}
            <div className="glass-card" style={{ padding: "var(--space-8)", marginBottom: "var(--space-6)" }}>
                {editing ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Nombre *</label>
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Descripción</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Estado</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                {allStatuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Ciudad</label>
                            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Venue</label>
                            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Capacidad</label>
                            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Fecha inicio</label>
                            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Fecha fin</label>
                            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Presupuesto (USD)</label>
                            <input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} style={inputStyle} />
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "var(--space-4)" }}>
                            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                                {event.name}
                            </h1>
                            <span style={{
                                fontSize: "var(--text-sm)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-full)",
                                background: `${status.color}20`, color: status.color, fontWeight: 600,
                            }}>{status.label}</span>
                        </div>

                        {event.description && (
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", lineHeight: 1.7, marginBottom: "var(--space-6)" }}>
                                {event.description}
                            </p>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
                            <div>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "var(--space-1)" }}>Fecha</div>
                                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                                    📅 {start.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
                                    {daysUntil > 0 && <span style={{ color: "var(--color-gold-400)", display: "block", fontSize: "var(--text-xs)" }}>En {daysUntil} días</span>}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "var(--space-1)" }}>Ubicación</div>
                                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                                    📍 {event.location || "Sin definir"}{event.venue && ` — ${event.venue}`}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "var(--space-1)" }}>Capacidad</div>
                                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                                    👥 {event.capacity > 0 ? event.capacity.toLocaleString() + " personas" : "Sin definir"}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "var(--space-1)" }}>Presupuesto</div>
                                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-gold-400)", fontWeight: 600 }}>
                                    💰 ${parseFloat(event.budget).toLocaleString()} USD
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                <div className="stat-card" style={{ padding: "var(--space-3)", textAlign: "center" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Tareas</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700 }}>{event._count.tasks}</div>
                </div>
                <div className="stat-card" style={{ padding: "var(--space-3)", textAlign: "center" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Sponsors</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700 }}>{event._count.sponsorDeals}</div>
                </div>
                <div className="stat-card" style={{ padding: "var(--space-3)", textAlign: "center" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Tickets</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700 }}>{event._count.tickets}</div>
                </div>
                <div className="stat-card" style={{ padding: "var(--space-3)", textAlign: "center" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Checklists</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700 }}>{event._count.checklists}</div>
                </div>
                <div className="stat-card" style={{ padding: "var(--space-3)", textAlign: "center" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Incidencias</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700 }}>{event._count.incidents}</div>
                </div>
            </div>

            {/* Recent Tasks */}
            {event.tasks.length > 0 && (
                <div style={{ marginTop: "var(--space-6)" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                        Últimas Tareas
                    </h2>
                    <div className="task-list">
                        {event.tasks.map((task) => (
                            <div key={task.id} className="task-item">
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{task.title}</span>
                                    {task.assignee && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>👤 {task.assignee.name}</span>}
                                </div>
                                <span style={{
                                    fontSize: "var(--text-xs)", padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-full)",
                                    background: "var(--color-bg-elevated)", color: "var(--color-text-muted)", fontWeight: 600,
                                }}>{task.status.replace("_", " ")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sponsors */}
            {event.sponsorDeals.length > 0 && (
                <div style={{ marginTop: "var(--space-6)" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                        Sponsors Asociados
                    </h2>
                    <div className="task-list">
                        {event.sponsorDeals.map((deal) => (
                            <div key={deal.id} className="task-item">
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>🏢 {deal.sponsor.companyName}</span>
                                    {deal.sponsor.industry && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>{deal.sponsor.industry}</span>}
                                </div>
                                <span style={{
                                    fontSize: "var(--text-xs)", padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-full)",
                                    background: "var(--color-bg-elevated)", color: "var(--color-text-muted)", fontWeight: 600,
                                }}>{deal.stage}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div style={{ marginTop: "var(--space-8)", padding: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    ID: {event.id} — Creado: {new Date(event.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
            </div>
        </div>
    );
}
