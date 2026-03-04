"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

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
            { label: "Presupuesto", href: "/presupuesto", icon: "💰" },
            { label: "Pagos", href: "/pagos", icon: "💳" },
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
    const [userAvatar, setUserAvatar] = useState("");
    const [pendingTasksCount, setPendingTasksCount] = useState(0);

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
                            }
                        })
                        .catch(() => { });

                    // Fetch personal pending tasks count
                    fetch(`/api/tasks?status=PENDIENTE&assigneeId=${user.id}`)
                        .then(res => res.json())
                        .then(tasks => {
                            if (Array.isArray(tasks)) {
                                setPendingTasksCount(tasks.length);
                            }
                        })
                        .catch(() => { });

                    // Optional: We can set up an interval to refresh this, but for now doing it on mount/page load is okay.
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
                <div style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)", background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-gold-400)", display: "flex", alignItems: "center", gap: "var(--space-3)", position: "relative" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {userAvatar ? (
                            <img src={userAvatar} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-gold-400)" }}>
                                {userName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div style={{ overflow: "hidden", flex: 1 }}>
                        <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {userName}
                        </h3>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {userRole}
                        </p>
                    </div>

                    {/* Notification Bell */}
                    {pendingTasksCount > 0 && (
                        <a href="/tareas/estado/pendientes" style={{ position: "relative", cursor: "pointer", marginLeft: "auto", textDecoration: "none" }}>
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
        </div>
    );
}
