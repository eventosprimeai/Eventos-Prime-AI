"use client";

import { useEffect, useState } from "react";

interface TaxSummary {
  kpis: {
    totalIVACobrado: number;
    totalIVAPagado: number;
    totalIngresos: number;
    totalGastos: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number | null;
  taxRate: number | null;
  date: string;
}

// Ecuadorian tax calendar (approximate)
const TAX_CALENDAR = [
  { month: "Enero", deadline: "10 Feb", concept: "Declaración IVA" },
  { month: "Febrero", deadline: "10 Mar", concept: "Declaración IVA" },
  {
    month: "Marzo",
    deadline: "10 Abr",
    concept: "Declaración IVA + Impuesto a la Renta Anual",
  },
  { month: "Abril", deadline: "10 May", concept: "Declaración IVA" },
  { month: "Mayo", deadline: "10 Jun", concept: "Declaración IVA" },
  { month: "Junio", deadline: "10 Jul", concept: "Declaración IVA" },
  {
    month: "Julio",
    deadline: "10 Ago",
    concept: "Declaración IVA + Anticipo IR (1ra cuota)",
  },
  { month: "Agosto", deadline: "10 Sep", concept: "Declaración IVA" },
  {
    month: "Septiembre",
    deadline: "10 Oct",
    concept: "Declaración IVA + Anticipo IR (2da cuota)",
  },
  { month: "Octubre", deadline: "10 Nov", concept: "Declaración IVA" },
  { month: "Noviembre", deadline: "10 Dic", concept: "Declaración IVA" },
  { month: "Diciembre", deadline: "10 Ene", concept: "Declaración IVA" },
];

export default function ImpuestosPage() {
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        fetch(`/api/finance/summary?period=${period}`),
        fetch("/api/finance/transactions"),
      ]);
      setSummary(await sumRes.json());
      const allTx = await txRes.json();
      setTransactions(
        Array.isArray(allTx)
          ? allTx.filter(
              (t: Transaction) => t.taxAmount && Number(t.taxAmount) > 0,
            )
          : [],
      );
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(n);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const ivaCobrado = summary?.kpis?.totalIVACobrado || 0;
  const ivaPagado = summary?.kpis?.totalIVAPagado || 0;
  const ivaAPagar = ivaCobrado - ivaPagado;
  const currentMonth = new Date().getMonth();

  return (
    <div
      style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-6)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "var(--text-3xl)",
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <span
              className="nav-dot"
              style={{ width: 12, height: 12, display: "inline-block" }}
            ></span>{" "}
            Impuestos
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              marginTop: "var(--space-1)",
            }}
          >
            Control fiscal, IVA y calendario de obligaciones tributarias
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {["month", "year", "all"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-lg)",
                border:
                  period === p
                    ? "2px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
                background:
                  period === p
                    ? "var(--color-accent)"
                    : "var(--color-bg-input)",
                color: period === p ? "#000" : "var(--color-text-secondary)",
                fontWeight: 700,
                fontSize: "var(--text-sm)",
                cursor: "pointer",
              }}
            >
              {p === "month" ? "Este Mes" : p === "year" ? "Este Año" : "Todo"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-12)",
            color: "var(--color-text-muted)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--color-border)",
              borderTop: "3px solid var(--color-gold-400)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto var(--space-4)",
            }}
          />
          Cargando datos fiscales...
        </div>
      ) : (
        <>
          {/* IVA Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-4)",
              marginBottom: "var(--space-6)",
            }}
          >
            <div
              className="glass-card"
              style={{ padding: "var(--space-5)", textAlign: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{
                    width: 24,
                    height: 24,
                    display: "inline-block",
                    background: "#00e676",
                    boxShadow: "0 0 15px #00e676",
                  }}
                ></span>
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                IVA Cobrado (Ventas)
              </div>
              <div
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 800,
                  color: "#00e676",
                  fontFamily: "var(--font-display)",
                }}
              >
                {formatCurrency(ivaCobrado)}
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  marginTop: 4,
                }}
              >
                Sobre ingresos de{" "}
                {formatCurrency(summary?.kpis?.totalIngresos || 0)}
              </div>
            </div>
            <div
              className="glass-card"
              style={{ padding: "var(--space-5)", textAlign: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{
                    width: 24,
                    height: 24,
                    display: "inline-block",
                    background: "#ff5252",
                    boxShadow: "0 0 15px #ff5252",
                  }}
                ></span>
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                IVA Pagado (Compras)
              </div>
              <div
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 800,
                  color: "#ff5252",
                  fontFamily: "var(--font-display)",
                }}
              >
                {formatCurrency(ivaPagado)}
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  marginTop: 4,
                }}
              >
                Sobre gastos de{" "}
                {formatCurrency(summary?.kpis?.totalGastos || 0)}
              </div>
            </div>
            <div
              className="glass-card"
              style={{
                padding: "var(--space-5)",
                textAlign: "center",
                borderLeft: `4px solid ${ivaAPagar >= 0 ? "#ffa726" : "#00e676"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{
                    width: 24,
                    height: 24,
                    display: "inline-block",
                    background: ivaAPagar >= 0 ? "#ffa726" : "#00e676",
                    boxShadow: `0 0 15px ${ivaAPagar >= 0 ? "#ffa726" : "#00e676"}`,
                  }}
                ></span>
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                {ivaAPagar >= 0 ? "IVA a Pagar" : "Crédito Tributario"}
              </div>
              <div
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 800,
                  color: ivaAPagar >= 0 ? "#ffa726" : "#00e676",
                  fontFamily: "var(--font-display)",
                }}
              >
                {formatCurrency(Math.abs(ivaAPagar))}
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  marginTop: 4,
                }}
              >
                {ivaAPagar >= 0
                  ? "Diferencia a favor del SRI"
                  : "Diferencia a tu favor"}
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
              marginBottom: "var(--space-6)",
            }}
          >
            {/* Tax Calendar */}
            <div className="glass-card" style={{ padding: "var(--space-5)" }}>
              <h3
                style={{
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--space-4)",
                  fontSize: "var(--text-lg)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{ display: "inline-block" }}
                ></span>{" "}
                Calendario Tributario
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                {TAX_CALENDAR.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      background:
                        i === currentMonth
                          ? "rgba(124,77,255,0.1)"
                          : "transparent",
                      border:
                        i === currentMonth
                          ? "1px solid rgba(124,77,255,0.3)"
                          : "1px solid transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      {i === currentMonth && (
                        <span
                          className="nav-dot"
                          style={{
                            display: "inline-block",
                            background: "var(--color-accent)",
                            boxShadow: "0 0 10px var(--color-accent)",
                          }}
                        ></span>
                      )}
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: i === currentMonth ? 700 : 400,
                          color:
                            i === currentMonth
                              ? "var(--color-accent)"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {item.month}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {item.deadline}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {item.concept}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions with IVA */}
            <div className="glass-card" style={{ padding: "var(--space-5)" }}>
              <h3
                style={{
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--space-4)",
                  fontSize: "var(--text-lg)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{ display: "inline-block" }}
                ></span>{" "}
                Transacciones con IVA
              </h3>
              {transactions.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    padding: "var(--space-6)",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  No hay transacciones con IVA registrado
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                    maxHeight: 480,
                    overflow: "auto",
                  }}
                >
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-2) var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-bg-input)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          {t.description}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {formatDate(t.date)} • {t.category}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 700,
                            color: t.type === "INGRESO" ? "#00e676" : "#ff5252",
                          }}
                        >
                          {formatCurrency(Number(t.amount))}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-accent)",
                          }}
                        >
                          IVA: {formatCurrency(Number(t.taxAmount))} (
                          {t.taxRate}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
