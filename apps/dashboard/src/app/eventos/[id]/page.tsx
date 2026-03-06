"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ─── Types ───────────────────────────────────────── */
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
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assignee: { id: string; name: string; role: string } | null;
  }[];
  sponsorDeals: {
    id: string;
    stage: string;
    dealValue: string | null;
    sponsor: { companyName: string; industry: string | null };
  }[];
  supplierOrders: {
    id: string;
    description: string;
    status: string;
    amount: string | null;
    dueDate: string | null;
    supplier: { id: string; companyName: string; category: string | null; contactName: string | null };
  }[];
  participants: {
    id: string;
    name: string;
    type: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    stage: string;
    notes: string | null;
  }[];
  incidents: {
    id: string;
    title: string;
    severity: string;
    resolved: boolean;
    resolvedAt: string | null;
  }[];
  _count: {
    tasks: number;
    sponsorDeals: number;
    tickets: number;
    supplierOrders: number;
    participants: number;
  };
}

type ActiveTab =
  | "tareas"
  | "sponsors"
  | "tickets"
  | "proveedores"
  | "participantes"
  | null;

const statusConfig: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: "Borrador", color: "#71717a" },
  PLANIFICADO: { label: "Planificado (old)", color: "#38bdf8" },
  EN_PLANIFICACION: { label: "En Planificación", color: "#38bdf8" },
  PRE_PRODUCCION: { label: "Pre-producción", color: "#facc15" },
  EN_VIVO: { label: "En vivo (old)", color: "#ef4444" },
  EN_EJECUCION: { label: "En Ejecución", color: "#ef4444" },
  POST_PRODUCCION: { label: "Post-producción (old)", color: "#7dd3fc" },
  POST_EVENTO: { label: "Post-evento", color: "#7dd3fc" },
  CERRADO: { label: "Cerrado (old)", color: "#22c55e" },
  FINALIZADO: { label: "Finalizado", color: "#22c55e" },
  CANCELADO: { label: "Cancelado", color: "#ef4444" },
};
const allStatuses = [
  "BORRADOR",
  "EN_PLANIFICACION",
  "PRE_PRODUCCION",
  "EN_EJECUCION",
  "POST_EVENTO",
  "FINALIZADO",
  "CANCELADO",
];
const CHART_COLORS = [
  "#facc15",
  "#38bdf8",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

const taskStatusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  REVISION: "Revisión",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};
const taskPriorityLabels: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};
const roleLabels: Record<string, string> = {
  DIRECTOR: "Director",
  ADMIN: "Administrador",
  COORDINADOR: "Coordinador",
  STAFF: "Ejecutivo/Staff",
  PROVEEDOR: "Proveedor",
  SPONSOR: "Sponsor",
};

/* ─── Tooltip personalizado ──────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#16161e",
        border: "1px solid #2a2a36",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "#f5f5f7", fontWeight: 600, fontSize: 13 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill, fontSize: 12 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────── */
