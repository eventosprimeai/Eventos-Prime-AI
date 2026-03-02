"use client";

import { useState } from "react";

type PipelineStage = "PROSPECTO" | "CONTACTADO" | "REUNION" | "PROPUESTA" | "NEGOCIACION" | "CERRADO" | "PERDIDO";

interface Sponsor {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    stage: PipelineStage;
    dealValue: number;
    affinityScore: number;
    lastContact: string;
    notes: string;
}

const stageConfig: Record<PipelineStage, { label: string; color: string; bg: string; border: string }> = {
    PROSPECTO: { label: "Prospecto", color: "var(--color-text-muted)", bg: "rgba(113, 113, 122, 0.15)", border: "rgba(113, 113, 122, 0.3)" },
    CONTACTADO: { label: "Contactado", color: "var(--color-info)", bg: "rgba(14, 165, 233, 0.15)", border: "rgba(14, 165, 233, 0.3)" },
    REUNION: { label: "Reunión", color: "var(--color-prime-300)", bg: "rgba(125, 211, 252, 0.15)", border: "rgba(125, 211, 252, 0.3)" },
    PROPUESTA: { label: "Propuesta", color: "var(--color-gold-400)", bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.3)" },
    NEGOCIACION: { label: "Negociación", color: "var(--color-warning)", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    CERRADO: { label: "Cerrado ✅", color: "var(--color-success)", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)" },
    PERDIDO: { label: "Perdido", color: "var(--color-error)", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
};

const stages: PipelineStage[] = ["PROSPECTO", "CONTACTADO", "REUNION", "PROPUESTA", "NEGOCIACION", "CERRADO", "PERDIDO"];

export default function SponsorsPage() {
    const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
    const [sponsors] = useState<Sponsor[]>([]);

    // Group sponsors by stage for pipeline view
    const pipelineData = stages.filter(s => s !== "PERDIDO").map((stage) => ({
        stage,
        config: stageConfig[stage],
        sponsors: sponsors.filter((s) => s.stage === stage),
    }));

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        Sponsors
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Pipeline de captación — {sponsors.length} empresas
                    </p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                        <button onClick={() => setViewMode("pipeline")} style={{
                            padding: "var(--space-2) var(--space-4)",
                            background: viewMode === "pipeline" ? "rgba(234, 179, 8, 0.15)" : "var(--color-bg-card)",
                            color: viewMode === "pipeline" ? "var(--color-gold-400)" : "var(--color-text-secondary)",
                            border: "none",
                            fontSize: "var(--text-sm)",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                        }}>
                            Pipeline
                        </button>
                        <button onClick={() => setViewMode("list")} style={{
                            padding: "var(--space-2) var(--space-4)",
                            background: viewMode === "list" ? "rgba(234, 179, 8, 0.15)" : "var(--color-bg-card)",
                            color: viewMode === "list" ? "var(--color-gold-400)" : "var(--color-text-secondary)",
                            border: "none",
                            borderLeft: "1px solid var(--color-border)",
                            fontSize: "var(--text-sm)",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                        }}>
                            Lista
                        </button>
                    </div>
                    <button style={{
                        padding: "var(--space-2) var(--space-5)",
                        background: "var(--gradient-gold)",
                        color: "var(--color-bg-primary)",
                        border: "none",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                    }}>
                        + Agregar Empresa
                    </button>
                </div>
            </div>

            {/* Pipeline Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: "var(--space-6)" }}>
                {pipelineData.map(({ stage, config, sponsors: stageSponsors }) => (
                    <div key={stage} className="stat-card" style={{ padding: "var(--space-3)", textAlign: "center" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: config.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {config.label}
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, marginTop: "var(--space-1)" }}>
                            {stageSponsors.length}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pipeline Kanban View */}
            {viewMode === "pipeline" ? (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "var(--space-3)",
                    minHeight: 400,
                }}>
                    {pipelineData.map(({ stage, config }) => (
                        <div key={stage} style={{
                            background: "var(--color-bg-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-xl)",
                            padding: "var(--space-3)",
                        }}>
                            <div style={{
                                fontSize: "var(--text-xs)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: config.color,
                                padding: "var(--space-2)",
                                marginBottom: "var(--space-2)",
                                borderBottom: `2px solid ${config.border}`,
                            }}>
                                {config.label}
                            </div>
                            {/* Empty state within each column */}
                            <div style={{
                                padding: "var(--space-6) var(--space-2)",
                                textAlign: "center",
                                color: "var(--color-text-muted)",
                                fontSize: "var(--text-xs)",
                            }}>
                                Arrastra una empresa aquí
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View Empty State */
                <div style={{
                    padding: "var(--space-16)",
                    textAlign: "center",
                    background: "var(--color-bg-card)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>🏢</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>
                        No hay empresas en el pipeline
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                        Agrega prospectos de sponsor para comenzar la captación
                    </p>
                </div>
            )}
        </div>
    );
}
