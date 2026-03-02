"use client";

import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // TODO: Connect to Supabase Auth
        try {
            // Placeholder — will use Supabase client
            console.log("Login attempt:", { email });
            setError("Supabase aún no está conectado. Configura las variables de entorno.");
        } catch (err) {
            setError("Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
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
            <div style={{
                width: "100%",
                maxWidth: 420,
                animation: "fade-in 0.4s ease-out",
            }}>
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
                        Acceso al Panel de Control
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card" style={{ padding: "var(--space-8)" }}>
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        {/* Email */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                color: "var(--color-text-secondary)",
                            }}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@eventosprimeai.com"
                                required
                                style={{
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
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                            <label style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                color: "var(--color-text-secondary)",
                            }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
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
                                }}
                            />
                        </div>

                        {/* Error */}
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

                        {/* Submit */}
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
                            {loading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>
                </div>

                {/* Footer */}
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
