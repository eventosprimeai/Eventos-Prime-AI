"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  type: string;
  category: string;
  subcategory: string | null;
  description: string;
  amount: number;
  taxAmount: number | null;
  date: string;
  reference: string | null;
  status: string;
  attachmentUrl: string | null;
  registeredBy: { name: string; avatarUrl: string | null };
  event: { name: string } | null;
  supplier: { companyName: string } | null;
  account: { name: string; bankName: string | null } | null;
}

interface Event {
  id: string;
  name: string;
}
interface Account {
  id: string;
  name: string;
}

const CATEGORIES = [
  "Marketing",
  "Producción",
  "Sonido",
  "Iluminación",
  "Escenario",
  "Logística",
  "Seguridad",
  "Catering",
  "Artistas",
  "Decoración",
  "Transporte",
  "Alquiler de Equipos",
  "Personal",
  "Seguros",
  "Comisión Bancaria",
  "Impuestos",
  "Servicios Básicos",
  "Tecnología",
  "Venta de Tickets",
  "Patrocinios",
  "Otros Ingresos",
  "Otro",
];

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Form state
  const [form, setForm] = useState({
    type: "GASTO",
    category: "",
    subcategory: "",
    description: "",
    amount: "",
    taxRate: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    accountId: "",
    eventId: "",
    supplierId: "",
  });
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrProvider, setOcrProvider] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [ocrFileName, setOcrFileName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [txRes, evRes, accRes] = await Promise.all([
        fetch("/api/finance/transactions"),
        fetch("/api/events"),
        fetch("/api/finance/accounts"),
      ]);
      const txData = await txRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
      const evData = await evRes.json();
      setEvents(Array.isArray(evData) ? evData : []);
      const accData = await accRes.json();
      setAccounts(Array.isArray(accData) ? accData : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // Compress image to reduce size before sending to Gemini
  function compressImage(file: File, maxWidth = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject("Error al leer la imagen");
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject("Error al cargar la imagen");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width,
            h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject("Error de canvas");
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleOCR(file: File) {
    setScanning(true);
    setOcrConfidence(null);
    setOcrProvider("");
    setOcrError("");
    setOcrFileName(file.name);

    // Validate file size (max 15MB raw)
    if (file.size > 15 * 1024 * 1024) {
      setOcrError("Archivo demasiado grande (máx. 15MB)");
      setScanning(false);
      return;
    }

    try {
      let base64: string;
      const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (isPDF) {
        // PDFs: read directly as base64
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject("Error al leer el PDF");
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        // Images: compress before sending
        base64 = await compressImage(file);
      }

      const res = await fetch("/api/finance/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();

      if (data.success && data.extracted) {
        const e = data.extracted;
        setForm((f) => ({
          ...f,
          type: e.tipo || f.type,
          category: CATEGORIES.includes(e.categoria) ? e.categoria : f.category,
          description: e.descripcion || f.description,
          amount: e.monto ? String(e.monto) : f.amount,
          taxRate: e.tasaIVA ? String(e.tasaIVA) : f.taxRate,
          date: e.fecha || f.date,
          reference: e.referencia || f.reference,
        }));
        setOcrConfidence(e.confianza || null);
        setOcrProvider(e.proveedor || "");
        setOcrError("");
      } else {
        setOcrError(data.error || "No se pudieron extraer datos del documento");
      }
    } catch (err: any) {
      setOcrError(
        typeof err === "string" ? err : err.message || "Error inesperado",
      );
    }
    setScanning(false);
  }

  async function handleSubmit() {
    if (!form.category || !form.description || !form.amount || !form.date || !form.eventId)
      return;
    setSaving(true);
    try {
      const taxRate = form.taxRate ? parseFloat(form.taxRate) : null;
      const taxAmount = taxRate
        ? parseFloat(form.amount) * (taxRate / 100)
        : null;
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          taxRate,
          taxAmount,
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
          accountId: form.accountId || null,
          eventId: form.eventId || null,
          supplierId: form.supplierId || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          type: "GASTO",
          category: "",
          subcategory: "",
          description: "",
          amount: "",
          taxRate: "",
          date: new Date().toISOString().split("T")[0],
          reference: "",
          accountId: "",
          eventId: "",
          supplierId: "",
        });
        setAttachmentUrl("");
        setAttachmentName("");
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
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

  const filtered = transactions.filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  const totalIngresos = filtered
    .filter((t) => t.type === "INGRESO")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalGastos = filtered
    .filter((t) => t.type === "GASTO")
    .reduce((s, t) => s + Number(t.amount), 0);

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
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
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
            {showModal ? "Nueva Transacción" : "Transacciones"}
          </h3>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              marginTop: "var(--space-1)",
            }}
          >
            Registro de ingresos y gastos de la empresa
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            onClick={() => {
              setForm((f) => ({ ...f, type: "INGRESO" }));
              setShowModal(true);
            }}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: "linear-gradient(135deg, #00c853, #00e676)",
              color: "#000",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Ingreso
          </button>
          <button
            onClick={() => {
              setForm((f) => ({ ...f, type: "GASTO" }));
              setShowModal(true);
            }}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: "linear-gradient(135deg, #d50000, #ff5252)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Gasto
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          className="glass-card"
          style={{ padding: "var(--space-4)", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              marginBottom: "var(--space-1)",
            }}
          >
            Total Ingresos
          </div>
          <div
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "#00e676",
            }}
          >
            {formatCurrency(totalIngresos)}
          </div>
        </div>
        <div
          className="glass-card"
          style={{ padding: "var(--space-4)", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              marginBottom: "var(--space-1)",
            }}
          >
            Total Gastos
          </div>
          <div
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "#ff5252",
            }}
          >
            {formatCurrency(totalGastos)}
          </div>
        </div>
        <div
          className="glass-card"
          style={{ padding: "var(--space-4)", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              marginBottom: "var(--space-1)",
            }}
          >
            Transacciones
          </div>
          <div
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
            }}
          >
            {filtered.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="glass-card"
        style={{
          padding: "var(--space-3) var(--space-4)",
          display: "flex",
          gap: "var(--space-3)",
          alignItems: "center",
          marginBottom: "var(--space-4)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            fontWeight: 600,
          }}
        >
          Filtrar:
        </span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: "var(--space-1) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="INGRESO">Ingresos</option>
          <option value="GASTO">Gastos</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "var(--space-1) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
          }}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div
        className="glass-card"
        style={{ padding: "var(--space-4)", overflow: "auto" }}
      >
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
            Cargando transacciones...
          </div>
        ) : filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "var(--space-8)",
              color: "var(--color-text-muted)",
            }}
          >
            No hay transacciones registradas. Usa los botones de arriba para
            agregar una.
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
                  "Ref.",
                  "Monto",
                  "IVA",
                  "Cuenta",
                  "Estado",
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
              {filtered.map((t) => (
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
                      {t.type === "INGRESO" ? "Ingreso" : "Gasto"}
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
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.description}
                    {t.attachmentUrl && (
                      <span
                        title="Comprobante adjunto"
                        style={{ marginLeft: 4 }}
                      ></span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-3)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t.reference || "—"}
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
                    {t.taxAmount ? formatCurrency(Number(t.taxAmount)) : "—"}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-3)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t.account?.name || "—"}
                  </td>
                  <td style={{ padding: "var(--space-3)" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        background:
                          t.status === "APROBADO"
                            ? "rgba(0,230,118,0.15)"
                            : t.status === "ANULADO"
                              ? "rgba(255,82,82,0.15)"
                              : "rgba(255,167,38,0.15)",
                        color:
                          t.status === "APROBADO"
                            ? "#00e676"
                            : t.status === "ANULADO"
                              ? "#ff5252"
                              : "#ffa726",
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Transaction Modal */}
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
              maxWidth: 600,
              maxHeight: "85vh",
              overflow: "auto",
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
              {form.type === "INGRESO"
                ? "Registrar Ingreso"
                : "Registrar Gasto"}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              {/* OCR Scanner */}
              <div
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-lg)",
                  border: ocrError
                    ? "2px dashed #ff5252"
                    : ocrConfidence !== null
                      ? "2px solid #00e676"
                      : "2px dashed var(--color-border)",
                  textAlign: "center",
                  background: scanning
                    ? "rgba(124,77,255,0.08)"
                    : ocrConfidence !== null
                      ? "rgba(0,230,118,0.05)"
                      : ocrError
                        ? "rgba(255,82,82,0.05)"
                        : "var(--color-bg-input)",
                  transition: "var(--transition-fast)",
                }}
              >
                {scanning ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-3)",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        border: "3px solid var(--color-accent)",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span
                      style={{
                        color: "var(--color-accent)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Gemini AI analizando comprobante...
                    </span>
                    {ocrFileName && (
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {" "}
                        {ocrFileName}
                      </span>
                    )}
                  </div>
                ) : (
                  <label
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "var(--space-1)",
                      padding: "var(--space-2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-text-secondary)",
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                        }}
                      >
                        {ocrFileName
                          ? "Escanear otro comprobante"
                          : "Escanear Comprobante (IA)"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Sube imagen o PDF de factura, recibo o depósito
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleOCR(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
                {ocrFileName &&
                  !scanning &&
                  ocrConfidence === null &&
                  !ocrError && (
                    <div
                      style={{
                        marginTop: "var(--space-1)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      📎 {ocrFileName}
                    </div>
                  )}
                {ocrConfidence !== null && (
                  <div
                    style={{
                      marginTop: "var(--space-2)",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(0,230,118,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "#00e676",
                          fontWeight: 700,
                        }}
                      >
                        Datos extraídos automáticamente
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "var(--space-3)",
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: ocrConfidence > 70 ? "#00e676" : "#ffa726",
                          fontWeight: 600,
                        }}
                      >
                        Confianza: {ocrConfidence}%
                      </span>
                      {ocrProvider && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Proveedor: {ocrProvider}
                        </span>
                      )}
                      {ocrFileName && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {ocrFileName}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Verifica los datos abajo y ajusta si es necesario
                    </div>
                  </div>
                )}
                {ocrError && (
                  <div
                    style={{
                      marginTop: "var(--space-2)",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(255,82,82,0.08)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "#ff5252",
                        fontWeight: 600,
                      }}
                    >
                      Error: {ocrError}
                    </span>
                    {ocrFileName && (
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          marginLeft: 8,
                        }}
                      >
                        ({ocrFileName})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Type Toggle */}
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {["INGRESO", "GASTO"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    style={{
                      flex: 1,
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background:
                        form.type === t
                          ? t === "INGRESO"
                            ? "#00e676"
                            : "#ff5252"
                          : "var(--color-bg-input)",
                      color:
                        form.type === t
                          ? "#000"
                          : "var(--color-text-secondary)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t === "INGRESO" ? "↑ Ingreso" : "↓ Gasto"}
                  </button>
                ))}
              </div>

              {/* Category */}
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
                  Categoría *
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
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
                  Descripción *
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Ej: Pago DJ noche principal"
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

              {/* Amount + Tax */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
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
                    Monto (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="0.00"
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
                    % IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, taxRate: e.target.value }))
                    }
                    placeholder="15"
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
              </div>

              {/* Date + Reference */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
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
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
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
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reference: e.target.value }))
                    }
                    placeholder="Nro. factura"
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
              </div>

              {/* Event + Account */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
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
                    Evento *
                  </label>
                  <select
                    value={form.eventId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, eventId: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="">Sin evento</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
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
                    Cuenta
                  </label>
                  <select
                    value={form.accountId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, accountId: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="">Sin cuenta</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* IVA Preview */}
              {form.amount && form.taxRate && (
                <div
                  style={{
                    padding: "var(--space-3)",
                    background: "rgba(124,77,255,0.1)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(124,77,255,0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Subtotal:
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(parseFloat(form.amount))}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      IVA ({form.taxRate}%):
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(
                        (parseFloat(form.amount) * parseFloat(form.taxRate)) /
                        100,
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--text-base)",
                      borderTop: "1px solid rgba(124,77,255,0.2)",
                      paddingTop: "var(--space-2)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontWeight: 700,
                      }}
                    >
                      Total:
                    </span>
                    <span
                      style={{ color: "var(--color-accent)", fontWeight: 800 }}
                    >
                      {formatCurrency(
                        parseFloat(form.amount) *
                        (1 + parseFloat(form.taxRate) / 100),
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
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
                  onClick={handleSubmit}
                  disabled={
                    saving ||
                    !form.category ||
                    !form.description ||
                    !form.amount ||
                    !form.eventId
                  }
                  style={{
                    flex: 1,
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background:
                      form.type === "INGRESO"
                        ? "linear-gradient(135deg, #00c853, #00e676)"
                        : "linear-gradient(135deg, #d50000, #ff5252)",
                    color: form.type === "INGRESO" ? "#000" : "#fff",
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                    opacity:
                      !form.category || !form.description || !form.amount || !form.eventId
                        ? 0.5
                        : 1,
                  }}
                >
                  {saving
                    ? "Guardando..."
                    : `Registrar ${form.type === "INGRESO" ? "Ingreso" : "Gasto"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
