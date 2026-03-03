"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Event {
    id: string;
    name: string;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    _count: { assignedTasks: number };
}

const roleLabels: Record<string, string> = {
    DIRECTOR: "Director", ADMIN: "Administrador", COORDINADOR: "Coordinador", STAFF: "Ejecutivo/Staff", PROVEEDOR: "Proveedor", SPONSOR: "Sponsor"
};

export default function TeamTareasPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIA",
        eventId: "",
        assigneeId: "",
        dueDate: "",
        evidenceRequired: true,
        slaHours: "",
    });

    const router = useRouter();

    const fetchData = () => {
        Promise.all([
            fetch("/api/team").then(res => res.json()),
            fetch("/api/events").then(res => res.json())
        ])
            .then(([teamData, eventsData]) => {
                if (Array.isArray(teamData)) setTeam(teamData);
                if (Array.isArray(eventsData)) setEvents(eventsData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.eventId || !form.assigneeId) return;
        setSaving(true);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    slaHours: form.slaHours ? parseInt(form.slaHours) : null,
                }),
            });
            if (res.ok) {
                setForm({ title: "", description: "", priority: "MEDIA", eventId: "", assigneeId: "", dueDate: "", evidenceRequired: true, slaHours: "" });
                setShowForm(false);
                fetchData(); // Refresh counts
            }
        } catch { } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "var(--space-2) var(--space-3)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", fontFamily: "var(--font-sans)",
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: "var(--space-8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>Equipo de Trabajo</h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Selecciona un miembro del equipo para gestionar sus tareas asignadas.
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{
                    padding: "var(--space-2) var(--space-5)", background: showForm ? "var(--color-bg-card)" : "var(--gradient-gold)", color: showForm ? "var(--color-text-secondary)" : "var(--color-bg-primary)", border: showForm ? "1px solid var(--color-border)" : "none", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>
                    {showForm ? "Cancelar" : "+ Nueva Tarea Global"}
                </button>
            </div>

            {/* Global Create Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)", border: "1px solid var(--color-gold-400)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "var(--space-4)" }}>Asignar Nueva Tarea</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Título *</label>
                            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Confirmar DJ..." style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Descripción</label>
                            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles de la tarea..." rows={2} style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
                                <button type="button" onClick={() => {
                                    if (isRecording) {
                                        if (recognitionRef.current) {
                                            const rec = recognitionRef.current;
                                            recognitionRef.current = null; // Mark as manually stopped
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
                                    const startingText = form.description ? form.description + " " : "";
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
                                        for (let i = 0; i < evt.results.length; ++i) {
                                            if (evt.results[i].isFinal) {
                                                finalSegment += evt.results[i][0].transcript;
                                            } else {
                                                interimSegment += evt.results[i][0].transcript;
                                            }
                                        }
                                        setForm(prev => ({ ...prev, description: startingText + finalSegment + interimSegment }));
                                    };
                                    recognition.start();
                                }} style={{ width: 44, height: 44, borderRadius: "50%", background: isRecording ? "rgba(255, 60, 60, 0.2)" : "var(--color-bg-elevated)", border: `1px solid ${isRecording ? "red" : "var(--color-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: "1.2rem", transition: "all 0.2s ease" }}>
                                    🎤
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Responsable *</label>
                            <select required value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                <option value="">Seleccionar miembro...</option>
                                {team.map((member) => (
                                    <option key={member.id} value={member.id}>{member.name} - {roleLabels[member.role] || member.role}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Evento *</label>
                            <select required value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                <option value="">Seleccionar evento...</option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Prioridad</label>
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                <option value="BAJA">🟢 Baja</option>
                                <option value="MEDIA">🟡 Media</option>
                                <option value="ALTA">🟠 Alta</option>
                                <option value="URGENTE">🔴 Urgente</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Fecha límite</label>
                            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>SLA (horas)</label>
                            <input type="number" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: e.target.value })} placeholder="24" style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <input type="checkbox" id="evidence-global" checked={form.evidenceRequired} onChange={(e) => setForm({ ...form, evidenceRequired: e.target.checked })} />
                            <label htmlFor="evidence-global" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                                📸 Requiere evidencia fotográfica
                            </label>
                        </div>
                    </div>
                    <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                        <button type="button" onClick={() => setShowForm(false)} style={{ padding: "var(--space-2) var(--space-4)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", cursor: "pointer" }}>Cancelar</button>
                        <button type="submit" disabled={saving || !form.eventId || !form.assigneeId} style={{ padding: "var(--space-2) var(--space-5)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: (saving || !form.eventId || !form.assigneeId) ? "not-allowed" : "pointer", opacity: (saving || !form.eventId || !form.assigneeId) ? 0.7 : 1 }}>
                            {saving ? "Asignando..." : "Asignar Tarea"}
                        </button>
                    </div>
                </form>
            )}

            {/* Team Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-6)" }}>
                {team.map(member => (
                    <div key={member.id}
                        className="glass-card team-card"
                        style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", transition: "all 0.2s ease-in-out", cursor: "pointer" }}
                        onClick={() => router.push(`/tareas/${member.id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                        <div style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--color-bg-card)", border: "2px solid var(--color-gold-400)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-4xl)", marginBottom: "var(--space-4)", overflow: "hidden" }}>
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span>{member.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-1)" }}>{member.name}</h3>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gold-400)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                            {roleLabels[member.role] || member.role}
                        </span>

                        <div style={{ width: "100%", marginTop: "auto" }}>
                            <div style={{ padding: "var(--space-3)", background: "var(--color-bg-primary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)" }}>
                                <span style={{ display: "block", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>{member._count.assignedTasks}</span>
                                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Tareas Asignadas</span>
                            </div>
                            <button style={{ width: "100%", padding: "var(--space-2)", background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", fontWeight: 600, transition: "var(--transition-fast)", cursor: "pointer" }}>
                                Ver Tareas →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {team.length === 0 && (
                <div style={{ textAlign: "center", padding: "var(--space-16)", background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-xl)" }}>
                    <p style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-3)" }}>👥</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)" }}>
                        No hay miembros del equipo registrados o activos
                    </p>
                </div>
            )}
        </div>
    );
}
