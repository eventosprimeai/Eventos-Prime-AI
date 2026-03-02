"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState<"login" | "register">("login");
    const [success, setSuccess] = useState("");

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                window.location.href = "/";
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { role: "DIRECTOR" },
                    },
                });
                if (error) throw error;
                setSuccess("Cuenta creada. Revisa tu correo para confirmar o inicia sesión.");
                setMode("login");
            }
        } catch (err: any) {
            const msg = err?.message || "Error desconocido";
            if (msg.includes("Invalid login")) {
                setError("Correo o contraseña incorrectos");
            } else if (msg.includes("already registered")) {
                setError("Este correo ya está registrado. Inicia sesión.");
                setMode("login");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-bg-input)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        color: "var(--color-text-primary)",
        fontSize: "var(--text-base)",
        fontFamily: "var(--font-sans)",
        outline: "none",
        transition: "var(--transition-fast)",
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-bg-primary)",
            padding: "var(--space-4)",
        }}>
            <div style={{ width: "100%", maxWidth: 420 }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
                    <h1 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-3xl)",
                        fontWeight: 800,
                        marginBottom: "var(--space-2)",
                    }}>
                        <span className="text-gold">Eventos</span>Prime
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                        {mode === "login" ? "Acceso al Panel de Control" : "Crear cuenta de Director"}
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card" style={{ padding: "var(--space-8)" }}>
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@eventosprimeai.com"
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                style={inputStyle}
                            />
                        </div>

                        {error && (
                            <p style={{
                                color: "var(--color-error)",
                                fontSize: "var(--text-sm)",
                                background: "rgba(239, 68, 68, 0.1)",
                                padding: "var(--space-2) var(--space-3)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}>
                                {error}
                            </p>
                        )}

                        {success && (
                            <p style={{
                                color: "var(--color-success)",
                                fontSize: "var(--text-sm)",
                                background: "rgba(34, 197, 94, 0.1)",
                                padding: "var(--space-2) var(--space-3)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(34, 197, 94, 0.2)",
                            }}>
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "var(--space-3)",
                                background: "var(--gradient-gold)",
                                color: "var(--color-bg-primary)",
                                border: "none",
                                borderRadius: "var(--radius-lg)",
                                fontSize: "var(--text-base)",
                                fontFamily: "var(--font-sans)",
                                fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                transition: "var(--transition-fast)",
                            }}
                        >
                            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear Cuenta"}
                        </button>
                    </form>

                    {/* Toggle login/register */}
                    <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
                        <button
                            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-text-muted)",
                                fontSize: "var(--text-sm)",
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                                textDecoration: "underline",
                            }}
                        >
                            {mode === "login" ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
                        </button>
                    </div>
                </div>

                <p style={{
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-xs)",
                    marginTop: "var(--space-6)",
                }}>
                    Eventos Prime AI © 2026 — Panel interno
                </p>
            </div>
        </div>
    );
}
