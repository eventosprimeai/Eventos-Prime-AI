"use client";

import React, { useEffect, useState } from "react";
import { Apple, Smartphone, LayoutDashboard, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function DescargaPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const btnStyleDownload = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px 32px",
        background: "var(--gradient-gold)",
        color: "var(--color-bg-primary)",
        border: "none",
        borderRadius: "var(--radius-xl)",
        cursor: "pointer",
        textDecoration: "none",
        fontWeight: "bold",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 0 15px rgba(250, 204, 21, 0.2)",
    };

    const btnStyleSecondary = {
        ...btnStyleDownload,
        background: "var(--color-bg-card)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border)",
        boxShadow: "none",
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-bg-primary)",
            backgroundImage: "radial-gradient(ellipse at top, #1e1e2e 0%, var(--color-bg-primary) 70%)",
            position: "relative",
            overflow: "hidden",
            padding: "var(--space-4)"
        }}>
            {/* Background elements */}
            <div style={{
                position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%",
                borderRadius: "50%", opacity: 0.15, filter: "blur(100px)",
                background: "radial-gradient(circle, var(--color-gold-400) 0%, transparent 70%)",
                pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", bottom: "-10%", right: "-10%", width: "50%", height: "50%",
                borderRadius: "50%", opacity: 0.1, filter: "blur(120px)",
                background: "radial-gradient(circle, var(--color-gold-400) 0%, transparent 70%)",
                pointerEvents: "none"
            }} />

            <div style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                maxWidth: "1000px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "var(--space-12)",
                justifyContent: "center"
            }}>
                {/* Left content */}
                <div style={{ flex: "1 1 400px", textAlign: "left" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 16px",
                        borderRadius: "999px",
                        border: "1px solid rgba(250, 204, 21, 0.3)",
                        background: "rgba(250, 204, 21, 0.05)",
                        marginBottom: "var(--space-6)"
                    }}>
                        <Sparkles size={14} color="var(--color-gold-400)" />
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "1px", color: "var(--color-gold-400)", textTransform: "uppercase" }}>
                            Sistema Centralizado
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: "clamp(2rem, 5vw, 3.5rem)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.1,
                        marginBottom: "var(--space-6)"
                    }}>
                        Bienvenido a <br />
                        <span style={{ color: "var(--color-gold-400)" }}>
                            EventosPrime AI
                        </span>
                    </h1>

                    <p style={{
                        fontSize: "1.1rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                        marginBottom: "var(--space-8)",
                        maxWidth: "500px"
                    }}>
                        Tu perfil ha sido creado exitosamente. Para comenzar a gestionar tus responsabilidades y coordinar operaciones en tiempo real, descarga nuestra aplicación móvil.
                    </p>

                    <div style={{
                        display: "flex",
                        gap: "var(--space-4)",
                        flexWrap: "wrap",
                        marginBottom: "var(--space-10)"
                    }}>
                        <a href="#" style={btnStyleDownload} className="btn-hover-scale" onClick={(e) => e.preventDefault()}>
                            <Apple size={28} />
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
                                <span style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.8 }}>Descargar en</span>
                                <span style={{ fontSize: "1.1rem" }}>App Store</span>
                            </div>
                        </a>
                        <a href="#" style={btnStyleSecondary} className="btn-hover-scale" onClick={(e) => e.preventDefault()}>
                            <Smartphone size={28} color="#4ade80" />
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
                                <span style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Descargar en</span>
                                <span style={{ fontSize: "1.1rem" }}>Google Play</span>
                            </div>
                        </a>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "var(--space-6)" }}>
                        <div style={{ height: "1px", width: "40px", background: "var(--color-border)" }} />
                        <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 500 }}>O prefiere la versión web</span>
                        <div style={{ height: "1px", width: "40px", background: "var(--color-border)" }} />
                    </div>

                    <div>
                        <a href="/login?next=/" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            color: "var(--color-text-secondary)",
                            textDecoration: "none",
                            borderRadius: "var(--radius-lg)",
                            transition: "color 0.2s"
                        }}>
                            <LayoutDashboard size={18} color="var(--color-gold-400)" />
                            <span style={{ fontWeight: 600 }}>Ir al Panel de Control Web</span>
                            <ArrowRight size={16} color="var(--color-gold-400)" />
                        </a>
                    </div>
                </div>

                {/* Right side graphic */}
                <div style={{ flex: "1 1 350px", maxWidth: "450px" }}>
                    <div style={{
                        padding: "1px",
                        background: "linear-gradient(to bottom, rgba(250,204,21,0.3), rgba(255,255,255,0.05))",
                        borderRadius: "24px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                    }}>
                        <div style={{
                            background: "var(--color-bg-elevated)",
                            borderRadius: "23px",
                            padding: "var(--space-8)",
                            height: "100%"
                        }}>
                            <div style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "16px",
                                background: "linear-gradient(135deg, var(--color-bg-card), var(--color-bg-primary))",
                                border: "1px solid var(--color-border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "var(--space-6)",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                            }}>
                                <ShieldCheck size={32} color="var(--color-gold-400)" />
                            </div>

                            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Seguridad y Control</h3>
                            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
                                Tu acceso ha sido encriptado. Utiliza las credenciales que enviamos a tu correo electrónico para iniciar sesión de inmediato.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {[
                                    { title: "Gestión en Tiempo Real", desc: "Supervisa tareas y operaciones al instante.", icon: "⚡" },
                                    { title: "Notificaciones Integradas", desc: "Alertas push directas para tu rol específico.", icon: "🔔" },
                                    { title: "Comunicación Segura", desc: "Módulo de chat interno con el equipo.", icon: "💬" }
                                ].map((feature, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        gap: "16px",
                                        padding: "16px",
                                        borderRadius: "16px",
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                    }}>
                                        <div style={{ fontSize: "1.5rem" }}>{feature.icon}</div>
                                        <div>
                                            <h4 style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "0.875rem" }}>{feature.title}</h4>
                                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
