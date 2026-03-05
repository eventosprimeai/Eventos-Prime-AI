"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import AIAssistantWidget from "@/components/AIAssistantWidget";

// Sidebar navigation config
const navItems = [
    {
        section: "Principal", items: [
            { label: "Dashboard", href: "/", icon: "📊" },
            { label: "Eventos", href: "/eventos", icon: "🎪" },
        ]
    },
    {
        section: "Operaciones", items: [
            { label: "Tareas", href: "/tareas", icon: "✅" },
            { label: "Consultas", href: "/consultas", icon: "🤖" },
            { label: "Checklists", href: "/checklists", icon: "📋" },
            { label: "Equipo", href: "/equipo", icon: "👥" },
        ]
    },
    {
        section: "Comercial", items: [
            { label: "Sponsors", href: "/sponsors", icon: "🏢" },
            { label: "Proveedores", href: "/proveedores", icon: "🔧" },
            { label: "Tickets", href: "/tickets", icon: "🎫" },
        ]
    },
    {
        section: "Finanzas", items: [
            { label: "Panel Financiero", href: "/finanzas", icon: "💰" },
            { label: "Transacciones", href: "/finanzas/transacciones", icon: "📒" },
            { label: "Cuentas", href: "/finanzas/cuentas", icon: "🏦" },
            { label: "Presupuesto", href: "/finanzas/presupuesto", icon: "📊" },
            { label: "Conciliación", href: "/finanzas/conciliacion", icon: "🔄" },
            { label: "Impuestos", href: "/finanzas/impuestos", icon: "🧾" },
            { label: "Documentos", href: "/finanzas/documentos", icon: "📄" },
            { label: "Reportes", href: "/finanzas/reportes", icon: "📈" },
        ]
    },
    {
        section: "Sistema", items: [
            { label: "Auditoría", href: "/auditoria", icon: "📜" },
            { label: "Configuración", href: "/config", icon: "⚙️" },
        ]
    },
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    // User state
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [userCategory, setUserCategory] = useState("");
    const [userPersonType, setUserPersonType] = useState("");
    const [userSystemRole, setUserSystemRole] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [showSubprofileModal, setShowSubprofileModal] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!isLoginPage) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "Usuario");
                    setUserRole(user.user_metadata?.jobTitle || user.user_metadata?.role || "Personal Externo");
                    setUserAvatar("");

                    // Sync user with DB and grab avatar from DB Profile
                    fetch("/api/auth/sync", { method: "POST" })
                        .then(res => res.json())
                        .then(data => {
                            if (data.dbUser) {
                                if (data.dbUser.avatarUrl) {
                                    setUserAvatar(data.dbUser.avatarUrl);
                                }
                                if (data.dbUser.name) {
                                    setUserName(data.dbUser.name);
                                }
                                if (data.dbUser.personType) {
                                    setUserPersonType(data.dbUser.personType);
                                }
                                if (data.dbUser.category) {
                                    setUserCategory(data.dbUser.category);
                                }
                                if (data.dbUser.jobTitle) {
                                    setUserRole(data.dbUser.jobTitle);
                                }
                                if (data.dbUser.role) {
                                    setUserSystemRole(data.dbUser.role);
                                }
                            }
                        })
                        .catch(() => { });

                    // Fetch aggregated unread messages + pending tasks count
                    fetch(`/api/notifications/sidebar`)
                        .then(res => res.json())
                        .then(data => {
                            if (typeof data.count === 'number') {
                                setPendingTasksCount(data.count);
                            }
                        })
                        .catch(() => { });

                    // We can set up an interval to refresh this, doing it every 15 seconds to simulate real-time notification
                    const interval = setInterval(() => {
                        fetch(`/api/notifications/sidebar`)
                            .then(res => res.json())
                            .then(data => {
                                if (typeof data.count === 'number') {
                                    setPendingTasksCount(data.count);
                                }
                            }).catch(() => { });
                    }, 15000);
                    return () => clearInterval(interval);
                } else {
                    window.location.href = "/login";
                }
            });
        }
    }, [isLoginPage, pathname]); // Added pathname so it refreshes count on navigation

    // Login page: full-screen, no sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Dashboard pages: sidebar + main content
    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>

                {/* User Profile Card */}
                <div style={{ marginBottom: "var(--space-6)", padding: "26px var(--space-4)", background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-gold-400)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)", position: "relative", textAlign: "center" }}>
                    {/* Notification Bell (Top Right Corner) */}
                    {pendingTasksCount > 0 && (
                        <a href="/tareas/estado/pendientes" style={{ position: "absolute", top: 12, right: 12, cursor: "pointer", textDecoration: "none" }}>
                            <span style={{ fontSize: "1.2rem", filter: "grayscale(0.2)" }}>🔔</span>
                            <div style={{
                                position: "absolute",
                                top: -6,
                                right: -4,
                                background: "var(--color-rag-red)",
                                color: "white",
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                borderRadius: "50%",
                                width: 16,
                                height: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid var(--color-bg-card)",
                                lineHeight: 1
                            }}>
                                {pendingTasksCount}
                            </div>
                        </a>
                    )}

                    {/* Avatar (Clickable to Dashboard) */}
                    <a href="/" style={{ textDecoration: "none" }}>
                        <div style={{ width: 78, height: 78, borderRadius: "50%", background: "var(--color-bg-elevated)", border: "2px solid var(--color-gold-400)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, margin: "0 auto", cursor: "pointer", transition: "transform 0.2s" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            {userAvatar ? (
                                <img src={userAvatar} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-gold-400)" }}>
                                    {userName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </a>

                    {/* Info */}
                    <div style={{ overflow: "hidden", width: "100%" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>
                            {userName}
                        </h3>
                        {(userPersonType || userCategory) && (
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-gold-400)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase", marginBottom: 2 }}>
                                {userPersonType} {userCategory && userCategory !== userPersonType ? `• ${userCategory}` : ""}
                            </p>
                        )}
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {userRole}
                        </p>

                        {/* Sub Profile Button */}
                        {userSystemRole !== "DIRECTOR" && userPersonType !== "Socio" && (
                            <button
                                onClick={() => setShowSubprofileModal(true)}
                                style={{
                                    marginTop: "var(--space-3)", padding: "var(--space-1) var(--space-3)",
                                    background: "var(--color-bg-input)", color: "var(--color-gold-400)",
                                    border: "1px dashed var(--color-gold-400)", borderRadius: "var(--radius-lg)",
                                    fontSize: "10px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                + SOLICITAR SUB-PERFIL
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {navItems.map((section) => (
                        <div key={section.section}>
                            <div className="sidebar-section">{section.section}</div>
                            {section.items.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link${pathname === item.href ? " active" : ""}`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </a>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Brand Footnote */}
                <div style={{ marginTop: "auto", paddingTop: "var(--space-4)", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", opacity: 0.5 }}>
                    <span className="text-gold" style={{ fontWeight: 800 }}>Eventos</span>Prime AI
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Sub Profile Modal */}
            {showSubprofileModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "var(--space-4)" }}>
                    <div className="glass-card" style={{ padding: "var(--space-8)", width: "100%", maxWidth: 450, border: "2px solid var(--color-gold-400)", animation: "fadeIn 0.2s", textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "var(--space-4)" }}>🤝</div>
                        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-2xl)", color: "var(--color-gold-400)", marginBottom: "var(--space-2)" }}>Solicitud de Sub-Perfil</h3>
                        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6, marginBottom: "var(--space-6)" }}>
                            Para crear un sub-perfil supervisado bajo su jerarquía (ideal para personal externo o agencias compartidas), por favor contacte al Director General: <br /><br />
                            <strong style={{ color: "var(--color-text-primary)", fontSize: "var(--text-lg)" }}>Gabriel J. Lorca</strong><br />
                            <span style={{ color: "var(--color-gold-400)", fontSize: "var(--text-md)", fontWeight: 700 }}>+593 99 999 9999</span> (WhatsApp / Telegram)
                        </p>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginBottom: "var(--space-6)" }}>
                            Indique los datos de su personal (Nombre, Correo de la persona a delegar). Nosotros procesaremos y conectaremos este sub-perfil internamente lo antes posible.
                        </p>
                        <button
                            onClick={() => setShowSubprofileModal(false)}
                            style={{ padding: "var(--space-3)", width: "100%", background: "var(--color-bg-input)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", fontWeight: 700, cursor: "pointer" }}
                        >
                            Entendido, cerrar
                        </button>
                    </div>
                </div>
            )}
            <AIAssistantWidget />
        </div>
    );
}
