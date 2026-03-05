"use client";

import { useEffect, useState } from "react";

interface KPIs {
  totalIngresos: number;
  totalGastos: number;
  balanceNeto: number;
  totalBalance: number;
  totalIVACobrado: number;
  totalIVAPagado: number;
  transactionCount: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  registeredBy: { name: string; avatarUrl: string | null };
  event: { name: string } | null;
}

interface Account {
  name: string;
  balance: number;
  type: string;
}

export default function FinanzasPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<
    Record<string, number>
  >({});
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [period]);

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/summary?period=${period}`);
      const data = await res.json();
      setKpis(data.kpis);
      setRecentTransactions(data.recentTransactions || []);
      setAccounts(data.accounts || []);
      setGastosPorCategoria(data.gastosPorCategoria || {});
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

  const maxGasto =
    Object.values(gastosPorCategoria).length > 0
      ? Math.max(...Object.values(gastosPorCategoria))
      : 1;

  return (
    <div
      style={{ padding: "var(--space-6)", maxWidth: 1200, margin: "0 auto" }}
    >
      {/* Header */}
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
            Panel Financiero
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              marginTop: "var(--space-1)",
            }}
          >
            Resumen ejecutivo de ingresos, gastos y estado de cuentas
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
                transition: "var(--transition-fast)",
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
          Cargando datos financieros...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-4)",
              marginBottom: "var(--space-6)",
            }}
          >
            <KPICard
              label="Ingresos"
              value={formatCurrency(kpis?.totalIngresos || 0)}
              color="#00e676"
            />
            <KPICard
              label="Gastos"
              value={formatCurrency(kpis?.totalGastos || 0)}
              color="#ff5252"
            />
            <KPICard
              label="Balance Neto"
              value={formatCurrency(kpis?.balanceNeto || 0)}
              color={(kpis?.balanceNeto || 0) >= 0 ? "#00e676" : "#ff5252"}
            />
            <KPICard
              label="Saldo en Cuentas"
              value={formatCurrency(kpis?.totalBalance || 0)}
              color="var(--color-accent)"
            />
          </div>

          {/* Two columns: Gastos breakdown + Accounts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
              marginBottom: "var(--space-6)",
            }}
          >
            {/* Gastos by Category */}
            <div className="glass-card" style={{ padding: "var(--space-5)" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "var(--text-lg)",
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{ display: "inline-block" }}
                ></span>{" "}
                Gastos por Categoría
              </h3>
              {Object.keys(gastosPorCategoria).length === 0 ? (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    textAlign: "center",
                    padding: "var(--space-6)",
                  }}
                >
                  No hay gastos registrados aún
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  {Object.entries(gastosPorCategoria)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => (
                      <div key={cat}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "var(--text-sm)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {cat}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: "var(--color-bg-input)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${(amount / maxGasto) * 100}%`,
                              background:
                                "linear-gradient(90deg, var(--color-accent), #7c4dff)",
                              borderRadius: 4,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Accounts */}
            <div className="glass-card" style={{ padding: "var(--space-5)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-4)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <span
                    className="nav-dot"
                    style={{ display: "inline-block" }}
                  ></span>{" "}
                  Cuentas
                </h3>
                <button
                  onClick={() => (window.location.href = "/finanzas/cuentas")}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-xs)",
                    cursor: "pointer",
                  }}
                >
                  Administrar
                </button>
              </div>
              {accounts.length === 0 ? (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    textAlign: "center",
                    padding: "var(--space-6)",
                  }}
                >
                  No hay cuentas registradas
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  {accounts.map((acc, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-3) var(--space-4)",
                        background: "var(--color-bg-input)",
                        borderRadius: "var(--radius-lg)",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {acc.name}
                        </span>
                        <span
                          style={{
                            marginLeft: "var(--space-2)",
                            fontSize: "var(--text-xs)",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            background:
                              acc.type === "BANCARIA"
                                ? "rgba(0,230,118,0.15)"
                                : acc.type === "CAJA"
                                  ? "rgba(255,167,38,0.15)"
                                  : "rgba(124,77,255,0.15)",
                            color:
                              acc.type === "BANCARIA"
                                ? "#00e676"
                                : acc.type === "CAJA"
                                  ? "#ffa726"
                                  : "#7c4dff",
                            fontWeight: 700,
                          }}
                        >
                          {acc.type}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "var(--text-base)",
                          color:
                            Number(acc.balance) >= 0 ? "#00e676" : "#ff5252",
                        }}
                      >
                        {formatCurrency(Number(acc.balance))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card" style={{ padding: "var(--space-5)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "var(--text-lg)",
                  color: "var(--color-text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <span
                  className="nav-dot"
                  style={{ display: "inline-block" }}
                ></span>{" "}
                Últimas Transacciones
              </h3>
              <button
                onClick={() =>
                  (window.location.href = "/finanzas/transacciones")
                }
                style={{
                  padding: "var(--space-2) var(--space-4)",
                  background: "var(--color-accent)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                }}
              >
                Ver Todas →
              </button>
            </div>
            {recentTransactions.length === 0 ? (
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-sm)",
                  textAlign: "center",
                  padding: "var(--space-6)",
                }}
              >
                No hay transacciones registradas.{" "}
                <a
                  href="/finanzas/transacciones"
                  style={{ color: "var(--color-accent)" }}
                >
                  Registrar la primera →
                </a>
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {[
                      "Fecha",
                      "Tipo",
                      "Categoría",
                      "Descripción",
                      "Monto",
                      "Registrado por",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "var(--space-2) var(--space-3)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t) => (
                    <tr
                      key={t.id}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <td
                        style={{
                          padding: "var(--space-3)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {formatDate(t.date)}
                      </td>
                      <td style={{ padding: "var(--space-3)" }}>
                        <span
                          style={{
                            padding: "2px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 700,
                            background:
                              t.type === "INGRESO"
                                ? "rgba(0,230,118,0.15)"
                                : "rgba(255,82,82,0.15)",
                            color: t.type === "INGRESO" ? "#00e676" : "#ff5252",
                          }}
                        >
                          {t.type === "INGRESO" ? "↑ Ingreso" : "↓ Gasto"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "var(--space-3)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {t.category}
                      </td>
                      <td
                        style={{
                          padding: "var(--space-3)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {t.description}
                        {t.event && (
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-muted)",
                              marginLeft: "var(--space-1)",
                            }}
                          >
                            ({t.event.name})
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "var(--space-3)",
                          fontSize: "var(--text-sm)",
                          fontWeight: 700,
                          color: t.type === "INGRESO" ? "#00e676" : "#ff5252",
                        }}
                      >
                        {t.type === "INGRESO" ? "+" : "-"}
                        {formatCurrency(Number(t.amount))}
                      </td>
                      <td
                        style={{
                          padding: "var(--space-3)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {t.registeredBy.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
      >
        <span
          className="nav-dot"
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        ></span>
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: 800,
          color,
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
