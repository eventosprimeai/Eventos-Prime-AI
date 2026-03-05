"use client";

export default function ConciliacionPage() {
  return (
    <div
      style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}
    >
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span className="nav-dot" style={{ width: 12, height: 12, display: "inline-block" }}></span> Conciliación Bancaria
      </h1>
      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "var(--text-sm)",
          marginBottom: "var(--space-6)",
        }}
      >
        Sube estados de cuenta y concilia con registros internos
      </p>
      <div
        className="glass-card"
        style={{ padding: "var(--space-12)", textAlign: "center" }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
          <span className="nav-dot" style={{ width: 32, height: 32, display: "inline-block", background: "var(--color-text-muted)", boxShadow: "0 0 10px var(--color-text-muted)" }}></span>
        </div>
        <h2
          style={{
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          Módulo en Desarrollo
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          La conciliación bancaria con OCR (Google Vision + Gemini AI) está
          planificada para la Fase 3 del módulo financiero. Incluirá subida de
          estados de cuenta, extracción automática de líneas y match con
          transacciones registradas.
        </p>
      </div>
    </div>
  );
}
