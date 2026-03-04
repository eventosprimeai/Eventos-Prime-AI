"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
    status: "PENDIENTE" | "EN_PROGRESO" | "REVISION" | "COMPLETADA";
    dueDate: string | null;
    createdAt: string;
    evidenceRequired: boolean;
    assignee: { id: string; name: string; avatarUrl: string | null; role: string } | null;
    event: { id: string; name: string };
    _count: { evidence: number; voiceNotes: number; subtasks: number; messages?: number };
}

const statusConfig: Record<string, { label: string; color: string }> = {
    PENDIENTE: { label: "No Leído", color: "var(--color-bg-elevated)" }, // We use task.status conceptually differently here maybe, but let's keep it safe
    EN_PROGRESO: { label: "En progreso", color: "var(--color-info)" },
    REVISION: { label: "En revisión", color: "var(--color-gold-400)" },
    COMPLETADA: { label: "Resuelto", color: "var(--color-success)" },
};

export default function ConsultasPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Voice Dictation States
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserId(user.id);

            const res = await fetch(`/api/tasks?isConsulta=true&global=true`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch { } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const loadMessages = async (taskId: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}/messages`);
            if (res.ok) setMessages(await res.json());
        } catch { }
    };

    const openTaskChat = async (task: Task) => {
        setSelectedTask(task);
        setMessages([]);
        loadMessages(task.id);

        if (task._count?.messages && task._count.messages > 0) {
            try {
                await fetch(`/api/tasks/${task.id}/read`, { method: "POST" });
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, _count: { ...t._count, messages: 0 } } : t));
            } catch { }
        }
    };

    // Continuous Dictation logic
    const toggleRecording = () => {
        if (isRecording) {
            if (recognitionRef.current) {
                const rec = recognitionRef.current;
                recognitionRef.current = null; // Mark as manually stopped
                rec.stop();
            }
            setIsRecording(false);
            return;
        }

        const windowAny = window as any;
        const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        // interimResults lets us see text immediately
        recognition.interimResults = true;

        const startingText = newMessage ? newMessage + " " : "";

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onend = () => {
            // If it stopped naturally (due to silence) but we didn't want to!
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.error("Restart error", e);
                }
            } else {
                setIsRecording(false);
            }
        };

        recognition.onerror = (e: any) => {
            if (e.error === 'not-allowed' || e.error === 'not-supported') {
                recognitionRef.current = null;
                setIsRecording(false);
                alert("Error de micrófono: " + e.error);
            }
        };

        recognition.onresult = (evt: any) => {
            let finalSegment = "";
            let interimSegment = "";

            for (let i = evt.resultIndex; i < evt.results.length; ++i) {
                if (evt.results[i].isFinal) {
                    finalSegment += evt.results[i][0].transcript;
                } else {
                    interimSegment += evt.results[i][0].transcript;
                }
            }

            if (finalSegment || interimSegment) {
                setNewMessage(startingText + finalSegment + interimSegment);
            }
        };

        recognition.start();
    };

    const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
        if (e) e.preventDefault();
        const textToSend = overrideText || newMessage.trim();
        if (!selectedTask || !textToSend) return;
        setSendingMsg(true);
        try {
            const res = await fetch(`/api/tasks/${selectedTask.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textToSend })
            });
            if (res.ok) {
                setNewMessage("");
                loadMessages(selectedTask.id);
            }
        } catch { } finally {
            setSendingMsg(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800 }}>Historial de Consultas IA</h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
                        Revisa el histórico de tus preguntas, solicitudes e investigaciones asistidas por Harold.
                    </p>
                </div>
            </div>

            {/* Content list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {tasks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)", background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--color-border)" }}>
                        <span style={{ fontSize: "2rem", opacity: 0.5 }}>🤖</span>
                        <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>No tienes consultas registradas aún.</p>
                        <p style={{ fontSize: "var(--text-xs)", opacity: 0.5 }}>Utiliza el botón de Consulta arriba a la derecha para interactuar con Harold.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {tasks.map(task => {
                            const dateStr = new Date(task.createdAt).toLocaleString("es-EC", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            });
                            const status = statusConfig[task.status] || { label: task.status, color: "gray" };

                            return (
                                <div key={task.id} className="task-item glass-card" onClick={() => openTaskChat(task)}>
                                    <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
                                        {/* Avatar Representing the User who made the Query */}
                                        <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: "50%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "1.2rem", fontWeight: "bold" }}>
                                            {task.assignee?.avatarUrl ? (
                                                <img src={task.assignee.avatarUrl} alt={task.assignee.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            ) : (
                                                <span>{task.assignee?.name?.charAt(0) || "U"}</span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
                                                <div>
                                                    <span style={{ fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--color-gold-400)", display: "block" }}>
                                                        {task.assignee?.name || "Usuario Desconocido"} - <span style={{ fontWeight: 400, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{task.assignee?.role || "Cargo Desconocido"}</span>
                                                    </span>
                                                    <span style={{ fontWeight: 600, fontSize: "var(--text-md)", color: "var(--color-text-primary)", display: "block", marginTop: "2px" }}>
                                                        {task.title.replace("[CONSULTA]", "").trim() || "Consulta IA"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                                <span>📅 {dateStr}</span>
                                                <span>🎪 {task.event.name}</span>
                                                <span style={{ position: "relative" }}>
                                                    💬 Abrir Conversación
                                                    {task._count?.messages ? (
                                                        <span style={{
                                                            background: "var(--color-rag-red)", color: "white", fontSize: "0.6rem", fontWeight: "bold", borderRadius: "50%",
                                                            width: 14, height: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "absolute", top: -8, right: -12
                                                        }}>
                                                            {task._count.messages}
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* AI Chat Modal */}
            {selectedTask && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 9999, animation: "fadeIn 0.2s ease" }}>
                    <div style={{ width: "100%", maxWidth: 750, background: "var(--color-bg-primary)", height: "100vh", display: "flex", flexDirection: "column", borderLeft: "1px solid var(--color-border)", boxShadow: "-4px 0 24px rgba(0,0,0,0.5)" }}>
                        {/* Modal Header */}
                        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-elevated)", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid var(--color-gold-400)", fontSize: "1.2rem", fontWeight: "bold" }}>
                                    {selectedTask.assignee?.avatarUrl && selectedTask.assignee.avatarUrl.trim() !== "" ? (
                                        <img src={selectedTask.assignee.avatarUrl} alt={selectedTask.assignee.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        <span style={{ color: "var(--color-gold-400)" }}>{selectedTask.assignee?.name?.charAt(0) || "U"}</span>
                                    )}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, margin: 0, color: "var(--color-gold-400)" }}>
                                        {selectedTask.assignee?.name || "Usuario Desconocido"} <span style={{ fontWeight: 400, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>- {selectedTask.assignee?.role || "Cargo Desconocido"}</span>
                                    </h2>
                                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)", fontWeight: 600, display: "block", marginTop: "2px" }}>
                                        {selectedTask.title.replace("[CONSULTA]", "").trim() || "Consulta IA"}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTask(null)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-xl)", cursor: "pointer" }}>✕</button>
                        </div>

                        {/* Description (Original Query) */}
                        {selectedTask.description && (
                            <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-card)", position: "relative" }}>
                                <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--color-gold-400)", marginBottom: "var(--space-2)" }}>Tu Consulta Inicial</div>
                                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{selectedTask.description}</p>
                            </div>
                        )}

                        {/* Chat Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                            {messages.length === 0 ? (
                                <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-8)" }}>
                                    Construyendo hilo deductivo con Harold...
                                </p>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.author.id === currentUserId;
                                    const isHarold = msg.author.name === "Harold";
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                                            <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)", flexDirection: isMe ? "row-reverse" : "row" }}>
                                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isHarold ? "var(--color-gold-400)" : "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold", overflow: "hidden", flexShrink: 0 }}>
                                                    {isHarold ? <img src="/harold_avatar.png" alt="Harold" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : (msg.author.avatarUrl ? <img src={msg.author.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : msg.author.name.charAt(0))}
                                                </div>
                                                <div style={{ background: isMe ? "var(--color-bg-elevated)" : (isHarold ? "rgba(250,204,21,0.05)" : "var(--color-bg-card)"), border: isMe ? "1px solid var(--color-border)" : (isHarold ? "1px solid rgba(250,204,21,0.3)" : "1px solid var(--color-border)"), padding: "var(--space-3)", borderRadius: "var(--radius-lg)", borderBottomRightRadius: isMe ? 0 : "var(--radius-lg)", borderBottomLeftRadius: !isMe ? 0 : "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", lineHeight: 1.5 }}>
                                                    {isHarold && <div style={{ fontSize: "0.65rem", color: "var(--color-gold-400)", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>Asistente IA</div>}
                                                    {msg.text}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", marginTop: "4px", textAlign: isMe ? "right" : "left", padding: "0 36px" }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input with Microphone */}
                        <div style={{ padding: "var(--space-4)", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-elevated)" }}>
                            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end" }}>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Habla o escribe aquí..."
                                    rows={1}
                                    style={{
                                        flex: 1, padding: "var(--space-3)", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", fontFamily: "var(--font-sans)", resize: "none", minHeight: "24px", maxHeight: "120px"
                                    }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                />
                                <button type="button" onClick={toggleRecording} style={{ padding: "var(--space-3)", background: isRecording ? "var(--color-rag-red)" : "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", borderRadius: "50%", cursor: "pointer", transition: "var(--transition-fast)", display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44 }}>
                                    <span style={{ filter: isRecording ? "brightness(0) invert(1)" : "none", fontSize: "1.2rem" }}>🎤</span>
                                </button>
                                <button type="submit" disabled={sendingMsg || !newMessage.trim()} style={{ padding: "0 var(--space-4)", background: "var(--color-gold-400)", color: "#000", border: "none", borderRadius: "100px", fontSize: "var(--text-sm)", fontWeight: 700, cursor: (sendingMsg || !newMessage.trim()) ? "not-allowed" : "pointer", opacity: (sendingMsg || !newMessage.trim()) ? 0.6 : 1, transition: "var(--transition-fast)", height: 44 }}>
                                    Enviar
                                </button>
                            </form>
                            {isRecording && (
                                <div style={{ color: "var(--color-rag-red)", fontSize: "var(--text-xs)", marginTop: "4px", textAlign: "center", fontWeight: 600, animation: "pulse 1.5s infinite" }}>
                                    Escuchando activamente... (click en el micro para detener)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
