"use client";

export default function DocumentosPage() {
    return (
        <div style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                📄 Documentos
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-6)" }}>
                Generador de facturas, órdenes de compra, contratos y recibos
            </p>
            <div className="glass-card" style={{ padding: "var(--space-12)", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: "var(--space-4)" }}>🏗️</div>
                <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Módulo en Desarrollo</h2>
                <p style={{ color: "var(--color-text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
                    Plantillas de documentos con formularios dinámicos, generación de PDF descargable
                    y envío automático por email. Incluirá facturas, órdenes de compra, contratos y recibos.
                </p>
            </div>
        </div>
    );
}
