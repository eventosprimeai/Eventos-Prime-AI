"use client";

import { useEffect, useState } from "react";

type PipelineStage =
  | "PROSPECTO"
  | "CONTACTADO"
  | "REUNION"
  | "PROPUESTA"
  | "NEGOCIACION"
  | "CERRADO"
  | "PERDIDO";

interface Deal {
  id: string;
  stage: PipelineStage;
  dealValue: string | null;
  notes: string | null;
  event: { id: string; name: string };
  lastContactAt: string | null;
}

interface Sponsor {
  id: string;
  companyName: string;
  industry: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  affinityScore: number | null;
  deals: Deal[];
}

interface Event {
  id: string;
  name: string;
}

const stageConfig: Record<PipelineStage, { label: string; color: string }> = {
  PROSPECTO: { label: "Prospecto", color: "#71717a" },
  CONTACTADO: { label: "Contactado", color: "#0ea5e9" },
  REUNION: { label: "Reunión", color: "#7dd3fc" },
  PROPUESTA: { label: "Propuesta", color: "#eab308" },
  NEGOCIACION: { label: "Negociación", color: "#f59e0b" },
  CERRADO: { label: "Cerrado", color: "#22c55e" },
  PERDIDO: { label: "Perdido", color: "#ef4444" },
};

