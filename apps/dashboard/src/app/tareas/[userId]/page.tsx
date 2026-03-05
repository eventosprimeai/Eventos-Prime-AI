"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Event {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  status: "PENDIENTE" | "EN_PROGRESO" | "REVISION" | "COMPLETADA" | "CANCELADA";
  dueDate: string | null;
  evidenceRequired: boolean;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  creatorId: string;
  event: { id: string; name: string };
  _count: {
    evidence: number;
    voiceNotes: number;
    subtasks: number;
    messages?: number;
  };
}

const priorityConfig = {
  URGENTE: { label: "Urgente", color: "var(--color-rag-red)" },
  ALTA: { label: "Alta", color: "var(--color-warning)" },
  MEDIA: { label: "Media", color: "var(--color-gold-400)" },
  BAJA: { label: "Baja", color: "var(--color-success)" },
};

const statusConfig = {
  PENDIENTE: { label: "Pendiente", color: "var(--color-text-muted)" },
  EN_PROGRESO: { label: "En progreso", color: "var(--color-info)" },
  REVISION: { label: "Revisión", color: "var(--color-gold-400)" },
  COMPLETADA: { label: "Completada", color: "var(--color-success)" },
  CANCELADA: { label: "Cancelada", color: "var(--color-error)" },
};

