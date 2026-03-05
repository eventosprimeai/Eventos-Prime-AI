"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    wasRestricted?: boolean;
}

export default function AIAssistantWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load history when widget opens first time
    useEffect(() => {
        if (open && !historyLoaded) {
            fetch("/api/ai/assistant")
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setMessages(data.map((m: any) => ({
                            role: m.role, content: m.content,
                            timestamp: new Date(m.createdAt),
                            wasRestricted: m.wasRestricted,
                        })));
                    }
                    setHistoryLoaded(true);
                })
                .catch(() => setHistoryLoaded(true));
        }
    }, [open, historyLoaded]);

    async function sendMessage() {
        if (!input.trim() || loading) return;
        const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date() };
        setMessages(m => [...m, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.content }),
            });
            const data = await res.json();
            setMessages(m => [...m, {
                role: "assistant",
                content: data.response || data.error || "Error al obtener respuesta",
                timestamp: new Date(),
                wasRestricted: data.wasRestricted,
            }]);
        } catch {
            setMessages(m => [...m, { role: "assistant", content: "❌ Error de conexión", timestamp: new Date() }]);
        }
        setLoading(false);
    }

    const quickActions = [
        "📊 Resumen financiero del mes",
        "📋 Tareas pendientes urgentes",
        "🎪 Estado de los eventos activos",
        "💡 Recomendaciones para reducir gastos",
    ];

    return (
        <>
            {/* Floating Button */}
            <button onClick={() => setOpen(!open)} style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 1000,
                width: 56, height: 56, borderRadius: "50%", border: "none",
                background: "linear-gradient(135deg, #7c4dff, #536dfe)",
                color: "#fff", fontSize: 24, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(124,77,255,0.4)",
                transition: "all 0.3s ease",
                transform: open ? "rotate(45deg)" : "none",
            }}>
                {open ? "✕" : "🤖"}
            </button>

            {/* Chat Panel */}
            {open && (
                <div style={{
                    position: "fixed", bottom: 90, right: 24, zIndex: 999,
                    width: 400, height: 520, borderRadius: "var(--radius-xl)",
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    animation: "slideUp 0.3s ease",
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)",
                        background: "linear-gradient(135deg, rgba(124,77,255,0.1), rgba(83,109,254,0.05))",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <span style={{ fontSize: 20 }}>🤖</span>
                            <div>
                                <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                                    Asistente IA
                                </div>
                                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)" }}>
                                    Eventos Prime • Powered by Gemini
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflow: "auto", padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
                                <div style={{ fontSize: 40, marginBottom: "var(--space-3)" }}>🤖</div>
                                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                                    ¡Hola! Soy tu asistente IA. Puedo consultar datos de la empresa, generar análisis y ayudarte con la operación.
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                    {quickActions.map(action => (
                                        <button key={action} onClick={() => { setInput(action.replace(/^[^\s]+\s/, "")); }}
                                            style={{
                                                padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)",
                                                border: "1px solid var(--color-border)", background: "var(--color-bg-input)",
                                                color: "var(--color-text-secondary)", fontSize: "var(--text-xs)",
                                                cursor: "pointer", textAlign: "left",
                                            }}>
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                maxWidth: "85%",
                            }}>
                                <div style={{
                                    padding: "var(--space-2) var(--space-3)",
                                    borderRadius: msg.role === "user" ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)" : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
                                    background: msg.role === "user" ? "linear-gradient(135deg, #7c4dff, #536dfe)" : "var(--color-bg-input)",
                                    color: msg.role === "user" ? "#fff" : "var(--color-text-primary)",
                                    fontSize: "var(--text-sm)", lineHeight: 1.5,
                                    whiteSpace: "pre-wrap",
                                }}>
                                    {msg.content}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2, textAlign: msg.role === "user" ? "right" : "left", display: "flex", alignItems: "center", gap: 4, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                    {msg.timestamp.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                                    {msg.wasRestricted && <span style={{ color: "#ffa726", fontSize: 9 }}>🔒 Acceso restringido</span>}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: "flex-start", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-input)" }}>
                                <div style={{ display: "flex", gap: 4 }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)",
                                            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEnd} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: "var(--space-3)", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-2)" }}>
                        <input type="text" value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                            placeholder="Escribe tu pregunta..."
                            style={{
                                flex: 1, padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)",
                                background: "var(--color-bg-input)", border: "1px solid var(--color-border)",
                                color: "var(--color-text-primary)", fontSize: "var(--text-sm)", outline: "none",
                            }} />
                        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
                            padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "none",
                            background: "var(--color-accent)", color: "#000", fontWeight: 700,
                            cursor: loading ? "wait" : "pointer", opacity: !input.trim() ? 0.5 : 1,
                        }}>➤</button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
            `}</style>
        </>
    );
}