const pipelineStages: PipelineStage[] = [
  "PROSPECTO",
  "CONTACTADO",
  "REUNION",
  "PROPUESTA",
  "NEGOCIACION",
  "CERRADO",
];

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    notes: "",
    eventId: "",
    dealValue: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sponsorsRes, eventsRes] = await Promise.all([
        fetch("/api/sponsors"),
        fetch("/api/events"),
      ]);
      if (sponsorsRes.ok) setSponsors(await sponsorsRes.json());
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
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dealValue: form.dealValue ? parseFloat(form.dealValue) : null,
        }),
      });
      if (res.ok) {
        setForm({
          companyName: "",
          industry: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          website: "",
          notes: "",
          eventId: "",
          dealValue: "",
        });
        setShowForm(false);
        fetchData();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const moveStage = async (dealId: string, newStage: PipelineStage) => {
    try {
      await fetch("/api/sponsors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, stage: newStage }),
      });
      fetchData();
    } catch {}
  };

  // Group sponsors by deal stage for pipeline view
  const sponsorsByStage = (stage: PipelineStage) => {
    return sponsors.filter((s) => s.deals.some((d) => d.stage === stage));
  };

  const totalValue = sponsors.reduce(
    (sum, s) =>
      sum +
      s.deals.reduce(
        (d, deal) => d + (deal.dealValue ? parseFloat(deal.dealValue) : 0),
        0,
      ),
    0,
  );

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
            Sponsors
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              marginTop: "var(--space-1)",
            }}
          >
            {sponsors.length} empresa{sponsors.length !== 1 ? "s" : ""} —
            Pipeline: ${totalValue.toLocaleString()} USD
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
              Pipeline
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
            {showForm ? "Cancelar" : "+ Agregar Empresa"}
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
            Nueva Empresa Sponsor
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
                Empresa *
              </label>
              <input
                required
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="Ej: Red Bull Ecuador"
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
                Industria
              </label>
              <input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Ej: Bebidas"
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
                Contacto
              </label>
              <input
                value={form.contactName}
                onChange={(e) =>
                  setForm({ ...form, contactName: e.target.value })
                }
                placeholder="Nombre del contacto"
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
                Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                placeholder="contacto@empresa.com"
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
                Teléfono
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
                Evento
              </label>
              <select
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Sin evento asignado</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
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
                Valor estimado (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.dealValue}
                onChange={(e) =>
                  setForm({ ...form, dealValue: e.target.value })
                }
                placeholder="5000"
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
                Notas
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas sobre la empresa..."
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
              {saving ? "Guardando..." : "Agregar Empresa"}
            </button>
          </div>
        </form>
      )}

      {/* Pipeline Stats */}
      <div
        className="stats-grid"
        style={{
          gridTemplateColumns: "repeat(6, 1fr)",
          marginBottom: "var(--space-6)",
        }}
      >
        {pipelineStages.map((stage) => {
          const config = stageConfig[stage];
          const count = sponsorsByStage(stage).length;
          return (
            <div
              key={stage}
              className="stat-card"
              style={{ padding: "var(--space-3)", textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: config.color,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {config.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-2xl)",
                  fontWeight: 700,
                  marginTop: "var(--space-1)",
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
      ) : sponsors.length === 0 ? (
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
              display: "flex",
              justifyContent: "center",
              marginBottom: "var(--space-3)",
            }}
          >
            <span className="nav-dot" style={{ width: 16, height: 16 }}></span>
          </p>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-lg)",
            }}
          >
            No hay empresas en el pipeline
          </p>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              marginTop: "var(--space-2)",
            }}
          >
            Agrega prospectos de sponsor para comenzar la captación
          </p>
        </div>
      ) : viewMode === "pipeline" ? (
        /* Pipeline Kanban */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "var(--space-3)",
            minHeight: 300,
          }}
        >
          {pipelineStages.map((stage) => {
            const config = stageConfig[stage];
            const stageSps = sponsorsByStage(stage);
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
                  {config.label} ({stageSps.length})
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {stageSps.map((sponsor) => {
                    const deal = sponsor.deals.find((d) => d.stage === stage);
                    const stageIdx = pipelineStages.indexOf(stage);
                    return (
                      <div
                        key={sponsor.id}
                        style={{
                          background: "var(--color-bg-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-lg)",
                          padding: "var(--space-2)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--text-xs)",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          {sponsor.companyName}
                        </div>
                        {sponsor.industry && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {sponsor.industry}
                          </div>
                        )}
                        {deal?.dealValue && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--color-gold-400)",
                              fontWeight: 600,
                              marginTop: "var(--space-1)",
                            }}
                          >
                            ${parseFloat(deal.dealValue).toLocaleString()}
                          </div>
                        )}
                        {deal && (
                          <div
                            style={{
                              display: "flex",
                              gap: "2px",
                              marginTop: "var(--space-2)",
                            }}
                          >
                            {stageIdx > 0 && (
                              <button
                                onClick={() =>
                                  moveStage(
                                    deal.id,
                                    pipelineStages[stageIdx - 1],
                                  )
                                }
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  background: "var(--color-bg-card)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-sm)",
                                  color: "var(--color-text-muted)",
                                  cursor: "pointer",
                                }}
                              >
                                ←
                              </button>
                            )}
                            {stageIdx < pipelineStages.length - 1 && (
                              <button
                                onClick={() =>
                                  moveStage(
                                    deal.id,
                                    pipelineStages[stageIdx + 1],
                                  )
                                }
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  background: "var(--color-bg-card)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-sm)",
                                  color: "var(--color-text-muted)",
                                  cursor: "pointer",
                                }}
                              >
                                →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {stageSps.length === 0 && (
                    <div
                      style={{
                        padding: "var(--space-4) var(--space-2)",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        fontSize: "10px",
                      }}
                    >
                      Vacío
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
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="task-item">
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
                    {sponsor.companyName}
                  </span>
                  {sponsor.industry && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        background: "var(--color-bg-elevated)",
                        padding: "1px 8px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {sponsor.industry}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {sponsor.contactName && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                      }}
                    >
                      <span
                        className="nav-dot"
                        style={{ display: "inline-block" }}
                      ></span>{" "}
                      {sponsor.contactName}
                    </span>
                  )}
                  {sponsor.contactEmail && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                      }}
                    >
                      <span
                        className="nav-dot"
                        style={{ display: "inline-block" }}
                      ></span>{" "}
                      {sponsor.contactEmail}
                    </span>
                  )}
                  {sponsor.deals.length > 0 && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                      }}
                    >
                      <span
                        className="nav-dot"
                        style={{ display: "inline-block" }}
                      ></span>{" "}
                      {sponsor.deals[0].event.name}
                    </span>
                  )}
                </div>
              </div>
              {sponsor.deals.length > 0 && (
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "var(--space-1) var(--space-2)",
                    borderRadius: "var(--radius-full)",
                    background: `${stageConfig[sponsor.deals[0].stage].color}20`,
                    color: stageConfig[sponsor.deals[0].stage].color,
                    fontWeight: 600,
                  }}
                >
                  {stageConfig[sponsor.deals[0].stage].label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
