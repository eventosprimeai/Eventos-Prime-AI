import { prisma, ParticipantStage } from "@eventos-prime/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function LeadsPage() {
    const leads = await prisma.participant.findMany({
        where: {
            type: "INSTITUCION", // Maybe filter by type, or we could just show all that are PROSPECTO
        },
        include: {
            event: true,
        },
        orderBy: { createdAt: "desc" },
    });

    async function deleteLead(id: string) {
        "use server";
        await prisma.participant.delete({ where: { id } });
        revalidatePath("/marketing/leads");
    }

    return (
        <div className="fade-in" style={{ padding: "var(--space-6)", minHeight: "100vh" }}>
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--space-6)",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--text-3xl)",
                            fontWeight: 800,
                            color: "var(--color-text-primary)",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Leads Captados <span className="text-gold">(N8N / OpenClaw)</span>
                    </h1>
                    <p
                        style={{
                            color: "var(--color-text-muted)",
                            marginTop: "var(--space-2)",
                            fontSize: "var(--text-sm)",
                        }}
                    >
                        Base de prospectos investigada y sincronizada automáticamente vía webhooks.
                    </p>
                </div>
            </header>

            <div
                className="glass-card"
                style={{
                    padding: "var(--space-6)",
                    background: "var(--color-bg-card)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                        }}
                    >
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                                <th style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Entidad</th>
                                <th style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contacto</th>
                                <th style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ubicación</th>
                                <th style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Evento / Etapa</th>
                                <th style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Origen / Info</th>
                                <th style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    style={{
                                        borderBottom: "1px solid var(--color-border-light)",
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    <td style={{ padding: "var(--space-4)" }}>
                                        <div style={{ fontWeight: 600, color: "var(--color-gold-400)" }}>{lead.name}</div>
                                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{lead.type}</div>
                                    </td>
                                    <td style={{ padding: "var(--space-4)" }}>
                                        {lead.contactName && <div style={{ color: "var(--color-text-primary)" }}>{lead.contactName}</div>}
                                        {lead.contactEmail && (
                                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>{lead.contactEmail}</div>
                                        )}
                                        {lead.contactPhone && (
                                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>{lead.contactPhone}</div>
                                        )}
                                        {!lead.contactName && !lead.contactEmail && !lead.contactPhone && (
                                            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Sin contacto directo</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "var(--space-4)" }}>
                                        <div style={{ color: "var(--color-text-secondary)" }}>{lead.city || "—"}</div>
                                    </td>
                                    <td style={{ padding: "var(--space-4)" }}>
                                        <div style={{ fontWeight: 500, fontSize: "var(--text-xs)", color: "var(--color-text-primary)", background: "var(--color-bg-input)", padding: "2px 6px", borderRadius: "4px", display: "inline-block", marginBottom: 4 }}>
                                            {lead.event.name}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    background: lead.stage === "PROSPECTO" ? "var(--color-accent-blue)" : lead.stage === "RESPONDIDO" ? "var(--color-success)" : "var(--color-gold-400)",
                                                }}
                                            ></span>
                                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>{lead.stage}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "var(--space-4)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(255, 255, 255, 0.05)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                                                {lead.source || "Manual"}
                                            </span>
                                            {lead.website && (
                                                <Link href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-gold-400)" }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                </Link>
                                            )}
                                            {lead.socialUrl && (
                                                <Link href={lead.socialUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent-blue)" }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: "var(--space-4)", textAlign: "right" }}>
                                        <form action={deleteLead.bind(null, lead.id)}>
                                            <button
                                                type="submit"
                                                title="Eliminar Lead"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "var(--color-text-muted)",
                                                    padding: 4,
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-rag-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}

                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-muted)" }}>
                                        <div>
                                            <svg style={{ margin: "0 auto var(--space-4)", color: "var(--color-gold-400)", opacity: 0.5 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Aún no hay Leads</h3>
                                            <p style={{ maxWidth: 400, margin: "0 auto", fontSize: "var(--text-sm)" }}>
                                                Los leads captados por OpenClaw y n8n aparecerán aquí automáticamente una vez se integren mediante los Webhooks de marketing.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