export default function UserTareasPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIA",
    eventId: "",
    dueDate: "",
    evidenceRequired: true,
    slaHours: "",
  });

  // Chat Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [previewingPhoto, setPreviewingPhoto] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [isRecordingForm, setIsRecordingForm] = useState(false);
  const recognitionFormRef = useRef<any>(null);
  const [isRecordingChat, setIsRecordingChat] = useState(false);
  const recognitionChatRef = useRef<any>(null);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadMessages = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch {}
  };

  const openTaskChat = async (task: Task) => {
    setSelectedTask(task);
    setMessages([]);
    loadMessages(task.id);

    if (task._count?.messages && task._count.messages > 0) {
      try {
        // Mark messages as read
        await fetch(`/api/tasks/${task.id}/read`, { method: "POST" });
        // We update local state tasks to reflect the read state instantly
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, _count: { ...t._count, messages: 0 } }
              : t,
          ),
        );
      } catch {}
    }
  };

  const handleSendMessage = async (
    e?: React.FormEvent,
    overrideText?: string,
  ) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || newMessage.trim();
    if (!selectedTask || !textToSend) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });

      const data = await res.json();

      if (res.ok) {
        if (!overrideText) setNewMessage("");
        loadMessages(selectedTask.id);
        // Dynamically update view based on chat interaction (backend computes the exact state)
        if (data.newStatus) {
          setSelectedTask((prev) =>
            prev ? { ...prev, status: data.newStatus } : null,
          );
          setTasks((prev) =>
            prev.map((t) =>
              t.id === selectedTask.id ? { ...t, status: data.newStatus } : t,
            ),
          );
        } else if (data.taskCompleted) {
          setSelectedTask((prev) =>
            prev ? { ...prev, status: "COMPLETADA" } : null,
          );
          setTasks((prev) =>
            prev.map((t) =>
              t.id === selectedTask.id ? { ...t, status: "COMPLETADA" } : t,
            ),
          );
        }
      } else {
        alert(
          `Error al enviar mensaje: ${data.error || "Falla del sistema local"}`,
        );
      }
    } catch (error: any) {
      alert(`Excepción de red: ${error.message}`);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCompleteTaskClick = () => {
    if (!selectedTask) return;
    if (selectedTask.evidenceRequired) {
      startCamera();
    } else {
      handleSendMessage(undefined, "Felicidades tarea completada");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (e) {
      alert("No se pudo acceder a la cámara.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const MAX_SIZE = 1000;
    let width = videoRef.current.videoWidth;
    let height = videoRef.current.videoHeight;

    if (width > height) {
      if (width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, width, height);

    // Use moderate webp compression to ensure the base64 string doesn't break API size limits
    const compressedImage = canvas.toDataURL("image/webp", 0.6);
    setCapturedPhoto(compressedImage);

    // Stop video tracks but keep the camera overlay open to show preview
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const approvePhotoAndSend = () => {
    if (!capturedPhoto) return;
    const imageToSend = capturedPhoto;
    setShowCamera(false);
    setCapturedPhoto(null);
    handleSendMessage(
      undefined,
      `![Evidencia Fotográfica](${imageToSend})\n\nFelicidades tarea completada`,
    );
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const renderMessageText = (text: string) => {
    const imgRegex = /!\[.*?\]\((data:image\/.*?;base64,.*?)\)/;
    const match = text.match(imgRegex);
    // Parse basic markdown styles (* text *, _ text _, and \n)
    const formatText = (content: string) => {
      const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_|\n)/g);
      return parts.map((part, index) => {
        if (part === "\n") return <br key={index} />;
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("__") && part.endsWith("__"))
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <strong key={index}>{part.slice(1, -1)}</strong>; // Assuming typical LLM *bold* logic for headers
        if (part.startsWith("_") && part.endsWith("_"))
          return <em key={index}>{part.slice(1, -1)}</em>;
        return part;
      });
    };

    if (match) {
      const cleanText = text.replace(imgRegex, "").trim();
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{ position: "relative", cursor: "zoom-in" }}
            onClick={() => setPreviewingPhoto(match[1])}
          >
            <img
              src={match[1]}
              alt="Evidencia"
              style={{
                width: "100%",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "rgba(0,0,0,0.6)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                pointerEvents: "none",
              }}
            >
              🔍 Ampliar
            </div>
          </div>
          {cleanText && <span>{formatText(cleanText)}</span>}
        </div>
      );
    }
    return <span>{formatText(text)}</span>;
  };

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStatus) queryParams.append("status", filterStatus);
      if (userId) queryParams.append("assigneeId", userId);
      queryParams.append("_ts", Date.now().toString()); // Cache buster

      const [tasksRes, eventsRes, authRes] = await Promise.all([
        fetch(`/api/tasks?${queryParams.toString()}`),
        fetch("/api/events"),
        fetch("/api/auth/sync", { method: "POST" }),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (authRes.ok) {
        const data = await authRes.json();
        setCurrentUserRole(data.dbUser?.role || "");
        setCurrentUserId(data.dbUser?.id || "");
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventId) return;
    setSaving(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slaHours: form.slaHours ? parseInt(form.slaHours) : null,
          assigneeId: userId,
        }),
      });
      if (res.ok) {
        setForm({
          title: "",
          description: "",
          priority: "MEDIA",
          eventId: "",
          dueDate: "",
          evidenceRequired: true,
          slaHours: "",
        });
        setShowForm(false);
        fetchData();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const inputStyle = {
    width: "100%",
    padding: "var(--space-2) var(--space-3)",
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-sans)",
  };

  return (
    <>
      <div className="animate-fade-in">
        {/* Header */}
        <button
          onClick={() => router.push("/tareas")}
          style={{
            background: "transparent",
            color: "var(--color-gold-400)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            padding: 0,
            marginBottom: "var(--space-4)",
          }}
        >
          ← Volver al equipo
        </button>
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
                fontSize: "var(--text-3xl)",
                fontWeight: 800,
              }}
            >
              {tasks.length > 0 && tasks[0].assignee
                ? `Tareas de ${tasks[0].assignee.name}`
                : "Tareas del Responsable"}
            </h1>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                marginTop: "var(--space-1)",
              }}
            >
              {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            {/* Filters */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                ...inputStyle,
                width: "auto",
                cursor: "pointer",
              }}
            >
              <option value="">Todas</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="REVISION">Revisión</option>
              <option value="COMPLETADA">Completadas</option>
            </select>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: "var(--space-2) var(--space-5)",
                background: showForm
                  ? "var(--color-bg-card)"
                  : "var(--gradient-gold)",
                color: showForm
                  ? "var(--color-text-secondary)"
                  : "var(--color-bg-primary)",
                border: showForm ? "1px solid var(--color-border)" : "none",
                borderRadius: "var(--radius-lg)",
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {showForm ? "Cancelar" : "+ Nueva Tarea"}
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="glass-card"
            style={{
              padding: "var(--space-6)",
              marginBottom: "var(--space-6)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                marginBottom: "var(--space-4)",
              }}
            >
              Nueva Tarea
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Título *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Montar escenario principal"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Descripción
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    alignItems: "flex-start",
                  }}
                >
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Detalles de la tarea..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecordingForm) {
                        if (recognitionFormRef.current) {
                          const rec = recognitionFormRef.current;
                          recognitionFormRef.current = null;
                          rec.stop();
                        }
                        setIsRecordingForm(false);
                        return;
                      }
                      const windowAny = window as any;
                      const SpeechRecognition =
                        windowAny.SpeechRecognition ||
                        windowAny.webkitSpeechRecognition;
                      if (!SpeechRecognition) {
                        alert(
                          "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.",
                        );
                        return;
                      }
                      const recognition = new SpeechRecognition();
                      recognitionFormRef.current = recognition;
                      recognition.lang = "es-ES";
                      recognition.continuous = true;
                      recognition.interimResults = true;
                      const startingText = form.description
                        ? form.description + " "
                        : "";
                      recognition.onstart = () => setIsRecordingForm(true);
                      recognition.onend = () => {
                        if (recognitionFormRef.current) {
                          try {
                            recognitionFormRef.current.start();
                          } catch (e) {}
                        } else {
                          setIsRecordingForm(false);
                        }
                      };
                      recognition.onerror = (e: any) => {
                        if (
                          e.error === "not-allowed" ||
                          e.error === "not-supported"
                        ) {
                          recognitionFormRef.current = null;
                          setIsRecordingForm(false);
                          alert("Error de micrófono: " + e.error);
                        }
                      };
                      recognition.onresult = (evt: any) => {
                        let finalSegment = "";
                        let interimSegment = "";
                        for (let i = 0; i < evt.results.length; ++i) {
                          if (evt.results[i].isFinal) {
                            finalSegment += evt.results[i][0].transcript;
                          } else {
                            interimSegment += evt.results[i][0].transcript;
                          }
                        }
                        setForm((prev) => ({
                          ...prev,
                          description:
                            startingText + finalSegment + interimSegment,
                        }));
                      };
                      recognition.start();
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: isRecordingForm
                        ? "rgba(255, 60, 60, 0.2)"
                        : "var(--color-bg-elevated)",
                      border: `1px solid ${isRecordingForm ? "red" : "var(--color-border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      fontSize: "1.2rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🎤
                  </button>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Evento *
                </label>
                <select
                  required
                  value={form.eventId}
                  onChange={(e) =>
                    setForm({ ...form, eventId: e.target.value })
                  }
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Seleccionar evento...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
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
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Prioridad
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  SLA (horas)
                </label>
                <input
                  type="number"
                  value={form.slaHours}
                  onChange={(e) =>
                    setForm({ ...form, slaHours: e.target.value })
                  }
                  placeholder="24"
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <input
                  type="checkbox"
                  id="evidence"
                  checked={form.evidenceRequired}
                  onChange={(e) =>
                    setForm({ ...form, evidenceRequired: e.target.checked })
                  }
                />
                <label
                  htmlFor="evidence"
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  📸 Requiere evidencia fotográfica
                </label>
              </div>
            </div>
            <div
              style={{
                marginTop: "var(--space-4)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-3)",
              }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "var(--space-2) var(--space-4)",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "var(--space-2) var(--space-5)",
                  background: "var(--gradient-gold)",
                  color: "var(--color-bg-primary)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Guardando..." : "Crear Tarea"}
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid var(--color-border)",
                borderTop: "3px solid var(--color-gold-400)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-16)",
              background: "var(--color-bg-card)",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <p
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "var(--space-3)",
              }}
            >
              <span
                className="nav-dot"
                style={{ width: 16, height: 16 }}
              ></span>
            </p>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-lg)",
              }}
            >
              {filterStatus
                ? "No hay tareas con ese filtro"
                : "No hay tareas creadas aún"}
            </p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                marginTop: "var(--space-2)",
              }}
            >
              {!filterStatus &&
                "Primero crea un evento, luego podrás asignar tareas"}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const priority = priorityConfig[task.priority];
              const status = statusConfig[task.status];
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== "COMPLETADA";
              const ragClass = isOverdue
                ? "overdue"
                : task.status === "PENDIENTE" && task.dueDate
                  ? "due-soon"
                  : "on-track";

              return (
                <div
                  key={task.id}
                  className={`task-item ${ragClass} relative`}
                  onClick={() => openTaskChat(task)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    gap: "var(--space-4)",
                    alignItems: "center",
                  }}
                >
                  {/* Status Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        currentUserRole !== "DIRECTOR" &&
                        currentUserId !== task.assignee?.id
                      ) {
                        alert(
                          "No tienes permiso para cambiar el estado de esta tarea.",
                        );
                        return;
                      }
                      const next: Record<string, string> = {
                        PENDIENTE: "EN_PROGRESO",
                        EN_PROGRESO: "REVISION",
                        REVISION: "COMPLETADA",
                        COMPLETADA: "PENDIENTE",
                      };
                      updateStatus(task.id, next[task.status] || "PENDIENTE");
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${status.color}`,
                      background:
                        task.status === "COMPLETADA"
                          ? "var(--color-success)"
                          : "transparent",
                      cursor:
                        currentUserRole === "DIRECTOR" ||
                        currentUserId === task.assignee?.id
                          ? "pointer"
                          : "not-allowed",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--text-xs)",
                      color: "#fff",
                      zIndex: 2,
                    }}
                  >
                    {task.status === "COMPLETADA" && "✓"}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          textDecoration:
                            task.status === "COMPLETADA"
                              ? "line-through"
                              : "none",
                          color:
                            task.status === "COMPLETADA"
                              ? "var(--color-text-muted)"
                              : "var(--color-text-primary)",
                        }}
                      >
                        {task.title}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-3)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-1)",
                        }}
                      >
                        <span
                          className="nav-dot"
                          style={{ display: "inline-block" }}
                        ></span>{" "}
                        {task.event.name}
                      </span>
                      {task.dueDate && (
                        <span
                          style={{
                            color: isOverdue
                              ? "var(--color-rag-red)"
                              : "var(--color-text-muted)",
                          }}
                        >
                          {new Date(task.dueDate).toLocaleDateString("es-EC", {
                            day: "numeric",
                            month: "short",
                          })}
                          {isOverdue && " — Vencida"}
                        </span>
                      )}
                      {task.evidenceRequired && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                          }}
                        >
                          📸 Evidencia
                        </span>
                      )}
                      <span
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-1)",
                        }}
                      >
                        <span
                          className="nav-dot"
                          style={{ display: "inline-block" }}
                        ></span>{" "}
                        Chat
                        {task._count?.messages ? (
                          <span
                            style={{
                              background: "var(--color-rag-red)",
                              color: "white",
                              fontSize: "0.6rem",
                              fontWeight: "bold",
                              borderRadius: "50%",
                              width: 14,
                              height: 14,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "absolute",
                              top: -8,
                              right: -12,
                            }}
                          >
                            {task._count.messages}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      padding: "var(--space-1) var(--space-2)",
                      borderRadius: "var(--radius-full)",
                      background: `${status.color}20`,
                      color: status.color,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Detail & Chat Modal */}
      {selectedTask && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 750,
              background: "var(--color-bg-primary)",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--color-border)",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.5)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-bg-elevated)",
                flexShrink: 0,
              }}
            >
              <div style={{ maxWidth: "80%" }}>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: priorityConfig[selectedTask.priority].color,
                  }}
                >
                  {priorityConfig[selectedTask.priority].label}
                </span>
                <h2
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    margin: "var(--space-1) 0",
                  }}
                >
                  {selectedTask.title}
                </h2>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "2px 8px",
                    background: `${statusConfig[selectedTask.status].color}20`,
                    color: statusConfig[selectedTask.status].color,
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  {statusConfig[selectedTask.status].label}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                {(currentUserRole === "DIRECTOR" ||
                  selectedTask.creatorId === currentUserId) && (
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          "¿Estás súper seguro de que quieres eliminar esta tarea permanentemente y todo su historial de mensajes? Esta acción no se puede deshacer.",
                        )
                      ) {
                        try {
                          const res = await fetch(
                            `/api/tasks/${selectedTask.id}`,
                            { method: "DELETE" },
                          );
                          if (res.ok) {
                            setSelectedTask(null);
                            fetchData();
                          } else {
                            const data = await res.json();
                            alert(data.error || "Error al eliminar");
                          }
                        } catch (e) {
                          alert("Fallo de conexión al eliminar.");
                        }
                      }
                    }}
                    style={{
                      background: "rgba(255,50,50,0.1)",
                      border: "1px solid rgba(255,50,50,0.3)",
                      color: "var(--color-error)",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "var(--transition-fast)",
                    }}
                    title="Eliminar Tarea"
                  >
                    🗑️
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-xl)",
                    cursor: "pointer",
                    marginLeft: "var(--space-2)",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <details
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-bg-card)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  flexShrink: 0,
                }}
              >
                <summary
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    outline: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <span
                    className="nav-dot"
                    style={{ display: "inline-block" }}
                  ></span>{" "}
                  Mostrar descripción de la tarea
                </summary>
                <div
                  style={{
                    padding: "0 var(--space-4) var(--space-4)",
                    whiteSpace: "pre-wrap",
                    opacity: 0.9,
                  }}
                >
                  {selectedTask.description}
                </div>
              </details>
            )}

            {/* Chat Messages */}
            <div
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                padding: "var(--space-4)",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    marginTop: "auto",
                    marginBottom: "auto",
                  }}
                >
                  No hay mensajes. ¡Envía "felicidades tarea completada" para
                  cerrarla!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.author.id === userId; // Note: In this view userId is the assignee. In a real app we'd verify with session user.
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        gap: "var(--space-2)",
                        flexDirection: isMe ? "row-reverse" : "row",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--color-bg-elevated)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {msg.author.avatarUrl ? (
                          <img
                            src={msg.author.avatarUrl}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 10 }}>
                            {msg.author.name[0]}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          maxWidth: "75%",
                          background: isMe
                            ? "var(--color-bg-elevated)"
                            : "var(--color-bg-input)",
                          padding: "var(--space-3) var(--space-4)",
                          borderRadius: "var(--radius-lg)",
                          border: isMe
                            ? "1px solid var(--color-gold-400)"
                            : "1px solid var(--color-border)",
                          borderTopRightRadius: isMe ? 0 : "var(--radius-lg)",
                          borderTopLeftRadius: !isMe ? 0 : "var(--radius-lg)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                            marginBottom: 6,
                            fontWeight: 600,
                          }}
                        >
                          {msg.author.name}{" "}
                          {msg.author.role === "STAFF" ? "🤖 (IA)" : ""}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-primary)",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.5,
                          }}
                        >
                          {renderMessageText(msg.text)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div
              style={{
                padding: "var(--space-4)",
                borderTop: "1px solid var(--color-border)",
                background: "var(--color-bg-card)",
                flexShrink: 0,
              }}
            >
              {showCamera ? (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 10000,
                    background: "#000",
                  }}
                >
                  {capturedPhoto ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                        <img
                          src={capturedPhoto}
                          alt="Review"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            background: "#000",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "var(--space-4)",
                          paddingBottom:
                            "calc(var(--space-4) + env(safe-area-inset-bottom, 16px))",
                          display: "flex",
                          justifyContent: "space-between",
                          background: "#111",
                          borderTop: "1px solid #333",
                        }}
                      >
                        <button
                          onClick={retakePhoto}
                          style={{
                            background: "transparent",
                            color: "#fff",
                            border: "1px solid #555",
                            padding: "12px 24px",
                            borderRadius: "24px",
                            cursor: "pointer",
                          }}
                        >
                          ↻ Volver a tomar
                        </button>
                        <button
                          onClick={approvePhotoAndSend}
                          style={{
                            background: "var(--color-success)",
                            color: "#fff",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "24px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 0 15px rgba(0,255,100,0.3)",
                          }}
                        >
                          Usar y Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "var(--space-4)",
                          paddingBottom:
                            "calc(var(--space-4) + env(safe-area-inset-bottom, 16px))",
                          display: "flex",
                          justifyContent: "space-between",
                          background: "#111",
                        }}
                      >
                        <button
                          onClick={stopCamera}
                          style={{
                            background: "transparent",
                            color: "#fff",
                            border: "1px solid #333",
                            padding: "12px 24px",
                            borderRadius: "24px",
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={capturePhoto}
                          style={{
                            background: "white",
                            color: "#000",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "24px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-2)",
                          }}
                        >
                          📷 Tomar Foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Lightbox out of flow */}
              {previewingPhoto ? (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 11000,
                    background: "rgba(0,0,0,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--space-4)",
                  }}
                  onClick={() => setPreviewingPhoto(null)}
                >
                  <button
                    style={{
                      position: "absolute",
                      top: "var(--space-4)",
                      right: "var(--space-4)",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "2rem",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                  <img
                    src={previewingPhoto}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "90vh",
                      borderRadius: "var(--radius-lg)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                    alt="Evidencia Ampliada"
                  />
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                {(currentUserRole === "DIRECTOR" ||
                  currentUserId === selectedTask.assignee?.id) && (
                  <>
                    {selectedTask.status !== "COMPLETADA" &&
                      selectedTask.status !== "REVISION" && (
                        <button
                          onClick={() => {
                            handleSendMessage(
                              undefined,
                              "Perfecto, estoy revisando. Más tarde te doy novedades.",
                            );
                          }}
                          disabled={sendingMsg}
                          style={{
                            background: "var(--color-bg-elevated)",
                            color: "var(--color-info)",
                            border: `1px solid var(--color-border)`,
                            padding: "4px 12px",
                            borderRadius: "16px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          En Revisión
                        </button>
                      )}
                    <button
                      onClick={handleCompleteTaskClick}
                      disabled={
                        sendingMsg || selectedTask.status === "COMPLETADA"
                      }
                      style={{
                        background:
                          selectedTask.status === "COMPLETADA"
                            ? "var(--color-bg-elevated)"
                            : "var(--color-success)20",
                        color:
                          selectedTask.status === "COMPLETADA"
                            ? "var(--color-text-muted)"
                            : "var(--color-success)",
                        border: `1px solid ${selectedTask.status === "COMPLETADA" ? "var(--color-border)" : "var(--color-success)"}`,
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {selectedTask.status === "COMPLETADA"
                        ? "Tarea Completada"
                        : selectedTask.evidenceRequired
                          ? "Completar con evidencia 📸"
                          : "Completar Tarea"}
                    </button>
                  </>
                )}
              </div>
              <form
                onSubmit={(e) => handleSendMessage(e)}
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isRecordingChat) {
                      if (recognitionChatRef.current) {
                        const rec = recognitionChatRef.current;
                        recognitionChatRef.current = null;
                        rec.stop();
                      }
                      setIsRecordingChat(false);
                      return;
                    }
                    const windowAny = window as any;
                    const SpeechRecognition =
                      windowAny.SpeechRecognition ||
                      windowAny.webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                      alert(
                        "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.",
                      );
                      return;
                    }
                    const recognition = new SpeechRecognition();
                    recognitionChatRef.current = recognition;
                    recognition.lang = "es-ES";
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    const startingMsg = newMessage ? newMessage + " " : "";
                    recognition.onstart = () => setIsRecordingChat(true);
                    recognition.onend = () => {
                      if (recognitionChatRef.current) {
                        try {
                          recognitionChatRef.current.start();
                        } catch (e) {}
                      } else {
                        setIsRecordingChat(false);
                      }
                    };
                    recognition.onerror = (e: any) => {
                      if (
                        e.error === "not-allowed" ||
                        e.error === "not-supported"
                      ) {
                        recognitionChatRef.current = null;
                        setIsRecordingChat(false);
                        alert("Error de micrófono: " + e.error);
                      }
                    };
                    recognition.onresult = (evt: any) => {
                      let finalSegment = "";
                      let interimSegment = "";
                      for (let i = 0; i < evt.results.length; ++i) {
                        if (evt.results[i].isFinal) {
                          finalSegment += evt.results[i][0].transcript;
                        } else {
                          interimSegment += evt.results[i][0].transcript;
                        }
                      }
                      setNewMessage(
                        startingMsg + finalSegment + interimSegment,
                      );
                    };
                    recognition.start();
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: isRecordingChat
                      ? "rgba(255, 60, 60, 0.2)"
                      : "var(--color-bg-elevated)",
                    border: `1px solid ${isRecordingChat ? "red" : "var(--color-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontSize: "1.2rem",
                    color: "var(--color-text-primary)",
                    transition: "all 0.2s ease",
                  }}
                >
                  🎤
                </button>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim() && !sendingMsg) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                  placeholder="Escribe o dicta por voz un mensaje... (Presiona Enter para enviar, Shift+Enter para nueva línea)"
                  style={{
                    ...inputStyle,
                    flex: 1,
                    padding: "var(--space-3)",
                    resize: "none",
                    height: "auto",
                    minHeight: "44px",
                    maxHeight: "150px",
                  }}
                  disabled={sendingMsg}
                  rows={
                    newMessage.split("\n").length > 1
                      ? Math.min(5, newMessage.split("\n").length)
                      : 1
                  }
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !newMessage.trim()}
                  style={{
                    padding: "0 var(--space-4)",
                    height: 44,
                    background: "var(--gradient-gold)",
                    color: "#000",
                    border: "none",
                    borderRadius: "var(--radius-lg)",
                    fontWeight: 700,
                    cursor: sendingMsg ? "wait" : "pointer",
                    opacity: !newMessage.trim() || sendingMsg ? 0.5 : 1,
                  }}
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
