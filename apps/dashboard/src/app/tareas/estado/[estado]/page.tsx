"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface MemberTaskStatus {
    id: string; // User ID
    name: string;
    role: string;
    avatarUrl: string | null;
    taskCount: number;
}

const roleLabels: Record<string, string> = {
    DIRECTOR: "Director", ADMIN: "Administrador", COORDINADOR: "Coordinador", STAFF: "Ejecutivo/Staff", PROVEEDOR: "Proveedor", SPONSOR: "Sponsor"
};

export default function EstadoTareasPage() {
    const params = useParams();
    const router = useRouter();
    const estadoParam = params.estado as string;

    const [members, setMembers] = useState<MemberTaskStatus[]>([]);
    const [loading, setLoading] = useState(true);

    let statusCode = "PENDIENTE";
    let title = "Tareas Pendientes";
    let description = "Miembros que tienen tareas sin revisar o iniciar.";
    let colorVar = "var(--color-rag-red)";

    if (estadoParam === "en-progreso") {
        statusCode = "EN_PROGRESO,REVISION";
        title = "Tareas en Progreso";
        description = "Miembros trabajando activamente en tareas asignadas.";
        colorVar = "var(--color-info)";
    }

    useEffect(() => {
        async function loadData() {
            try {
                // Fetch tasks with the specific status
                const tasksRes = await fetch(`/api/tasks?status=${statusCode}`);
                let tasks = [];
                if (tasksRes.ok) tasks = await tasksRes.json();

                // Group tasks by assignee manually since we only need counts per user
                const userCounts: Record<string, MemberTaskStatus> = {};

                tasks.forEach((t: any) => {
                    if (!t.assignee) return; // Ignore unassigned

                    if (!userCounts[t.assignee.id]) {
                        userCounts[t.assignee.id] = {
                            id: t.assignee.id,
                            name: t.assignee.name,
                            role: t.assignee.role || "Desconocido",
                            avatarUrl: t.assignee.avatarUrl,
                            taskCount: 0
                        };
                    }
                    userCounts[t.assignee.id].taskCount++;
                });

                // Convert to array and sort descending by task load
                const sortedMembers = Object.values(userCounts).sort((a, b) => b.taskCount - a.taskCount);
                setMembers(sortedMembers);
            } catch (e) {
                console.error("Error loading state data:", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [statusCode]);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: `3px solid ${colorVar}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto var(--space-4)" }} />
                    <p style={{ color: "var(--color-text-muted)" }}>Agrupando personal por estado...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "var(--space-12)" }}>
            <div style={{ marginBottom: "var(--space-6)" }}>
                <button onClick={() => router.push("/")} style={{
                    background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)"
                }}>
                    ← Volver al Dashboard
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: colorVar }}></div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>
                        {title}
                    </h1>
                </div>
                <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>{description}</p>
            </div>

            {members.length === 0 ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "var(--space-12)" }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>🎉</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>
                        No hay ningún miembro en esta lista en este momento.
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
                    {members.map((member) => (
                        <Link key={member.id} href={`/tareas/${member.id}`} style={{ textDecoration: "none" }}>
                            <div className="glass-card hoverable" style={{ padding: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-4)", borderLeft: `4px solid ${colorVar}`, cursor: "pointer", transition: "transform 0.2s" }}>
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt={member.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-muted)" }}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "2px" }}>{member.name}</h3>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Personal de Equipo</span>
                                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: colorVar, padding: "2px 8px", background: `${colorVar}15`, borderRadius: "var(--radius-full)" }}>
                                            {member.taskCount} {member.taskCount === 1 ? 'tarea' : 'tareas'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
