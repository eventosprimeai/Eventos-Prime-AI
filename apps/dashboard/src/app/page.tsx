"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Event {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    _count: { tasks: number; sponsorDeals: number; tickets: number };
}

interface Stats {
    events: number;
    tasks: number;
    pending: number;
    sponsors: number;
}

export default function DashboardPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState<Stats>({ events: 0, tasks: 0, pending: 0, sponsors: 0 });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Director");

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function load() {
            // Get user info
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.name) setUserName(user.user_metadata.name);
            else if (user?.email) setUserName(user.email.split("@")[0]);

            // Fetch events
            try {
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                    setStats({
                        events: data.length,
                        tasks: data.reduce((sum: number, e: Event) => sum + e._count.tasks, 0),
                        pending: 0,
                        sponsors: data.reduce((sum: number, e: Event) => sum + e._count.sponsorDeals, 0),
                    });
                }
            } catch { }

            // Fetch pending tasks count
            try {
                const res = await fetch("/api/tasks?status=PENDIENTE");
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, pending: data.length }));
                }
            } catch { }

            setLoading(false);
        }
        load();
    }, []);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    const statusLabel: Record<string, { text: string; color: string }> = {
        BORRADOR: { text: "Borrador", color: "var(--color-text-muted)" },
        PLANIFICADO: { text: "Planificado", color: "var(--color-info)" },
        PRE_PRODUCCION: { text: "Pre-producción", color: "var(--color-gold-400)" },
        EN_VIVO: { text: "🔴 En vivo", color: "var(--color-rag-red)" },
        POST_PRODUCCION: { text: "Post-producción", color: "var(--color-prime-400)" },
        CERRADO: { text: "Cerrado", color: "var(--color-success)" },
        CANCELADO: { text: "Cancelado", color: "var(--color-error)" },
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto var(--space-4)" }} />
                    <p style={{ color: "var(--color-text-muted)" }}>Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        {getGreeting()}, <span className="text-gold">{userName}</span>
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Panel de control — Eventos Prime AI
                    </p>
                </div>
                <button onClick={handleLogout} style={{
                    padding: "var(--space-2) var(--space-4)",
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                }}>
                    Cerrar sesión
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Eventos Activos</div>
                    <div className="stat-value">{stats.events}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Tareas Pendientes</div>
                    <div className="stat-value" style={{ color: stats.pending > 0 ? "var(--color-rag-amber)" : "var(--color-success)" }}>
                        {stats.pending}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Tareas Totales</div>
                    <div className="stat-value">{stats.tasks}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Sponsors Pipeline</div>
                    <div className="stat-value">{stats.sponsors}</div>
                </div>
            </div>

            {/* Events */}
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: "var(--space-4)" }}>
                Próximos Eventos
            </h2>

            {events.length === 0 ? (
                <div className="event-card" style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>🎪</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>
                        No hay eventos creados aún
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                        Ve a <a href="/eventos" style={{ color: "var(--color-gold-400)" }}>Eventos</a> para crear el primero
                    </p>
                </div>
            ) : (
                <div className="event-grid">
                    {events.map((event) => {
                        const status = statusLabel[event.status] || { text: event.status, color: "var(--color-text-muted)" };
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
                                    }}>
                                        {status.text}
                                    </span>
                                </div>
                                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
                                    {start.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
                                    {daysUntil > 0 ? ` — en ${daysUntil} días` : daysUntil === 0 ? " — ¡Hoy!" : ` — hace ${Math.abs(daysUntil)} días`}
                                </p>
                                <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
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
