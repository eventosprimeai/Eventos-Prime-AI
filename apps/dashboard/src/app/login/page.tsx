"use client";

import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const jobRoles = [
    { label: "Director General", value: "DIRECTOR" },
    { label: "Administrador / Productor Ejecutivo", value: "ADMIN" },
    { label: "Arquitecto de Software Principal", value: "ADMIN" },
    { label: "Gerente de Proyecto / Event Manager", value: "COORDINADOR" },
    { label: "Stage Manager", value: "COORDINADOR" },
    { label: "Coordinador de Área", value: "COORDINADOR" },
    { label: "Desarrollador Frontend", value: "STAFF" },
    { label: "Desarrollador Backend", value: "STAFF" },
    { label: "Agente AI Ops / Prompt Engineer", value: "STAFF" },
    { label: "Jefe de Seguridad", value: "COORDINADOR" },
    { label: "Director Creativo", value: "ADMIN" },
    { label: "Contabilidad y Finanzas", value: "ADMIN" },
    { label: "Especialista Marketing y SEO", value: "STAFF" },
    { label: "Soporte Técnico / Tareas Generales", value: "STAFF" },
    { label: "Proveedor Externo", value: "PROVEEDOR" },
    { label: "Sponsor / Patrocinador", value: "SPONSOR" },
];

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState<"login" | "master-password" | "register">("login");
    const [success, setSuccess] = useState("");

    // Registration states
    const [masterPassword, setMasterPassword] = useState("");
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [selectedJob, setSelectedJob] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 400;

                // Crop to square
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;

                canvas.width = MAX_SIZE;
                canvas.height = MAX_SIZE;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
                    const base64 = canvas.toDataURL("image/jpeg", 0.85);
                    setAvatarUrl(base64);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleMasterPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (masterPassword === "Gabriel230386@") {
            setMode("register");
            setSelectedJob(jobRoles[0].label);
        } else {
            setError("Contraseña maestra incorrecta.");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            window.location.href = "/";
        } catch (err: any) {
            setError(err?.message?.includes("Invalid login") ? "Correo o contraseña incorrectos" : err?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !lastName || !selectedJob) {
            setError("Completa todos los campos obligatorios");
            return;
        }

        setLoading(true);
        setError("");

        const roleValue = jobRoles.find(j => j.label === selectedJob)?.value || "STAFF";
        const fullName = `${name} ${lastName}`.trim();

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: fullName,
                        jobTitle: selectedJob,
                        role: roleValue,
                        avatarUrl: avatarUrl
                    },
                },
            });
            if (error) throw error;
            setSuccess("Cuenta creada exitosamente. Esperando confirmación.");
            setMode("login");
            // clear form
            setName(""); setLastName(""); setEmail(""); setPassword(""); setAvatarUrl(null);
        } catch (err: any) {
            setError(err?.message?.includes("registered") ? "El correo ya está registrado." : err?.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "var(--space-3)", background: "var(--color-bg-input)",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
        color: "var(--color-text-primary)", fontSize: "var(--text-sm)",
        fontFamily: "var(--font-sans)", outline: "none", transition: "var(--transition-fast)",
    };

    const btnStyle = {
        width: "100%", padding: "var(--space-3)", background: "var(--gradient-gold)",
        color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)",
        fontSize: "var(--text-base)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "var(--transition-fast)",
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-primary)", padding: "var(--space-4)" }}>
            <div style={{ width: "100%", maxWidth: mode === "register" ? 600 : 420 }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>
                        <span className="text-gold">Eventos</span>Prime
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                        {mode === "login" ? "Acceso al Sistema Central" : mode === "master-password" ? "Autorización de Seguridad" : "Registro de Nuevo Miembro"}
                    </p>
                </div>

                <div className="glass-card" style={{ padding: "var(--space-8)" }}>
                    {error && <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", background: "rgba(239, 68, 68, 0.1)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)", marginBottom: "var(--space-4)" }}>{error}</p>}
                    {success && <p style={{ color: "var(--color-success)", fontSize: "var(--text-sm)", background: "rgba(34, 197, 94, 0.1)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid rgba(34, 197, 94, 0.2)", marginBottom: "var(--space-4)" }}>{success}</p>}

                    {mode === "login" && (
                        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <div>
                                <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Correo electrónico</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@eventosprimeai.com" required style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Contraseña</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} />
                            </div>
                            <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: "var(--space-2)" }}>
                                {loading ? "Procesando..." : "Ingresar Seguro"}
                            </button>
                            <div style={{ textAlign: "center", marginTop: "var(--space-2)" }}>
                                <button type="button" onClick={() => { setMode("master-password"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-sm)", cursor: "pointer", textDecoration: "underline" }}>
                                    ¿No tienes cuenta? Regístrate aquí
                                </button>
                            </div>
                        </form>
                    )}

                    {mode === "master-password" && (
                        <form onSubmit={handleMasterPassword} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)", textAlign: "center" }}>
                                Por razones de seguridad, la creación de nuevas cuentas está restringida. Ingrese la contraseña maestra del Director General.
                            </p>
                            <div>
                                <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Contraseña Maestra</label>
                                <input type="password" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
                            </div>
                            <button type="submit" style={{ ...btnStyle, marginTop: "var(--space-2)" }}>
                                Validar y Continuar
                            </button>
                            <div style={{ textAlign: "center", marginTop: "var(--space-2)" }}>
                                <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-sm)", cursor: "pointer", textDecoration: "underline" }}>
                                    Volver al Login
                                </button>
                            </div>
                        </form>
                    )}

                    {mode === "register" && (
                        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            {/* Avatar Section */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                                <div
                                    style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--color-bg-input)", border: "2px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", position: "relative" }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: "var(--text-4xl)", opacity: 0.5 }}>📸</span>
                                    )}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "var(--color-gold-400)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}>
                                    {avatarUrl ? "Cambiar foto" : "Subir Foto (Se encuadrará auto.)"}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                                <div>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Nombres</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Gabriel" required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Apellidos</label>
                                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ej: Apellido" required style={inputStyle} />
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Cargo Funcional</label>
                                    <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                                        {jobRoles.map((role, idx) => (
                                            <option key={idx} value={role.label}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Correo corporativo</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@eventosprime.com" required style={inputStyle} />
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Contraseña inicial</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caracteres" required minLength={6} style={inputStyle} />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: "var(--space-4)" }}>
                                {loading ? "Procesando..." : "Crear Perfil en Sistema"}
                            </button>
                            <div style={{ textAlign: "center", marginTop: "var(--space-2)" }}>
                                <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-sm)", cursor: "pointer", textDecoration: "underline" }}>
                                    Cancelar y Volver
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
