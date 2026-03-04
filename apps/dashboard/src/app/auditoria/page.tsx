"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    changes: any;
    createdAt: string;
    user: { name: string; email: string; role: string } | null;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
}

export default function AuditoriaPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [securityAlerts, setSecurityAlerts] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"alertas" | "logs">("alertas");
    const [isDirector, setIsDirector] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchAudits = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.role === "DIRECTOR" || user?.user_metadata?.role === "ADMIN") {
                setIsDirector(true);
                try {
                    const res = await fetch("/api/auditoria");
                    if (res.ok) {
                        const data = await res.json();
                        setLogs(data.logs || []);
                        setSecurityAlerts(data.alerts || []);
                    }
                } catch (e) { }
            } else {
                window.location.href = "/unauthorized?target=Panel%20de%20Auditoría";
            }
            setLoading(false);
        };
        fetchAudits();
    }, []);

    const markAsRead = async (id: string) => {
        setSecurityAlerts(prev => prev.filter(al => al.id !== id));
        fetch(`/api/auditoria/alerts/${id}/read`, { method: "PATCH" }).catch(() => { });
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid #ff4444", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                <p style={{ marginTop: "var(--space-4)", color: "var(--color-text-muted)" }}>Accediendo a Bóveda de Seguridad...</p>
            </div>
        );
    }

    if (!isDirector) return null;

    return (
        <div className="animate-fade-in" style={{ padding: "var(--space-4)", maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ marginBottom: "var(--space-8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: "#ff4444" }}>Centro de Seguridad y Auditoría</h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Monitoreo exclusivo de accesos no autorizados y trazabilidad del sistema.
                    </p>
                </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                <button
                    onClick={() => setActiveTab("alertas")}
                    style={{ padding: "var(--space-2) var(--space-6)", borderRadius: "var(--radius-lg)", border: `1px solid ${activeTab === 'alertas' ? '#ff4444' : 'var(--color-border)'}`, background: activeTab === 'alertas' ? 'rgba(255, 68, 68, 0.1)' : 'var(--color-bg-elevated)', color: activeTab === 'alertas' ? '#ff4444' : 'var(--color-text-muted)', fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                    Alertas Críticas ({securityAlerts.length})
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    style={{ padding: "var(--space-2) var(--space-6)", borderRadius: "var(--radius-lg)", border: `1px solid ${activeTab === 'logs' ? 'var(--color-gold-400)' : 'var(--color-border)'}`, background: activeTab === 'logs' ? 'rgba(250, 204, 21, 0.1)' : 'var(--color-bg-elevated)', color: activeTab === 'logs' ? 'var(--color-gold-400)' : 'var(--color-text-muted)', fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                    Auditoría de Actividad ({logs.length})
                </button>
            </div>

            {activeTab === "alertas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    {securityAlerts.length === 0 ? (
                        <div className="glass-card" style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
                            <div style={{ fontSize: "40px", marginBottom: "var(--space-2)", filter: "grayscale(100%) opacity(0.5)" }}>🛡️</div>
                            Todo despejado. No hay accesos indebidos registrados.
                        </div>
                    ) : (
                        securityAlerts.map(alert => (
                            <div key={alert.id} className="glass-card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #ff4444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h4 style={{ color: "#ff4444", fontWeight: 700, marginBottom: "var(--space-1)" }}>{alert.title}</h4>
                                    <p style={{ color: "var(--color-text-primary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>{alert.message}</p>
                                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{new Date(alert.createdAt).toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={() => markAsRead(alert.id)}
                                    style={{ padding: "var(--space-2) var(--space-4)", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 700 }}
                                >
                                    Marcar Resuelto
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === "logs" && (
                <div className="glass-card" style={{ padding: "var(--space-6)", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-sm)" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-gold-400)" }}>
                                <th style={{ padding: "var(--space-3)" }}>Fecha/Hora</th>
                                <th style={{ padding: "var(--space-3)" }}>Usuario</th>
                                <th style={{ padding: "var(--space-3)" }}>Acción</th>
                                <th style={{ padding: "var(--space-3)" }}>Entidad</th>
                                <th style={{ padding: "var(--space-3)" }}>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: "1px dotted var(--color-border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "var(--space-3)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: "var(--space-3)", fontWeight: 600 }}>{log.user ? `${log.user.name} (${log.user.role})` : 'Sistema Externo'}</td>
                                    <td style={{ padding: "var(--space-3)", color: log.action.includes('DEACTIVATE') ? '#ff4444' : log.action.includes('UNAUTHORIZED') ? '#ffaa00' : 'var(--color-gold-400)', fontWeight: 700, fontSize: "var(--text-xs)" }}>{log.action}</td>
                                    <td style={{ padding: "var(--space-3)" }}>{log.entity} {log.entityId && `<${log.entityId.substring(0, 8)}...>`}</td>
                                    <td style={{ padding: "var(--space-3)", color: "var(--color-text-muted)", fontSize: "11px", maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{JSON.stringify(log.changes || {})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>No hay registros disponibles.</div>}
                </div>
            )}
        </div>
    );
}
