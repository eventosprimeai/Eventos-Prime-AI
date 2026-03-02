export default function DashboardPage() {
    // Mock data — will be replaced with Supabase queries
    const stats = [
        { label: "Eventos Activos", value: "1", icon: "🎪", change: "Prime Festival" },
        { label: "Tareas Pendientes", value: "0", icon: "✅", change: "Sin tareas aún" },
        { label: "Sponsors Pipeline", value: "0", icon: "🏢", change: "Por iniciar captación" },
        { label: "Presupuesto", value: "$0", icon: "💰", change: "Por definir" },
    ];

    const mockEvent = {
        name: "Prime Festival 2026",
        status: "PLANIFICADO",
        ragStatus: "AMBER" as const,
        daysUntil: 90,
        tasksCompleted: 0,
        tasksTotal: 0,
        sponsorsConfirmed: 0,
        sponsorsTarget: 10,
        budget: 0,
        spent: 0,
    };

    const ragColors = {
        RED: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", color: "var(--color-rag-red)", label: "RIESGO" },
        AMBER: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", color: "var(--color-rag-amber)", label: "ATENCIÓN" },
        GREEN: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)", color: "var(--color-rag-green)", label: "EN CURSO" },
    };

    const rag = ragColors[mockEvent.ragStatus];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: "var(--space-8)" }}>
                <h1 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    fontWeight: 800,
                    marginBottom: "var(--space-2)",
                }}>
                    Buenos días, <span className="text-gold">Director</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)" }}>
                    Panel de control — Eventos Prime AI
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-change" style={{ color: "var(--color-text-muted)" }}>{stat.change}</div>
                            </div>
                            <span style={{ fontSize: "var(--text-2xl)" }}>{stat.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Event Section */}
            <div style={{ marginBottom: "var(--space-6)" }}>
                <h2 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    marginBottom: "var(--space-4)",
                }}>
                    Eventos Activos
                </h2>

                <div className="event-grid">
                    {/* Prime Festival Card */}
                    <div className="event-card" style={{ borderColor: rag.border }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                            <div>
                                <h3 style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "var(--text-xl)",
                                    fontWeight: 700,
                                }}>
                                    {mockEvent.name}
                                </h3>
                                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                                    {mockEvent.daysUntil} días restantes
                                </p>
                            </div>

                            {/* RAG Badge */}
                            <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "var(--space-1)",
                                padding: "var(--space-1) var(--space-3)",
                                borderRadius: "var(--radius-full)",
                                fontSize: "var(--text-xs)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                background: rag.bg,
                                color: rag.color,
                                border: `1px solid ${rag.border}`,
                            }}>
                                <span style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: rag.color,
                                    animation: "pulse-dot 2s ease-in-out infinite",
                                }} />
                                {rag.label}
                            </span>
                        </div>

                        {/* Progress Bars */}
                        <div style={{ display: "grid", gap: "var(--space-3)" }}>
                            {/* Tasks Progress */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>
                                    <span style={{ color: "var(--color-text-secondary)" }}>Tareas</span>
                                    <span style={{ color: "var(--color-text-muted)" }}>{mockEvent.tasksCompleted}/{mockEvent.tasksTotal}</span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: "var(--color-bg-secondary)",
                                    borderRadius: "var(--radius-full)",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: mockEvent.tasksTotal > 0 ? `${(mockEvent.tasksCompleted / mockEvent.tasksTotal) * 100}%` : "0%",
                                        background: "var(--gradient-gold)",
                                        borderRadius: "var(--radius-full)",
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>
                            </div>

                            {/* Sponsors Progress */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>
                                    <span style={{ color: "var(--color-text-secondary)" }}>Sponsors</span>
                                    <span style={{ color: "var(--color-text-muted)" }}>{mockEvent.sponsorsConfirmed}/{mockEvent.sponsorsTarget}</span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: "var(--color-bg-secondary)",
                                    borderRadius: "var(--radius-full)",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${(mockEvent.sponsorsConfirmed / mockEvent.sponsorsTarget) * 100}%`,
                                        background: "var(--gradient-prime)",
                                        borderRadius: "var(--radius-full)",
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Tasks (empty state) */}
            <div>
                <h2 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    marginBottom: "var(--space-4)",
                }}>
                    Tareas Recientes
                </h2>
                <div style={{
                    padding: "var(--space-12)",
                    textAlign: "center",
                    background: "var(--color-bg-card)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-xl)",
                }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>📋</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)" }}>
                        No hay tareas creadas aún
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Crea tu primer evento para comenzar a asignar tareas
                    </p>
                </div>
            </div>
        </div>
    );
}
