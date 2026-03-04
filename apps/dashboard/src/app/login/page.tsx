"use client";

import { useState, useRef, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const personTypesList = ["Socio", "Sponsor", "Proveedor", "Staff", "Artista", "Voluntario", "Contratista"];

const areasAndRoles: Record<string, string[]> = {
    "Dirección y Administración": ["Director General", "Socio", "Event Producer Ejecutivo", "Gerente de Proyecto", "Coordinador Administrativo", "Secretario Ejecutivo", "Asistente Ejecutivo", "Partner Co-Productor de Eventos", "Contratista"],
    "Producción de Eventos (Escenario y Técnica)": ["Stage Manager", "Ingeniero de Sonido", "Ingeniero de Iluminación", "Diseñador 3D / WebGL", "Técnico de Rigging", "Técnico de Grúas", "Stagehand", "Técnico de Escenario"],
    "Seguridad y Salud": ["Jefe de Seguridad", "Guardia de Seguridad", "Manager de Crowd / Control de Multitudes", "Jefe de Salud", "Médico de Emergencias", "Paramédico", "Personal de Primeros Auxilios"],
    "Producción Digital / Tecnología": ["Frontend Developer", "Backend Developer", "DevOps Engineer", "Mobile Developer", "AI Ops Engineer", "Prompt Engineer", "LLM Safety Engineer", "Data Engineer", "ML Engineer", "QA Engineer", "QA Test Automation", "QA Live Ops", "Soporte Técnico"],
    "Diseño y Creatividad": ["Director Creativo", "Productor Ejecutivo Artístico", "3D Artist", "Blender Artist", "Motion Designer", "UX Designer", "UI Designer", "Copywriter", "Content Manager", "Creative Designer", "Motion Graphics Designer"],
    "Marketing y Comunicación": ["Gerente de Marketing", "Social Media Manager", "Paid Media Specialist", "SEO Specialist", "Digital Marketing Specialist", "CRM Specialist", "Email Marketing Specialist", "Community Manager"],
    "Finanzas y Legal": ["Director Financiero", "Controller", "Contador", "Tesorero", "Especialista Fiscal", "Legal Counsel", "Oficial de Protección de Datos", "Compliance Officer"],
    "Operaciones y Logística": ["Gerente de Operaciones", "Jefe de Compras", "Procurement Manager", "Contract Manager", "Payments Operations Manager", "Logistics Manager", "HR Manager", "People Operations Manager", "Training Manager"],
    "Infraestructura y Mantenimiento": ["Facilities Manager", "Técnico de Mantenimiento", "Técnico Eléctrico", "Técnico de Plomería", "Técnico de Infraestructura", "Personal de Limpieza"],
    "Hospitalidad y Atención": ["Hospitality Manager", "Coordinador de Voluntarios", "Voluntario", "Wardrobe Crew", "Makeup Artist", "Staff de Camerinos"],
    "Sostenibilidad e Inclusión": ["Sustainability Officer", "Accessibility Officer"],
    "Fotografía y Producción Audiovisual": ["Event Photographer", "Videographer", "Drone Operator"],
    "Roles de IA / Automatización": ["AI Agent", "AI Scheduler", "AI Email Agent", "AI Task Agent", "Infraestructura IA Manager"]
};

const categoriesList = ["Socio", "Sponsor", "Proveedor", "Artista", "Staff Administrativo", "Staff Operativo", "Staff Técnico", "Staff Creativo", "Personal Contratado", "Voluntario", "Agencia Externa", "Consultor", "Empresa Aliada"];

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

    // New structural state
    const [personType, setPersonType] = useState(personTypesList[0]);
    const [area, setArea] = useState(Object.keys(areasAndRoles)[0]);
    const [jobTitle, setJobTitle] = useState(areasAndRoles[Object.keys(areasAndRoles)[0]][0]);
    const [customJobTitle, setCustomJobTitle] = useState("");
    const [category, setCategory] = useState(categoriesList[0]);

    const [contractType, setContractType] = useState("Por Evento");
    const [contractEventId, setContractEventId] = useState("");
    const [eventsOptions, setEventsOptions] = useState<any[]>([]);

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

    const handleMasterPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (masterPassword === "Gabriel230386@") {
            setMode("register");
            setPersonType(personTypesList[0]);
            setArea(Object.keys(areasAndRoles)[0]);
            setJobTitle(areasAndRoles[Object.keys(areasAndRoles)[0]][0]);
            setCategory(categoriesList[0]);
            setCustomJobTitle("");

            // Fetch events options
            try {
                const evRes = await fetch("/api/events?public=true");
                if (evRes.ok) {
                    const data = await evRes.json();
                    setEventsOptions(data);
                    if (data.length > 0) {
                        setContractEventId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Could not fetch events:", err);
            }

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

        const finalJobTitle = jobTitle === "Otro / Nuevo tipo de rol" ? customJobTitle.trim() : jobTitle;

        if (!name || !lastName || !finalJobTitle) {
            setError("Completa todos los campos obligatorios");
            return;
        }

        setLoading(true);
        setError("");

        const fullName = `${name} ${lastName}`.trim();

        try {
            const res = await fetch("/api/auth/register-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    name: fullName,
                    personType,
                    area,
                    category,
                    jobTitle: finalJobTitle,
                    contractType,
                    contractEventId: contractType === "Por Evento" ? contractEventId : null,
                    avatarUrl
                })
            });

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error);

            setSuccess("Cuenta creada exitosamente. Ya puedes iniciar sesión.");
            setMode("login");
            // clear form
            setName(""); setLastName(""); setEmail(""); setPassword(""); setAvatarUrl(null); setCustomJobTitle("");
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
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Tipo de Persona</label>
                                    <select value={personType} onChange={(e) => setPersonType(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                                        {personTypesList.map((tipo, idx) => (
                                            <option key={idx} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Área</label>
                                    <select value={area} onChange={(e) => {
                                        setArea(e.target.value);
                                        setJobTitle(areasAndRoles[e.target.value][0]);
                                    }} required style={{ ...inputStyle, cursor: "pointer" }}>
                                        {Object.keys(areasAndRoles).map((ar, idx) => (
                                            <option key={idx} value={ar}>{ar}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Cargo Estructural</label>
                                    <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                                        {areasAndRoles[area].map((rol, idx) => (
                                            <option key={idx} value={rol}>{rol}</option>
                                        ))}
                                        <option value="Otro / Nuevo tipo de rol">Otro / Nuevo tipo de rol...</option>
                                    </select>
                                </div>
                                {jobTitle === "Otro / Nuevo tipo de rol" && (
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Especificar nuevo rol</label>
                                        <input type="text" value={customJobTitle} onChange={(e) => setCustomJobTitle(e.target.value)} placeholder="Escriba el nombre del rol" required style={inputStyle} />
                                    </div>
                                )}
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Categoría de Permisos</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                                        {categoriesList.map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: "1 / -1", background: "var(--color-bg-primary)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "var(--color-gold-400)", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "var(--space-2)" }}>Condición Contractual</label>
                                    <select value={contractType} onChange={(e) => setContractType(e.target.value)} required style={{ ...inputStyle, cursor: "pointer", marginBottom: "var(--space-3)" }}>
                                        <option value="Permanente">Plantilla Permanente (Multi-evento)</option>
                                        <option value="Por Evento">Exclusivo por Evento / Proyecto</option>
                                    </select>

                                    {contractType === "Por Evento" && (
                                        <div>
                                            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "var(--space-1)" }}>Vincular a Evento Activo</label>
                                            <select value={contractEventId} onChange={(e) => setContractEventId(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                                                {eventsOptions.length > 0 ? (
                                                    eventsOptions.map((ev) => (
                                                        <option key={ev.id} value={ev.id}>{ev.name} ({ev.status})</option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>No hay eventos creados. Cree uno primero.</option>
                                                )}
                                            </select>
                                        </div>
                                    )}
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
