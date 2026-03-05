"use client";

import { useEffect, useState } from "react";

interface Account {
  id: string;
  name: string;
  type: string;
  bankName: string | null;
  accountNum: string | null;
  currency: string;
  balance: number;
  active: boolean;
}

export default function CuentasPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "BANCARIA",
    bankName: "",
    accountNum: "",
    currency: "USD",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    const res = await fetch("/api/finance/accounts");
    setAccounts(await res.json());
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({
        name: "",
        type: "BANCARIA",
        bankName: "",
        accountNum: "",
        currency: "USD",
      });
      loadAccounts();
    }
    setSaving(false);
  }

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(n);
  }

  const typeConfig: Record<
    string,
    { icon: string; color: string; bg: string }
  > = {
    BANCARIA: { icon: "🏦", color: "#00e676", bg: "rgba(0,230,118,0.12)" },
    CAJA: { icon: "💵", color: "#ffa726", bg: "rgba(255,167,38,0.12)" },
    DIGITAL: { icon: "💳", color: "#7c4dff", bg: "rgba(124,77,255,0.12)" },
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div
      style={{ padding: "var(--space-6)", maxWidth: 1000, margin: "0 auto" }}
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
            }}
          >
            🏦 Cuentas Financieras
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              marginTop: "var(--space-1)",
            }}
          >
            Administra tus cuentas bancarias, caja y billeteras digitales
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-lg)",
            border: "none",
            background: "var(--color-accent)",
            color: "#000",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Nueva Cuenta
        </button>
      </div>

      {/* Total Balance */}
      <div
        className="glass-card"
        style={{
          padding: "var(--space-5)",
          marginBottom: "var(--space-6)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Balance Total
        </span>
        <div
          style={{
            fontSize: "var(--text-4xl)",
            fontWeight: 800,
            color: totalBalance >= 0 ? "#00e676" : "#ff5252",
            fontFamily: "var(--font-display)",
            marginTop: "var(--space-1)",
          }}
        >
          {formatCurrency(totalBalance)}
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-12)",
            color: "var(--color-text-muted)",
          }}
        >
          ⏳ Cargando cuentas...
        </div>
      ) : accounts.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: "var(--space-12)", textAlign: "center" }}
        >
          <div style={{ fontSize: 64, marginBottom: "var(--space-4)" }}>🏦</div>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-lg)",
              marginBottom: "var(--space-4)",
            }}
          >
            No hay cuentas registradas
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "var(--space-2) var(--space-5)",
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: "var(--color-accent)",
              color: "#000",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Crear Primera Cuenta
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {accounts.map((acc) => {
            const cfg = typeConfig[acc.type] || typeConfig.BANCARIA;
            return (
              <div
                key={acc.id}
                className="glass-card"
                style={{
                  padding: "var(--space-5)",
                  borderLeft: `4px solid ${cfg.color}`,
                  transition: "var(--transition-fast)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{cfg.icon}</span>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 700,
                      background: cfg.bg,
                      color: cfg.color,
                    }}
                  >
                    {acc.type}
                  </span>
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    fontSize: "var(--text-base)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {acc.name}
                </h3>
                {acc.bankName && (
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    {acc.bankName}{" "}
                    {acc.accountNum ? `• ****${acc.accountNum}` : ""}
                  </p>
                )}
                <div
                  style={{
                    marginTop: "var(--space-3)",
                    fontSize: "var(--text-2xl)",
                    fontWeight: 800,
                    color: Number(acc.balance) >= 0 ? "#00e676" : "#ff5252",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {formatCurrency(Number(acc.balance))}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  {acc.currency}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
            }}
          />
          <div
            className="glass-card animate-fade-in"
            style={{
              position: "relative",
              width: "90%",
              maxWidth: 480,
              padding: "var(--space-6)",
              zIndex: 101,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "var(--text-xl)",
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              🏦 Nueva Cuenta
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              {/* Type selector */}
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {(["BANCARIA", "CAJA", "DIGITAL"] as const).map((t) => {
                  const cfg = typeConfig[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        flex: 1,
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-lg)",
                        border:
                          form.type === t
                            ? `2px solid ${cfg.color}`
                            : "1px solid var(--color-border)",
                        background:
                          form.type === t ? cfg.bg : "var(--color-bg-input)",
                        color:
                          form.type === t
                            ? cfg.color
                            : "var(--color-text-secondary)",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "var(--text-sm)",
                        textAlign: "center",
                      }}
                    >
                      {cfg.icon} {t}
                    </button>
                  );
                })}
              </div>

              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Nombre de la Cuenta *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder={
                    form.type === "BANCARIA"
                      ? "Ej: Banco Pichincha CTA Ahorros"
                      : form.type === "CAJA"
                        ? "Ej: Caja Chica Oficina"
                        : "Ej: PayPal Empresa"
                  }
                  style={{
                    width: "100%",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {form.type === "BANCARIA" && (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Banco
                    </label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bankName: e.target.value }))
                      }
                      placeholder="Ej: Banco Pichincha"
                      style={{
                        width: "100%",
                        padding: "var(--space-2) var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-bg-input)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Últimos 4 dígitos de cuenta
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={form.accountNum}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          accountNum: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder="1234"
                      style={{
                        width: 120,
                        padding: "var(--space-2) var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-bg-input)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginTop: "var(--space-2)",
                }}
              >
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !form.name}
                  style={{
                    flex: 1,
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: "var(--color-accent)",
                    color: "#000",
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                    opacity: !form.name ? 0.5 : 1,
                  }}
                >
                  {saving ? "Creando..." : "Crear Cuenta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
