"use client";

export default function ReportesPage() {
    return (
        <div style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                📈 Reportes Financieros
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-6)" }}>
                Informes de P&amp;L, flujo de caja, balance y más
            </p>
            <div className="glass-card" style={{ padding: "var(--space-12)", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: "var(--space-4)" }}>🏗️</div>
                <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Módulo en Desarrollo</h2>
                <p style={{ color: "var(--color-text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
                    Generación de reportes financieros descargables (PDF/Excel): P&amp;L, Balance General,
                    Flujo de Caja y reportes por evento. Con opción de envío automático por email vía n8n.
                </p>
            </div>
        </div>
    );
}
