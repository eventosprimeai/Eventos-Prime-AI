"use client";

import { useState } from "react";

type Priority = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
type TaskStatus = "PENDIENTE" | "EN_PROGRESO" | "REVISION" | "COMPLETADA";

interface Task {
    id: string;
    title: string;
    assignedTo: string;
    priority: Priority;
    status: TaskStatus;
    dueDate: string;
    evidenceRequired: boolean;
    eventName: string;
}

const priorityConfig: Record<Priority, { color: string; bg: string; border: string }> = {
    BAJA: { color: "var(--color-text-muted)", bg: "rgba(113, 113, 122, 0.15)", border: "rgba(113, 113, 122, 0.3)" },
    MEDIA: { color: "var(--color-info)", bg: "rgba(14, 165, 233, 0.15)", border: "rgba(14, 165, 233, 0.3)" },
    ALTA: { color: "var(--color-warning)", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    URGENTE: { color: "var(--color-error)", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
};

const statusConfig: Record<TaskStatus, { color: string; bg: string; icon: string }> = {
    PENDIENTE: { color: "var(--color-text-muted)", bg: "rgba(113, 113, 122, 0.15)", icon: "⬜" },
    EN_PROGRESO: { color: "var(--color-info)", bg: "rgba(14, 165, 233, 0.15)", icon: "🔄" },
    REVISION: { color: "var(--color-warning)", bg: "rgba(245, 158, 11, 0.15)", icon: "👀" },
    COMPLETADA: { color: "var(--color-success)", bg: "rgba(34, 197, 94, 0.15)", icon: "✅" },
};

export default function TareasPage() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filter, setFilter] = useState<string>("TODAS");

    // Mock tasks — will be replaced with Supabase
    const [tasks] = useState<Task[]>([]);

    const filteredTasks = filter === "TODAS" ? tasks : tasks.filter((t) => t.status === filter);
    const filters = ["TODAS", "PENDIENTE", "EN_PROGRESO", "REVISION", "COMPLETADA"];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        Tareas
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        {tasks.length} tareas · {tasks.filter((t) => t.status === "COMPLETADA").length} completadas
                    </p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    {/* Voice record button */}
                    <button style={{
                        padding: "var(--space-2) var(--space-4)",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "var(--color-error)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                    }}>
                        🎤 Nota de Voz
                    </button>

                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
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
                        + Nueva Tarea
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "var(--space-1) var(--space-4)",
                            background: filter === f ? "rgba(234, 179, 8, 0.15)" : "var(--color-bg-card)",
                            color: filter === f ? "var(--color-gold-400)" : "var(--color-text-secondary)",
                            border: `1px solid ${filter === f ? "rgba(234, 179, 8, 0.3)" : "var(--color-border)"}`,
                            borderRadius: "var(--radius-full)",
                            fontSize: "var(--text-sm)",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                            transition: "var(--transition-fast)",
                        }}
                    >
                        {f.replace("_", " ")}
                    </button>
                ))}
            </div>

            {/* Create Task Form */}
            {showCreateForm && (
                <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                        Crear Nueva Tarea
                    </h3>
                    <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Título</label>
                            <input placeholder="Describir la tarea..." style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Asignar a</label>
                            <select style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}>
                                <option>Seleccionar miembro...</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Prioridad</label>
                            <select style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}>
                                <option>BAJA</option>
                                <option>MEDIA</option>
                                <option selected>ALTA</option>
                                <option>URGENTE</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Fecha límite</label>
                            <input type="date" style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>Evento</label>
                            <select style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-base)", fontFamily: "var(--font-sans)" }}>
                                <option>Prime Festival 2026</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", paddingTop: "var(--space-5)" }}>
                            <input type="checkbox" id="evidence" defaultChecked />
                            <label htmlFor="evidence" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                                Requiere evidencia (foto/video)
                            </label>
                        </div>
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: "var(--space-2) var(--space-5)", background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
                                Cancelar
                            </button>
                            <button type="submit" style={{ padding: "var(--space-2) var(--space-5)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700 }}>
                                Crear Tarea
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task List or Empty State */}
            {filteredTasks.length === 0 ? (
                <div style={{
                    padding: "var(--space-16)",
                    textAlign: "center",
                    background: "var(--color-bg-card)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>✅</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>
                        No hay tareas {filter !== "TODAS" ? `con estado "${filter.replace("_", " ")}"` : "creadas aún"}
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                        Crea una tarea manualmente o usa una nota de voz 🎤
                    </p>
                </div>
            ) : (
                <div className="task-list">
                    {filteredTasks.map((task) => {
                        const priority = priorityConfig[task.priority];
                        const status = statusConfig[task.status];
                        return (
                            <div key={task.id} className="task-item" style={{ cursor: "pointer" }}>
                                <span>{status.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{task.title}</div>
                                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                                        👤 {task.assignedTo} · 📅 {task.dueDate} · 🎪 {task.eventName}
                                    </div>
                                </div>
                                <span style={{
                                    padding: "var(--space-1) var(--space-2)",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "var(--text-xs)",
                                    fontWeight: 600,
                                    background: priority.bg,
                                    color: priority.color,
                                    border: `1px solid ${priority.border}`,
                                }}>
                                    {task.priority}
                                </span>
                                {task.evidenceRequired && (
                                    <span style={{ fontSize: "var(--text-sm)" }} title="Requiere evidencia">📷</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
