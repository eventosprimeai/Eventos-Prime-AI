"use client";

import { usePathname } from "next/navigation";

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

    // Login page: full-screen, no sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Dashboard pages: sidebar + main content
    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span className="text-gold">Prime</span> Dashboard
                </div>

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

                {/* User section at bottom */}
                <div style={{ marginTop: "auto", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                    <div className="sidebar-link">
                        <span>👤</span>
                        <span>Director</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
