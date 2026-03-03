"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Event {
    id: string;
    name: string;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
    status: "PENDIENTE" | "EN_PROGRESO" | "REVISION" | "COMPLETADA" | "CANCELADA";
    dueDate: string | null;
    evidenceRequired: boolean;
    assignee: { id: string; name: string; avatarUrl: string | null } | null;
    event: { id: string; name: string };
    _count: { evidence: number; voiceNotes: number; subtasks: number };
}

const priorityConfig = {
    URGENTE: { label: "🔴 Urgente", color: "var(--color-rag-red)" },
    ALTA: { label: "🟠 Alta", color: "var(--color-warning)" },
    MEDIA: { label: "🟡 Media", color: "var(--color-gold-400)" },
    BAJA: { label: "🟢 Baja", color: "var(--color-success)" },
};

const statusConfig = {
    PENDIENTE: { label: "Pendiente", color: "var(--color-text-muted)" },
    EN_PROGRESO: { label: "En progreso", color: "var(--color-info)" },
    REVISION: { label: "Revisión", color: "var(--color-gold-400)" },
    COMPLETADA: { label: "Completada", color: "var(--color-success)" },
    CANCELADA: { label: "Cancelada", color: "var(--color-error)" },
};

export default function UserTareasPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIA",
        eventId: "",
        dueDate: "",
        evidenceRequired: true,
        slaHours: "",
    });

    useEffect(() => {
        fetchData();
    }, [filterStatus]);

    const fetchData = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (filterStatus) queryParams.append("status", filterStatus);
            if (userId) queryParams.append("assigneeId", userId);

            const [tasksRes, eventsRes] = await Promise.all([
                fetch(`/api/tasks?${queryParams.toString()}`),
                fetch("/api/events"),
            ]);
            if (tasksRes.ok) setTasks(await tasksRes.json());
            if (eventsRes.ok) setEvents(await eventsRes.json());
        } catch { } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.eventId) return;
        setSaving(true);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    slaHours: form.slaHours ? parseInt(form.slaHours) : null,
                    assigneeId: userId
                }),
            });
            if (res.ok) {
                setForm({ title: "", description: "", priority: "MEDIA", eventId: "", dueDate: "", evidenceRequired: true, slaHours: "" });
                setShowForm(false);
                fetchData();
            }
        } catch { } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (taskId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: taskId, status: newStatus }),
            });
            if (res.ok) fetchData();
        } catch { }
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

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <button onClick={() => router.push("/tareas")} style={{ background: "transparent", color: "var(--color-gold-400)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, padding: 0, marginBottom: "var(--space-4)" }}>
                ← Volver al equipo
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        {tasks.length > 0 && tasks[0].assignee ? `Tareas de ${tasks[0].assignee.name}` : "Tareas del Responsable"}
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    {/* Filters */}
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{
                        ...inputStyle, width: "auto", cursor: "pointer",
                    }}>
                        <option value="">Todas</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="EN_PROGRESO">En Progreso</option>
                        <option value="REVISION">Revisión</option>
                        <option value="COMPLETADA">Completadas</option>
                    </select>
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
                        {showForm ? "Cancelar" : "+ Nueva Tarea"}
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "var(--space-4)" }}>Nueva Tarea</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Título *
                            </label>
                            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Montar escenario principal" style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Descripción
                            </label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles de la tarea..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Evento *
                            </label>
                            <select required value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                <option value="">Seleccionar evento...</option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Prioridad
                            </label>
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                <option value="BAJA">🟢 Baja</option>
                                <option value="MEDIA">🟡 Media</option>
                                <option value="ALTA">🟠 Alta</option>
                                <option value="URGENTE">🔴 Urgente</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                Fecha límite
                            </label>
                            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "var(--space-1)" }}>
                                SLA (horas)
                            </label>
                            <input type="number" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: e.target.value })} placeholder="24" style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <input type="checkbox" id="evidence" checked={form.evidenceRequired} onChange={(e) => setForm({ ...form, evidenceRequired: e.target.checked })} />
                            <label htmlFor="evidence" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                                📸 Requiere evidencia fotográfica
                            </label>
                        </div>
                    </div>
                    <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                        <button type="button" onClick={() => setShowForm(false)} style={{
                            padding: "var(--space-2) var(--space-4)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "var(--font-sans)",
                        }}>Cancelar</button>
                        <button type="submit" disabled={saving} style={{
                            padding: "var(--space-2) var(--space-5)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", opacity: saving ? 0.7 : 1,
                        }}>{saving ? "Guardando..." : "Crear Tarea"}</button>
                    </div>
                </form>
            )}

            {/* Task List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
            ) : tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-16)", background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-xl)" }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>📋</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>
                        {filterStatus ? "No hay tareas con ese filtro" : "No hay tareas creadas aún"}
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                        {!filterStatus && "Primero crea un evento, luego podrás asignar tareas"}
                    </p>
                </div>
            ) : (
                <div className="task-list">
                    {tasks.map((task) => {
                        const priority = priorityConfig[task.priority];
                        const status = statusConfig[task.status];
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETADA";
                        const ragClass = isOverdue ? "overdue" : task.status === "PENDIENTE" && task.dueDate ? "due-soon" : "on-track";

                        return (
                            <div key={task.id} className={`task-item ${ragClass}`}>
                                {/* Status Toggle */}
                                <button onClick={() => {
                                    const next: Record<string, string> = {
                                        PENDIENTE: "EN_PROGRESO",
                                        EN_PROGRESO: "REVISION",
                                        REVISION: "COMPLETADA",
                                        COMPLETADA: "PENDIENTE",
                                    };
                                    updateStatus(task.id, next[task.status] || "PENDIENTE");
                                }} style={{
                                    width: 24, height: 24, borderRadius: "50%", border: `2px solid ${status.color}`,
                                    background: task.status === "COMPLETADA" ? "var(--color-success)" : "transparent",
                                    cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "var(--text-xs)", color: "#fff",
                                }}>
                                    {task.status === "COMPLETADA" && "✓"}
                                </button>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                                        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", textDecoration: task.status === "COMPLETADA" ? "line-through" : "none", color: task.status === "COMPLETADA" ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
                                            {task.title}
                                        </span>
                                        <span style={{ fontSize: "var(--text-xs)", color: priority.color }}>{priority.label}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                        <span>🎪 {task.event.name}</span>
                                        {task.dueDate && (
                                            <span style={{ color: isOverdue ? "var(--color-rag-red)" : "var(--color-text-muted)" }}>
                                                📅 {new Date(task.dueDate).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                                                {isOverdue && " ⚠️ Vencida"}
                                            </span>
                                        )}
                                        {task.evidenceRequired && <span>📸 Evidencia</span>}
                                        {task._count.evidence > 0 && <span>🖼️ {task._count.evidence}</span>}
                                        {task._count.subtasks > 0 && <span>📌 {task._count.subtasks} sub</span>}
                                        {task.assignee && <span>👤 {task.assignee.name}</span>}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span style={{
                                    fontSize: "var(--text-xs)", padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-full)",
                                    background: `${status.color}20`, color: status.color, fontWeight: 600, whiteSpace: "nowrap",
                                }}>
                                    {status.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