export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    venue: "",
    capacity: "",
    budget: "",
    status: "",
  });

  const [team, setTeam] = useState<
    { id: string; name: string; role: string }[]
  >([]);

  useEffect(() => {
    fetchEvent();
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }

      const authRes = await fetch("/api/auth/sync", { method: "POST" });
      if (authRes.ok) {
        const { dbUser } = await authRes.json();
        if (dbUser?.role === "DIRECTOR" || dbUser?.role === "ADMIN") {
          setIsDirector(true);
        }
      }
    } catch { }
  };

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
    } catch {
      router.push("/eventos");
    } finally {
      setLoading(false);
    }
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
        const d = await res.json();
        alert("Error: " + d.error);
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/eventos");
      } else {
        const d = await res.json();
        alert(d.error);
        setConfirmDelete(false);
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setDeleting(false);
    }
  };

  const toggleTab = (tab: ActiveTab) =>
    setActiveTab(activeTab === tab ? null : tab);

  /* ─── Chart data builders ─────────────────────── */
  const buildTasksByStatus = () => {
    if (!event) return [];
    const counts: Record<string, number> = {};
    event.tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({
      name: taskStatusLabels[k] || k,
      value: v,
    }));
  };

  const buildTasksByPriority = () => {
    if (!event) return [];
    const counts: Record<string, number> = {};
    // Only count active tasks for priority analysis too to be coherent
    event.tasks
      .filter((t) => t.status !== "COMPLETADA" && t.status !== "CANCELADA")
      .forEach((t) => {
        counts[t.priority] = (counts[t.priority] || 0) + 1;
      });
    return Object.entries(counts).map(([k, v]) => ({
      name: taskPriorityLabels[k] || k,
      value: v,
    }));
  };

  const buildTasksByAssignee = () => {
    if (!event) return [];
    const counts: Record<string, { count: number; id: string | null }> = {};

    // 1. Initialize with all team members to ensure total coherency (everyone shows up)
    team.forEach((member) => {
      const roleStr = ` - ${roleLabels[member.role] || member.role}`;
      const name = `${member.name}${roleStr}`;
      counts[name] = { count: 0, id: member.id };
    });

    // 2. Add unassigned or external people currently associated with tasks
    event.tasks.forEach((t) => {
      const roleStr = t.assignee?.role
        ? ` - ${roleLabels[t.assignee.role] || t.assignee.role}`
        : "";
      const name = t.assignee ? `${t.assignee.name}${roleStr}` : "Sin asignar";
      if (!counts[name]) {
        counts[name] = { count: 0, id: t.assignee?.id || null };
      }
    });

    // 3. Perform the actual active task count
    event.tasks.forEach((t) => {
      if (t.status !== "COMPLETADA" && t.status !== "CANCELADA") {
        const roleStr = t.assignee?.role
          ? ` - ${roleLabels[t.assignee.role] || t.assignee.role}`
          : "";
        const name = t.assignee
          ? `${t.assignee.name}${roleStr}`
          : "Sin asignar";
        counts[name].count += 1;
      }
    });

    return Object.entries(counts)
      .map(([k, v]) => ({ name: k, tareas: v.count, id: v.id }))
      .sort((a, b) => b.tareas - a.tareas); // sort mostly by count descending
  };

  const buildSponsorInvestment = () => {
    if (!event) return { data: [], total: 0 };
    const data = event.sponsorDeals
      .filter((d) => d.dealValue)
      .map((d) => ({
        name: d.sponsor.companyName,
        value: parseFloat(d.dealValue!),
        industry: d.sponsor.industry || "N/A",
      }))
      .sort((a, b) => b.value - a.value);
    const total = data.reduce((s, d) => s + d.value, 0);
    return {
      data: data.map((d) => ({
        ...d,
        percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
      })),
      total,
    };
  };

  const buildSponsorsByStage = () => {
    if (!event) return [];
    const counts: Record<string, number> = {};
    event.sponsorDeals.forEach((d) => {
      counts[d.stage] = (counts[d.stage] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));
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

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid var(--color-border)",
            borderTop: "3px solid var(--color-gold-400)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  if (!event) return null;

  const status = statusConfig[event.status] || {
    label: event.status,
    color: "#71717a",
  };
  const start = new Date(event.startDate);
  const daysUntil = Math.ceil(
    (start.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const tabConfig: {
    key: ActiveTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
      {
        key: "tareas",
        label: "Tareas",
        icon: (
          <span className="nav-dot" style={{ display: "inline-block" }}></span>
        ),
        count: event._count.tasks,
      },
      {
        key: "sponsors",
        label: "Sponsors",
        icon: (
          <span className="nav-dot" style={{ display: "inline-block" }}></span>
        ),
        count: event._count.sponsorDeals,
      },
      {
        key: "tickets",
        label: "Tickets",
        icon: (
          <span className="nav-dot" style={{ display: "inline-block" }}></span>
        ),
        count: event._count.tickets,
      },
      {
        key: "proveedores",
        label: "Proveedores",
        icon: (
          <span className="nav-dot" style={{ display: "inline-block" }}></span>
        ),
        count: event._count.supplierOrders,
      },
      {
        key: "participantes",
        label: "Participantes",
        icon: (
          <span className="nav-dot" style={{ display: "inline-block" }}></span>
        ),
        count: event._count.participants,
      },
    ];

  return (
    <div className="animate-fade-in">
      {/* ── Back + Actions ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-6)",
        }}
      >
        <button
          onClick={() => router.push("/eventos")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          ← Volver a Eventos
        </button>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
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
                Editar
              </button>
              {isDirector && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    padding: "var(--space-2) var(--space-4)",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "var(--radius-lg)",
                    color: "var(--color-error)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Eliminar
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  fetchEvent();
                }}
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
                onClick={handleSave}
                disabled={saving}
                className="glow-button"
                style={{
                  padding: "var(--space-2) var(--space-5)",
                  fontSize: "var(--text-sm)",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Delete Confirm ── */}
      {confirmDelete && (
        <div
          className="glass-card"
          style={{
            padding: "var(--space-6)",
            marginBottom: "var(--space-6)",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          <h3
            style={{
              color: "var(--color-error)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              marginBottom: "var(--space-2)",
            }}
          >
            ¿Eliminar este evento?
          </h3>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-sm)",
              marginBottom: "var(--space-4)",
            }}
          >
            Esta acción no se puede deshacer. Se eliminará{" "}
            <strong>{event.name}</strong> permanentemente.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button
              onClick={() => setConfirmDelete(false)}
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
              No, cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: "var(--space-2) var(--space-5)",
                background: "var(--color-error)",
                border: "none",
                borderRadius: "var(--radius-lg)",
                color: "#fff",
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                cursor: deleting ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {deleting ? "Eliminando..." : "Sí, eliminar evento"}
            </button>
          </div>
        </div>
      )}

      {/* ── Event Header Card ── */}
      <div
        className="glass-card"
        style={{ padding: "var(--space-8)", marginBottom: "var(--space-6)" }}
      >
        {editing ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
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
                Nombre *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
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
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
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
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s]?.label || s}
                  </option>
                ))}
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
                Ciudad
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                Venue
              </label>
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
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
                Capacidad
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
                Fecha inicio
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
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
                Fecha fin
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
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
                Presupuesto (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "var(--space-4)",
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: 800,
                }}
              >
                {event.name}
              </h1>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  background: `${status.color}20`,
                  color: status.color,
                  fontWeight: 600,
                }}
              >
                {status.label}
              </span>
            </div>
            {/* Description with paragraphs */}
            {event.description && (
              <div style={{ marginBottom: "var(--space-6)" }}>
                {event.description
                  .split("\n")
                  .filter((p) => p.trim())
                  .map((paragraph, i) => (
                    <p
                      key={i}
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "var(--text-base)",
                        lineHeight: 1.8,
                        marginBottom: "var(--space-3)",
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "var(--space-4)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Fecha
                </div>
                <div style={{ fontSize: "var(--text-sm)" }}>
                  {start.toLocaleDateString("es-EC", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {daysUntil > 0 && (
                    <span
                      style={{
                        color: "var(--color-gold-400)",
                        display: "block",
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      En {daysUntil} días
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Ubicación
                </div>
                <div style={{ fontSize: "var(--text-sm)" }}>
                  {event.location || "Sin definir"}
                  {event.venue && ` — ${event.venue}`}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Capacidad
                </div>
                <div style={{ fontSize: "var(--text-sm)" }}>
                  {event.capacity > 0
                    ? event.capacity.toLocaleString() + " personas"
                    : "Sin definir"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Presupuesto
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-gold-400)",
                    fontWeight: 600,
                  }}
                >
                  ${parseFloat(event.budget).toLocaleString()} USD
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Interactive Stats Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
      >
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;

          let variant = "neutral";
          if (tab.count > 0) {
            if (tab.key === "proveedores") variant = "warning";
            else if (tab.key === "tareas") variant = "info";
            else if (tab.key === "sponsors" || tab.key === "tickets") variant = "success";
            else if (tab.key === "participantes") variant = "prime";
          }
          if (isActive && tab.count === 0) variant = "prime"; // Give it some color when active even if 0

          return (
            <button
              key={tab.key}
              onClick={() => toggleTab(tab.key)}
              className={`stat-card stat-card--${variant}`}
              style={{
                cursor: "pointer",
                padding: "var(--space-4)",
                textAlign: "center",
                fontFamily: "var(--font-sans)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: isActive ? "rgba(20, 15, 30, 0.8)" : undefined,
                borderColor: isActive ? "var(--color-gold-500)" : undefined,
                boxShadow: isActive ? "0 0 15px rgba(0, 214, 143, 0.1)" : undefined,
              }}
            >
              <div className="stat-card-glow"></div>
              <div
                style={{
                  fontSize: "var(--text-lg)",
                  marginBottom: "var(--space-2)",
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 1
                }}
              >
                {tab.icon}
              </div>
              <div
                className="stat-label"
                style={{
                  fontSize: "var(--text-xs)",
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "var(--space-1)",
                  position: "relative",
                  zIndex: 1
                }}
              >
                {tab.label}
              </div>
              <div
                className="stat-value"
                style={{
                  color: isActive ? "var(--color-gold-400)" : "var(--color-text-primary)",
                  position: "relative",
                  zIndex: 1
                }}
              >
                {tab.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  DYNAMIC SECTIONS — Expand below stats cards  */}
      {/* ══════════════════════════════════════════════ */}

      {/* ── TAREAS Section ── */}
      {activeTab === "tareas" && (
        <div
          className="glass-card animate-fade-in"
          style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              marginBottom: "var(--space-6)",
            }}
          >
            Análisis de Tareas — {event.name}
          </h2>
          {event.tasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-8)",
                color: "var(--color-text-muted)",
              }}
            >
              <p style={{ fontSize: "var(--text-lg)" }}>
                No hay tareas asignadas a este evento
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  marginTop: "var(--space-2)",
                }}
              >
                Ve a{" "}
                <a href="/tareas" style={{ color: "var(--color-gold-400)" }}>
                  Tareas
                </a>{" "}
                para crear la primera
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-6)",
              }}
            >
              {/* Tareas por estado — Pie */}
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  Por Estado
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={buildTasksByStatus()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {buildTasksByStatus().map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Tareas por prioridad — Pie */}
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  Por Prioridad
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={buildTasksByPriority()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {buildTasksByPriority().map((_, i) => (
                        <Cell
                          key={i}
                          fill={["#22c55e", "#facc15", "#f59e0b", "#ef4444"][i]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Tareas por responsable — Bar */}
              <div style={{ gridColumn: "1 / -1" }}>
                <h3
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  Tareas por Responsable
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={buildTasksByAssignee()}
                    layout="vertical"
                    margin={{ left: 80 }}
                    barSize={35}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a36" />
                    <XAxis
                      type="number"
                      tick={{ fill: "#71717a", fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      width={200}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar
                      dataKey="tareas"
                      fill="#facc15"
                      radius={[0, 4, 4, 0]}
                      style={{
                        cursor: "pointer",
                        transition: "var(--transition-fast)",
                      }}
                      onClick={(data) => {
                        if (data.id) router.push(`/tareas/${data.id}`);
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SPONSORS Section ── */}
      {activeTab === "sponsors" &&
        (() => {
          const { data: investData, total } = buildSponsorInvestment();
          const stageData = buildSponsorsByStage();
          return (
            <div
              className="glass-card animate-fade-in"
              style={{
                padding: "var(--space-6)",
                marginBottom: "var(--space-6)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  marginBottom: "var(--space-6)",
                }}
              >
                Sponsors — {event.name}
              </h2>
              {event.sponsorDeals.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--space-8)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <p style={{ fontSize: "var(--text-lg)" }}>
                    No hay sponsors asociados
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    Ve a{" "}
                    <a
                      href="/sponsors"
                      style={{ color: "var(--color-gold-400)" }}
                    >
                      Sponsors
                    </a>{" "}
                    para agregar empresas
                  </p>
                </div>
              ) : (
                <>
                  {/* Total investment banner */}
                  <div
                    style={{
                      textAlign: "center",
                      padding: "var(--space-4)",
                      background: "rgba(234,179,8,0.08)",
                      borderRadius: "var(--radius-xl)",
                      marginBottom: "var(--space-6)",
                      border: "1px solid var(--color-border-gold)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      Inversión Total de Sponsors
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-4xl)",
                        fontWeight: 800,
                        color: "var(--color-gold-400)",
                      }}
                    >
                      ${total.toLocaleString()} USD
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {event.sponsorDeals.length} empresa
                      {event.sponsorDeals.length !== 1 ? "s" : ""} en el
                      pipeline
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-6)",
                    }}
                  >
                    {/* Inversión por sponsor — Pie */}
                    <div>
                      <h3
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          marginBottom: "var(--space-3)",
                        }}
                      >
                        Participación de Inversión
                      </h3>
                      {investData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={investData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, percent }) =>
                                `${name}: ${percent}%`
                              }
                            >
                              {investData.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "var(--text-sm)",
                            textAlign: "center",
                            padding: "var(--space-8)",
                          }}
                        >
                          Agrega valores a los deals para ver el gráfico
                        </p>
                      )}
                    </div>
                    {/* Sponsors por etapa — Bar */}
                    <div>
                      <h3
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          marginBottom: "var(--space-3)",
                        }}
                      >
                        Sponsors por Etapa del Pipeline
                      </h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stageData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#2a2a36"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#71717a", fontSize: 11 }}
                          />
                          <YAxis tick={{ fill: "#71717a", fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="value"
                            fill="#38bdf8"
                            radius={[4, 4, 0, 0]}
                            name="Sponsors"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Sponsor list with investment */}
                  <div style={{ marginTop: "var(--space-4)" }}>
                    <h3
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        marginBottom: "var(--space-3)",
                      }}
                    >
                      Detalle de Inversión
                    </h3>
                    <div className="task-list">
                      {event.sponsorDeals.map((d) => (
                        <div key={d.id} className="task-item">
                          <div style={{ flex: 1 }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "var(--text-sm)",
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-2)",
                              }}
                            >
                              <span
                                className="nav-dot"
                                style={{ display: "inline-block" }}
                              ></span>
                              {d.sponsor.companyName}
                            </span>
                            {d.sponsor.industry && (
                              <span
                                style={{
                                  fontSize: "var(--text-xs)",
                                  color: "var(--color-text-muted)",
                                  marginLeft: "var(--space-2)",
                                }}
                              >
                                {d.sponsor.industry}
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "var(--text-sm)",
                              color: "var(--color-gold-400)",
                              fontWeight: 600,
                              marginRight: "var(--space-3)",
                            }}
                          >
                            {d.dealValue
                              ? `$${parseFloat(d.dealValue).toLocaleString()}`
                              : "—"}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--color-bg-elevated)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {d.stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

      {/* ── TICKETS Section ── */}
      {activeTab === "tickets" && (
        <div
          className="glass-card animate-fade-in"
          style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              marginBottom: "var(--space-6)",
            }}
          >
            Tickets — {event.name}
          </h2>
          <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "var(--space-4)",
                marginBottom: "var(--space-6)",
              }}
            >
              {[
                {
                  label: "General",
                  icon: (
                    <span
                      className="nav-dot"
                      style={{ display: "inline-block" }}
                    ></span>
                  ),
                  count: 0,
                  color: "#38bdf8",
                },
                {
                  label: "VIP",
                  icon: (
                    <span
                      className="nav-dot"
                      style={{ display: "inline-block" }}
                    ></span>
                  ),
                  count: 0,
                  color: "#facc15",
                },
                {
                  label: "Socios",
                  icon: (
                    <span
                      className="nav-dot"
                      style={{ display: "inline-block" }}
                    ></span>
                  ),
                  count: 0,
                  color: "#22c55e",
                },
                {
                  label: "Auspiciantes",
                  icon: (
                    <span
                      className="nav-dot"
                      style={{ display: "inline-block" }}
                    ></span>
                  ),
                  count: 0,
                  color: "#a855f7",
                },
              ].map((t) => (
                <div
                  key={t.label}
                  className="nav-dot-container"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-4)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-2xl)",
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    {t.icon}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      marginTop: "var(--space-1)",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-3xl)",
                      fontWeight: 700,
                      color: t.color,
                    }}
                  >
                    {t.count}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "var(--space-4)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Total Vendidos
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-4xl)",
                    fontWeight: 800,
                    color: "var(--color-gold-400)",
                  }}
                >
                  {event._count.tickets}
                </div>
              </div>
              <div
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "var(--space-4)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Check-ins Verificados
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-4xl)",
                    fontWeight: 800,
                    color: "var(--color-success)",
                  }}
                >
                  0
                </div>
              </div>
            </div>
            {event._count.tickets === 0 && (
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-sm)",
                  marginTop: "var(--space-4)",
                }}
              >
                Los datos de tickets se irán cargando conforme se vendan en la
                tienda
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── PROVEEDORES Section ── */}
      {activeTab === "proveedores" && (
        <div
          className="glass-card animate-fade-in"
          style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontWeight: 700,
              }}
            >
              Proveedores — {event.name}
            </h2>
          </div>

          {!event.supplierOrders || event.supplierOrders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "var(--space-8)",
                color: "var(--color-text-muted)",
              }}
            >
              No hay proveedores vinculados a este evento aún.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {event.supplierOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-base)", marginBottom: "var(--space-1)" }}>
                      {order.supplier.companyName}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {order.description} {order.supplier.category && `• ${order.supplier.category}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--color-gold-400)", marginBottom: "var(--space-1)" }}>
                      ${order.amount ? parseFloat(order.amount).toLocaleString() : "0"}
                    </div>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        background: order.status === "CONFIRMADO" || order.status === "ENTREGADO" || order.status === "VERIFICADO"
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(234,179,8,0.1)",
                        color: order.status === "CONFIRMADO" || order.status === "ENTREGADO" || order.status === "VERIFICADO"
                          ? "var(--color-success)"
                          : "var(--color-gold-400)",
                        fontWeight: 600,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PARTICIPANTES Section ── */}
      {activeTab === "participantes" &&
        (() => {
          const contacted = event.participants?.filter((p) => p.stage === "CONTACTADO").length || 0;
          const replied = event.participants?.filter((p) => p.stage === "RESPONDIDO" || p.stage === "REUNION_PROGRAMADA").length || 0;
          const confirmed = event.participants?.filter((p) => p.stage === "CONFIRMADO").length || 0;
          return (
            <div
              className="glass-card animate-fade-in"
              style={{
                padding: "var(--space-6)",
                marginBottom: "var(--space-6)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  marginBottom: "var(--space-6)",
                }}
              >
                Participantes / Instituciones — {event.name}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "var(--space-3)",
                  textAlign: "center",
                  marginBottom: "var(--space-6)"
                }}
              >
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-4)",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>Total</div>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800 }}>{event.participants?.length || 0}</div>
                </div>
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-4)",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>Contactados</div>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800 }}>{contacted}</div>
                </div>
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-4)",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-info)", fontWeight: 600 }}>Respondieron</div>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-info)" }}>{replied}</div>
                </div>
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-4)",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-success)", fontWeight: 600 }}>Confirmados</div>
                  <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-success)" }}>{confirmed}</div>
                </div>
              </div>

              {!event.participants || event.participants.length === 0 ? (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    textAlign: "center",
                    marginTop: "var(--space-4)",
                  }}
                >
                  No has registrado participantes o instituciones.
                </p>
              ) : (
                <div className="task-list">
                  {event.participants.map((p) => (
                    <div key={p.id} className="task-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {p.type || "Participante"} {p.contactName ? `• Contacto: ${p.contactName}` : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          background: p.stage === "CONFIRMADO"
                            ? "rgba(34,197,94,0.1)"
                            : p.stage === "CANCELADO"
                              ? "rgba(239,68,68,0.1)"
                              : p.stage === "CONTACTADO" ? "rgba(113, 113, 122, 0.2)" : "rgba(14, 165, 233, 0.1)",
                          color: p.stage === "CONFIRMADO"
                            ? "var(--color-success)"
                            : p.stage === "CANCELADO"
                              ? "var(--color-error)"
                              : p.stage === "CONTACTADO" ? "var(--color-text-secondary)" : "var(--color-info)",
                          fontWeight: 600,
                        }}
                      >
                        {p.stage}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      {/* ── Metadata ── */}
      <div
        style={{
          padding: "var(--space-4)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          ID: {event.id} — Creado:{" "}
          {new Date(event.createdAt).toLocaleDateString("es-EC", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
