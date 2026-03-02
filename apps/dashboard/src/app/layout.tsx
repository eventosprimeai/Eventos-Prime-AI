import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "./layout-shell";

export const metadata: Metadata = {
    title: "EventosPrime AI — Panel de Control",
    description: "Dashboard CEO para gestión integral de eventos",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>
                <LayoutShell>{children}</LayoutShell>
            </body>
        </html>
    );
}
