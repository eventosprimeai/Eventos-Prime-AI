"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    _count: { assignedTasks: number };
}

const roleLabels: Record<string, string> = {
    DIRECTOR: "Director General",
    ADMIN: "Administrador",
    COORDINADOR: "Coordinador",
    STAFF: "Ejecutivo/Staff",
    PROVEEDOR: "Proveedor",
    SPONSOR: "Sponsor"
};

export default function EquipoPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");

    // Modal state
    const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
    const [editForm, setEditForm] = useState({ name: "", role: "", avatarUrl: "" as string | null });
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchData = async () => {
        setLoading(true);
        // User session info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            setCurrentUserRole(user.user_metadata?.role || "STAFF");
        }

        // Fetch team
        try {
            const res = await fetch("/api/team");
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
            }
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 400;
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;

                canvas.width = MAX_SIZE;
                canvas.height = MAX_SIZE;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
                    const base64 = canvas.toDataURL("image/jpeg", 0.85);
                    setEditForm(prev => ({ ...prev, avatarUrl: base64 }));
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const openEditModal = (member: TeamMember) => {
        setEditingUser(member);
        setEditForm({
            name: member.name,
            role: member.role,
            avatarUrl: member.avatarUrl,
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/team/${editingUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                setEditingUser(null);
                fetchData();
                // If the user edited themselves, maybe refresh window
                if (editingUser.id === currentUserId) {
                    // Slight delay to fetch updated auth details by sidebar
                    setTimeout(() => window.location.reload(), 500);
                }
            } else {
                const { error } = await res.json();
                alert(error);
            }
        } catch { } finally {
            setSaving(false);
        }
    };

    const canEdit = (memberId: string) => {
        return currentUserId === memberId || currentUserRole === "DIRECTOR" || currentUserRole === "ADMIN";
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                <p style={{ marginTop: "var(--space-4)", color: "var(--color-text-muted)" }}>Cargando equipo...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: "var(--space-8)" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>Manejo de Equipo</h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                    Directorio y administración de perfiles internos.
                </p>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-6)" }}>
                {team.map(member => (
                    <div key={member.id} className="glass-card" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--color-bg-card)", border: "2px solid var(--color-gold-400)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-3xl)", marginBottom: "var(--space-4)", overflow: "hidden" }}>
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

                        {canEdit(member.id) && (
                            <button
                                onClick={() => openEditModal(member)}
                                style={{
                                    marginTop: "auto", width: "100%", padding: "var(--space-2)",
                                    background: "var(--color-bg-elevated)", color: "var(--color-text-primary)",
                                    border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                                    fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", transition: "var(--transition-fast)"
                                }}
                            >
                                {member.id === currentUserId ? "Editar Mi Perfil" : "Editar Usuario"}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {editingUser && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--space-4)" }}>
                    <div className="glass-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: 500, border: "1px solid var(--color-gold-400)", animation: "fadeIn 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-xl)" }}>
                                {editingUser.id === currentUserId ? "Editar mi perfil" : `Editar Perfil de ${editingUser.name}`}
                            </h3>
                            <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-xl)", cursor: "pointer" }}>×</button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            {/* Fotografia */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
                                <div
                                    style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--color-bg-input)", border: "2px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {editForm.avatarUrl ? (
                                        <img src={editForm.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: "var(--text-4xl)", opacity: 0.5 }}>📸</span>
                                    )}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "var(--color-gold-400)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}>
                                    Cambiar Fotografía
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
                            </div>

                            <div>
                                <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Nombres</label>
                                <input
                                    type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    style={{ width: "100%", padding: "var(--space-3)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", outline: "none" }}
                                    required
                                />
                            </div>

                            {(currentUserRole === "DIRECTOR" || currentUserRole === "ADMIN") && (
                                <div>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Nivel de Acceso (Rol)</label>
                                    <select
                                        value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        style={{ width: "100%", padding: "var(--space-3)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", outline: "none", cursor: "pointer" }}
                                    >
                                        <option value="DIRECTOR">Director General</option>
                                        <option value="ADMIN">Administrador Ejecutivo</option>
                                        <option value="COORDINADOR">Coordinador de Área</option>
                                        <option value="STAFF">Ejecutivo/Staff General</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: "var(--space-2) var(--space-4)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} style={{ padding: "var(--space-2) var(--space-5)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                                    {saving ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
