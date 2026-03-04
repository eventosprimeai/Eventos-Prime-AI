"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

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
    tasksCompleted: number;
    pending: number;
    inProgress: number;
}

export default function DashboardPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState<Stats>({ events: 0, tasksCompleted: 0, pending: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Director");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showConsulta, setShowConsulta] = useState(false);
    const [consultaQuery, setConsultaQuery] = useState("");
    const [consultaEventId, setConsultaEventId] = useState("");
    const [isSavingConsulta, setIsSavingConsulta] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const router = useRouter();

    useEffect(() => {
        async function load() {
            // Get user info
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                if (user.user_metadata?.name) setUserName(user.user_metadata.name);
                else if (user.email) setUserName(user.email.split("@")[0]);
            }

            // Fetch events
            try {
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data = await res.json();

                    // Filter upcoming / active events
                    const activeEvents = data.filter((e: Event) => e.status !== "CERRADO" && e.status !== "CANCELADO");
                    setEvents(activeEvents);

                    setStats(prev => ({
                        ...prev,
                        events: activeEvents.length,
                    }));
                }
            } catch { }

            // Fetch tasks breakdown
            try {
                const [resPending, resInProgress, resCompleted] = await Promise.all([
                    fetch("/api/tasks?status=PENDIENTE"),
                    fetch("/api/tasks?status=EN_PROGRESO,REVISION"),
                    fetch("/api/tasks?status=COMPLETADA")
                ]);

                let pendingCount = 0;
                let inProgressCount = 0;
                let completedCount = 0;

                if (resPending.ok) {
                    const data = await resPending.json();
                    pendingCount = data.length || 0;
                }
                if (resInProgress.ok) {
                    const data = await resInProgress.json();
                    inProgressCount = data.length || 0;
                }
                if (resCompleted.ok) {
                    const data = await resCompleted.json();
                    completedCount = data.length || 0;
                }

                setStats(prev => ({ ...prev, pending: pendingCount, inProgress: inProgressCount, tasksCompleted: completedCount }));
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

    const toggleRecording = () => {
        if (isRecording) {
            if (recognitionRef.current) {
                const rec = recognitionRef.current;
                recognitionRef.current = null;
                rec.stop();
            }
            setIsRecording(false);
            return;
        }
        const windowAny = window as any;
        const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;
        const startingText = consultaQuery ? consultaQuery + " " : "";
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (e) { }
            } else {
                setIsRecording(false);
            }
        };
        recognition.onerror = (e: any) => {
            if (e.error === 'not-allowed' || e.error === 'not-supported') {
                recognitionRef.current = null;
                setIsRecording(false);
                alert("Error de micrófono: " + e.error);
            }
        };
        recognition.onresult = (evt: any) => {
            let finalSegment = "";
            let interimSegment = "";
            for (let i = evt.resultIndex; i < evt.results.length; ++i) {
                if (evt.results[i].isFinal) {
                    finalSegment += evt.results[i][0].transcript;
                } else {
                    interimSegment += evt.results[i][0].transcript;
                }
            }
            if (finalSegment || interimSegment) {
                setConsultaQuery(startingText + finalSegment + interimSegment);
            }
        };
        recognition.start();
    };

    const handleConsultSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consultaEventId || !consultaQuery || !currentUserId) return;
        setIsSavingConsulta(true);

        let titlePreview = consultaQuery.substring(0, 40);
        if (consultaQuery.length > 40) titlePreview += "...";
        const title = `[CONSULTA] ${titlePreview}`;

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description: consultaQuery,
                    priority: "MEDIA",
                    eventId: consultaEventId,
                    assigneeId: currentUserId,
                    evidenceRequired: false,
                    isConsulta: true
                }),
            });
            if (res.ok) {
                setConsultaQuery("");
                setShowConsulta(false);
                router.push("/consultas"); // Redirect to the new consultas page
            }
        } catch { } finally {
            setIsSavingConsulta(false);
        }
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
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button onClick={() => setShowConsulta(!showConsulta)} style={{
                        padding: "var(--space-2) var(--space-4)",
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-gold-400)",
                        borderRadius: "var(--radius-lg)",
                        color: "var(--color-gold-400)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)"
                    }}>
                        {showConsulta ? "Cancelar" : "+ Nueva Consulta"}
                    </button>
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
            </div>

            {/* Consulta Modal */}
            {showConsulta && (
                <form onSubmit={handleConsultSubmit} className="glass-card animate-fade-in" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)", border: "1px solid var(--color-gold-400)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-gold-400)" }}>
                            <span style={{ fontSize: "1.2rem" }}>🎙️</span>
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: 0 }}>Consultar a Harold</h3>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>Recibe asistencia inmediata guiada por inteligencia artificial.</p>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-4)" }}>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>¿De qué evento se trata? *</label>
                            <select required value={consultaEventId} onChange={(e) => setConsultaEventId(e.target.value)} style={{ width: "100%", padding: "var(--space-2) var(--space-3)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)" }}>
                                <option value="">Selecciona un evento</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Detalla tu consulta *</label>
                            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                                <textarea required value={consultaQuery} onChange={(e) => setConsultaQuery(e.target.value)} placeholder="Habla o escribe lo que necesitas saber..." rows={3} style={{ width: "100%", padding: "var(--space-2) var(--space-3)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", resize: "vertical" }} />
                                <button type="button" onClick={toggleRecording} style={{ cursor: "pointer", background: isRecording ? "var(--color-rag-red)" : "var(--color-bg-elevated)", border: "1px solid var(--color-border)", width: 44, height: 44, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "0.2s" }}>
                                    <span style={{ filter: isRecording ? "brightness(0) invert(1)" : "none", fontSize: "1.2rem" }}>🎤</span>
                                </button>
                            </div>
                            {isRecording && <div style={{ color: "var(--color-rag-red)", fontSize: "var(--text-xs)", marginTop: "4px", fontWeight: 600, animation: "pulse 1.5s infinite" }}>Escuchando activamente... (click en el micro para detener)</div>}
                        </div>
                        <button type="submit" disabled={isSavingConsulta || !consultaEventId || !consultaQuery} style={{
                            padding: "var(--space-3)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: (isSavingConsulta || !consultaEventId || !consultaQuery) ? "not-allowed" : "pointer", opacity: (isSavingConsulta || !consultaEventId || !consultaQuery) ? 0.6 : 1, transition: "var(--transition-fast)"
                        }}>
                            {isSavingConsulta ? "Enviando..." : "Enviar Consulta a Harold"}
                        </button>
                    </div>
                </form>
            )}

            {/* Stats */}
            <div className="stats-grid">
                <div
                    className="stat-card"
                    onClick={() => router.push("/tareas")}
                    style={{ cursor: "pointer", transition: "var(--transition-fast)" }}
                >
                    <div className="stat-label">Tareas Completadas</div>
                    <div className="stat-value" style={{ color: "var(--color-text-primary)" }}>{stats.tasksCompleted}</div>
                </div>
                <div
                    className="stat-card"
                    onClick={() => router.push("/tareas/estado/pendientes")}
                    style={{ cursor: "pointer", transition: "var(--transition-fast)" }}
                >
                    <div className="stat-label">Tareas Pendientes</div>
                    <div className="stat-value" style={{ color: stats.pending > 0 ? "var(--color-rag-red)" : "var(--color-success)" }}>
                        {stats.pending}
                    </div>
                </div>
                <div
                    className="stat-card"
                    onClick={() => router.push("/tareas/estado/en-progreso")}
                    style={{ cursor: "pointer", transition: "var(--transition-fast)" }}
                >
                    <div className="stat-label">Tareas en Progreso</div>
                    <div className="stat-value" style={{ color: stats.inProgress > 0 ? "var(--color-info)" : "var(--color-text-muted)" }}>
                        {stats.inProgress}
                    </div>
                </div>
                <div
                    className="stat-card"
                    onClick={() => router.push("/eventos")}
                    style={{ cursor: "pointer", transition: "var(--transition-fast)" }}
                >
                    <div className="stat-label">Eventos Activos</div>
                    <div className="stat-value">{stats.events}</div>
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
                            <div
                                key={event.id}
                                className="event-card hoverable"
                                onClick={() => router.push(`/eventos/${event.id}`)}
                                style={{ cursor: "pointer", transition: "transform 0.2s" }}
                            >
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
