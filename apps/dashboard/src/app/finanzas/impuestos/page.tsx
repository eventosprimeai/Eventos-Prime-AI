"use client";

export default function ImpuestosPage() {
    return (
        <div style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                🧾 Impuestos
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-6)" }}>
                Control fiscal, IVA y retenciones
            </p>
            <div className="glass-card" style={{ padding: "var(--space-12)", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: "var(--space-4)" }}>🏗️</div>
                <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Módulo en Desarrollo</h2>
                <p style={{ color: "var(--color-text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
                    El módulo fiscal incluirá cálculo automático de IVA cobrado vs pagado, retenciones,
                    calendario de vencimientos tributarios y exportación de datos para el contador.
                </p>
            </div>
        </div>
    );
}
