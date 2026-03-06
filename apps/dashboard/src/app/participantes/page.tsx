"use client";

import { useEffect, useState } from "react";

type ParticipantStage =
    | "CONTACTADO"
    | "RESPONDIDO"
    | "REUNION_PROGRAMADA"
    | "CONFIRMADO"
    | "CANCELADO";

interface Event {
    id: string;
    name: string;
}

interface Participant {
    id: string;
    name: string;
    type: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    stage: ParticipantStage;
    notes: string | null;
    eventId: string;
    event: Event;
    createdAt: string;
}

const stageConfig: Record<ParticipantStage, { label: string; color: string }> = {
    CONTACTADO: { label: "Contactado", color: "#71717a" },
    RESPONDIDO: { label: "Respondido", color: "#0ea5e9" },
    REUNION_PROGRAMADA: { label: "Reunión", color: "#f59e0b" },
    CONFIRMADO: { label: "Confirmado", color: "#22c55e" },
    CANCELADO: { label: "Cancelado", color: "#ef4444" },
};

const pipelineStages: ParticipantStage[] = [
    "CONTACTADO",
    "RESPONDIDO",
    "REUNION_PROGRAMADA",
    "CONFIRMADO",
    "CANCELADO",
];

export default function ParticipantesPage() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
    const [form, setForm] = useState({
        name: "",
        type: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        notes: "",
        eventId: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [partsRes, eventsRes] = await Promise.all([
                fetch("/api/participants"),
                fetch("/api/events"),
            ]);
            if (partsRes.ok) setParticipants(await partsRes.json());
            if (eventsRes.ok) setEvents(await eventsRes.json());
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/participants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                }),
            });
            if (res.ok) {
                setForm({
                    name: "",
                    type: "",
                    contactName: "",
                    contactEmail: "",
                    contactPhone: "",
                    notes: "",
                    eventId: "",
                });
                setShowForm(false);
                fetchData();
            }
        } catch {
        } finally {
            setSaving(false);
        }
    };

    const moveStage = async (participantId: string, newStage: ParticipantStage) => {
        try {
            await fetch("/api/participants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId, stage: newStage }),
            });
            fetchData();
        } catch { }
    };

    const participantsByStage = (stage: ParticipantStage) => {
        return participants.filter((p) => p.stage === stage);
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
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-6)",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--text-3xl)",
                            fontWeight: 800,
                        }}
                    >
                        Participantes e Instituciones
                    </h1>
                    <p
                        style={{
                            color: "var(--color-text-muted)",
                            fontSize: "var(--text-sm)",
                            marginTop: "var(--space-1)",
                        }}
                    >
                        {participants.length} registro{participants.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    <div
                        style={{
                            display: "flex",
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            border: "1px solid var(--color-border)",
                        }}
                    >
                        <button
                            onClick={() => setViewMode("pipeline")}
                            style={{
                                padding: "var(--space-2) var(--space-4)",
                                background:
                                    viewMode === "pipeline"
                                        ? "rgba(234,179,8,0.15)"
                                        : "var(--color-bg-card)",
                                color:
                                    viewMode === "pipeline"
                                        ? "var(--color-gold-400)"
                                        : "var(--color-text-secondary)",
                                border: "none",
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                            }}
                        >
                            Pipeline Kanban
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            style={{
                                padding: "var(--space-2) var(--space-4)",
                                background:
                                    viewMode === "list"
                                        ? "rgba(234,179,8,0.15)"
                                        : "var(--color-bg-card)",
                                color:
                                    viewMode === "list"
                                        ? "var(--color-gold-400)"
                                        : "var(--color-text-secondary)",
                                border: "none",
                                borderLeft: "1px solid var(--color-border)",
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                            }}
                        >
                            Lista
                        </button>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            padding: "var(--space-2) var(--space-5)",
                            background: showForm
                                ? "var(--color-bg-card)"
                                : "var(--gradient-gold)",
                            color: showForm
                                ? "var(--color-text-secondary)"
                                : "var(--color-bg-primary)",
                            border: showForm ? "1px solid var(--color-border)" : "none",
                            borderRadius: "var(--radius-lg)",
                            fontSize: "var(--text-sm)",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                        }}
                    >
                        {showForm ? "Cancelar" : "+ Nuevo Participante"}
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="glass-card"
                    style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}
                >
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            marginBottom: "var(--space-4)",
                        }}
                    >
                        Registrar Institución / Participante
                    </h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "var(--space-4)",
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Nombre (Entidad/Persona) *
                            </label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="Ej: Municipio de Guayaquil"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Tipo
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                style={{ ...inputStyle, cursor: "pointer" }}
                            >
                                <option value="">Selecciona tipo</option>
                                <option value="Institución Gubernamental">Institución Gubernamental</option>
                                <option value="Empresa Privada">Empresa Privada</option>
                                <option value="Medio de Comunicación">Medio de Comunicación</option>
                                <option value="Invitado Especial">Invitado Especial</option>
                                <option value="Persona Autónoma">Persona Autónoma</option>
                            </select>
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Nombre de Contacto
                            </label>
                            <input
                                value={form.contactName}
                                onChange={(e) =>
                                    setForm({ ...form, contactName: e.target.value })
                                }
                                placeholder="Nombre completo del enlace"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Email de Contacto
                            </label>
                            <input
                                type="email"
                                value={form.contactEmail}
                                onChange={(e) =>
                                    setForm({ ...form, contactEmail: e.target.value })
                                }
                                placeholder="contacto@institucion.gob.ec"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Teléfono / Móvil
                            </label>
                            <input
                                value={form.contactPhone}
                                onChange={(e) =>
                                    setForm({ ...form, contactPhone: e.target.value })
                                }
                                placeholder="+593 9xx xxx xxx"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Evento *
                            </label>
                            <select
                                required
                                value={form.eventId}
                                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                                style={{ ...inputStyle, cursor: "pointer" }}
                            >
                                <option value="">Seleccione evento (Requerido)</option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: "var(--space-1)",
                                }}
                            >
                                Notas u Observaciones
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Indicaciones, acuerdos o requerimientos especiales..."
                                rows={2}
                                style={{ ...inputStyle, resize: "vertical" }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            marginTop: "var(--space-4)",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "var(--space-3)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            style={{
                                padding: "var(--space-2) var(--space-4)",
                                background: "var(--color-bg-card)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-lg)",
                                color: "var(--color-text-secondary)",
                                fontSize: "var(--text-sm)",
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
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
                            }}
                        >
                            {saving ? "Guardando..." : "Registrar"}
                        </button>
                    </div>
                </form>
            )}

            {/* Pipeline Stats */}
            <div
                className="stats-grid"
                style={{
                    gridTemplateColumns: "repeat(5, 1fr)",
                    marginBottom: "var(--space-6)",
                }}
            >
                {pipelineStages.map((stage) => {
                    const config = stageConfig[stage];
                    const count = participantsByStage(stage).length;
                    return (
                        <div
                            key={stage}
                            className={`stat-card stat-card--${stage === "CONTACTADO" ? "neutral" : stage === "RESPONDIDO" ? "info" : stage === "REUNION_PROGRAMADA" ? "warning" : stage === "CONFIRMADO" ? "success" : "error"}`}
                            style={{ padding: "var(--space-3)", textAlign: "center" }}
                        >
                            <div className="stat-card-glow"></div>
                            <div
                                style={{
                                    fontSize: "var(--text-xs)",
                                    color: config.color,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    position: "relative",
                                    zIndex: 2,
                                }}
                            >
                                {config.label}
                            </div>
                            <div
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "var(--text-3xl)",
                                    fontWeight: 800,
                                    marginTop: "var(--space-1)",
                                    position: "relative",
                                    zIndex: 2,
                                }}
                            >
                                {count}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            border: "3px solid var(--color-border)",
                            borderTop: "3px solid var(--color-gold-400)",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto",
                        }}
                    />
                </div>
            ) : participants.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "var(--space-16)",
                        background: "var(--color-bg-card)",
                        border: "1px dashed var(--color-border)",
                        borderRadius: "var(--radius-xl)",
                    }}
                >
                    <p
                        style={{
                            color: "var(--color-text-secondary)",
                            fontSize: "var(--text-lg)",
                            fontWeight: 600,
                            fontFamily: "var(--font-display)"
                        }}
                    >
                        No hay instituciones o participantes registrados
                    </p>
                    <p
                        style={{
                            color: "var(--color-text-muted)",
                            fontSize: "var(--text-sm)",
                            marginTop: "var(--space-2)",
                        }}
                    >
                        Haz clic en "+ Nuevo Participante" para poblar este módulo de captación.
                    </p>
                </div>
            ) : viewMode === "pipeline" ? (
                /* Pipeline Kanban */
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "var(--space-3)",
                        minHeight: 300,
                    }}
                >
                    {pipelineStages.map((stage) => {
                        const config = stageConfig[stage];
                        const stageParts = participantsByStage(stage);
                        return (
                            <div
                                key={stage}
                                style={{
                                    background: "var(--color-bg-card)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-xl)",
                                    padding: "var(--space-3)",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "var(--text-xs)",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        color: config.color,
                                        padding: "var(--space-2)",
                                        marginBottom: "var(--space-2)",
                                        borderBottom: `2px solid ${config.color}30`,
                                    }}
                                >
                                    {config.label} ({stageParts.length})
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "var(--space-2)",
                                    }}
                                >
                                    {stageParts.map((p) => {
                                        const stageIdx = pipelineStages.indexOf(stage);
                                        return (
                                            <div
                                                key={p.id}
                                                style={{
                                                    background: "var(--color-bg-elevated)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "var(--radius-lg)",
                                                    padding: "var(--space-3)",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        fontSize: "var(--text-sm)",
                                                        marginBottom: "var(--space-1)",
                                                    }}
                                                >
                                                    {p.name}
                                                </div>
                                                {p.type && (
                                                    <div
                                                        style={{
                                                            fontSize: "10px",
                                                            color: "var(--color-text-muted)",
                                                        }}
                                                    >
                                                        {p.type}
                                                    </div>
                                                )}
                                                {p.contactName && (
                                                    <div
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "var(--color-text-secondary)",
                                                            marginTop: "var(--space-2)",
                                                        }}
                                                    >
                                                        👤 {p.contactName}
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "2px",
                                                        marginTop: "var(--space-3)",
                                                        alignItems: "center",
                                                        justifyContent: "space-between"
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => moveStage(p.id, pipelineStages[stageIdx - 1])}
                                                        disabled={stageIdx === 0}
                                                        style={{
                                                            fontSize: "10px",
                                                            padding: "2px 8px",
                                                            background: stageIdx === 0 ? "transparent" : "var(--color-bg-card)",
                                                            border: stageIdx === 0 ? "none" : "1px solid var(--color-border)",
                                                            borderRadius: "var(--radius-sm)",
                                                            color: stageIdx === 0 ? "transparent" : "var(--color-text-muted)",
                                                            cursor: stageIdx === 0 ? "default" : "pointer",
                                                        }}
                                                    >
                                                        ←
                                                    </button>
                                                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)", maxWidth: "80px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.event?.name}</span>
                                                    <button
                                                        onClick={() => moveStage(p.id, pipelineStages[stageIdx + 1])}
                                                        disabled={stageIdx === pipelineStages.length - 1}
                                                        style={{
                                                            fontSize: "10px",
                                                            padding: "2px 8px",
                                                            background: stageIdx === pipelineStages.length - 1 ? "transparent" : "var(--color-bg-card)",
                                                            border: stageIdx === pipelineStages.length - 1 ? "none" : "1px solid var(--color-border)",
                                                            borderRadius: "var(--radius-sm)",
                                                            color: stageIdx === pipelineStages.length - 1 ? "transparent" : "var(--color-text-muted)",
                                                            cursor: stageIdx === pipelineStages.length - 1 ? "default" : "pointer",
                                                        }}
                                                    >
                                                        →
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {stageParts.length === 0 && (
                                        <div
                                            style={{
                                                padding: "var(--space-4) var(--space-2)",
                                                textAlign: "center",
                                                color: "var(--color-text-muted)",
                                                fontSize: "10px",
                                            }}
                                        >
                                            Sin registros
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className="task-list">
                    {participants.map((p) => (
                        <div key={p.id} className="task-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--space-2)",
                                        marginBottom: "var(--space-1)",
                                    }}
                                >
                                    <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                                        {p.name}
                                    </span>
                                    {p.type && (
                                        <span
                                            style={{
                                                fontSize: "var(--text-xs)",
                                                color: "var(--color-text-muted)",
                                                padding: "1px 6px",
                                                background: "var(--color-bg-elevated)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "var(--radius-sm)",
                                            }}
                                        >
                                            {p.type}
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: "var(--text-xs)",
                                        color: "var(--color-text-secondary)",
                                        display: "flex",
                                        gap: "var(--space-4)",
                                    }}
                                >
                                    <span>
                                        📍 {p.event?.name}
                                    </span>
                                    {p.contactName && <span>👤 Contacto: {p.contactName} {p.contactPhone ? `(${p.contactPhone})` : ''}</span>}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                                <div
                                    style={{
                                        fontSize: "var(--text-xs)",
                                        padding: "4px 10px",
                                        borderRadius: "var(--radius-full)",
                                        background: `${stageConfig[p.stage].color}15`,
                                        color: stageConfig[p.stage].color,
                                        fontWeight: 600,
                                        border: `1px solid ${stageConfig[p.stage].color}30`,
                                    }}
                                >
                                    {stageConfig[p.stage].label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
