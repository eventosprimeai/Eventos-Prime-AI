"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function UnauthorizedPage() {
    const searchParams = useSearchParams();
    const target = searchParams.get("target") || "Información Protegida";

    useEffect(() => {
        // Log the security attempt silently
        fetch("/api/notifications/security", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target })
        }).catch(() => { });
    }, [target]);

    return (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)" }}>
            <div className="glass-card animate-fade-in" style={{ padding: "var(--space-8)", maxWidth: 600, width: "100%", textAlign: "center", border: "2px solid #ff4444" }}>
                <div style={{ fontSize: "60px", marginBottom: "var(--space-4)" }}>⛔</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "#ff4444", marginBottom: "var(--space-2)" }}>ACCESO DENEGADO</h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-lg)", lineHeight: 1.6, marginBottom: "var(--space-6)" }}>
                    Usted no tiene acceso a esta sección del sistema o a este evento según su categoría.
                </p>

                <div style={{ background: "rgba(255, 68, 68, 0.1)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px dashed #ff4444", marginBottom: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 600 }}>Alerta de Seguridad Registrada</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Su intento de acceso ha sido bloqueado y notificado automáticamente a la Dirección Gral.</span>
                </div>

                <a href="/" style={{ display: "inline-block", textDecoration: "none", padding: "var(--space-3) var(--space-6)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", fontWeight: 700, cursor: "pointer", transition: "var(--transition-fast)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg-elevated)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--color-bg-input)"}>
                    🔙 Volver al Inicio
                </a>
            </div>
        </div>
    );
}
