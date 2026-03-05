# EventosPrime-AI — Contexto de Desarrollo

> **Este documento existe para que cualquier agente IA pueda entender rápidamente
> el estado del proyecto, las decisiones de arquitectura, y qué falta por hacer.**  
> **[REGLA ESTRICTA DE CONTINUIDAD]**: Este archivo `DEVELOPMENT_CONTEXT.md` DEBE ser actualizado de forma obligatoria cada vez que: (1) Se culmina una etapa de un plan, (2) Se termina por completo una tarea exitosa, o (3) En momentos considerados relevantes o puntos de quiebre (restablecimiento). Esto asegura que al abrir el proyecto desde otra cuenta de Google/IA, el contexto sea siempre el correcto y exacto.
> Última actualización: 4 de marzo, 2026

---

## 🎯 Qué es este proyecto

**EventosPrime-AI** es una plataforma interna de gestión de eventos para la empresa **Eventos Prime AI** (Ecuador). El primer evento piloto es **Prime Festival**, en ~3 meses.

### Lo que resuelve
1. Gestión operativa de eventos (pre-producción → en vivo → post)
2. Asignación y seguimiento de tareas con evidencia fotográfica
3. CRM de sponsors con pipeline kanban
4. Venta y check-in de tickets con QR
5. IA para crear tareas por voz y analizar sponsors

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (PWA)                         │
│        Next.js 15 + React 19 + Design System Gold        │
│            apps/dashboard (puerto 3001)                   │
├──────────────┬──────────────┬────────────────────────────┤
│  Supabase    │  Google Cloud │  n8n                       │
│  Auth        │  Vertex AI    │  n8n.eventosprimeai.com    │
│  PostgreSQL  │  Speech-to-Text│ Workflows automáticos     │
│  Storage     │  Vision API   │                            │
│  Realtime    │               │                            │
└──────────────┴──────────────┴────────────────────────────┘
│                    VPS HOSTINGER                           │
│              eventosprimeai.com                            │
└───────────────────────────────────────────────────────────┘
```

### Stack tecnológico
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js | 15.5.12 |
| UI | CSS variables (Design System custom) | - |
| Base de datos | PostgreSQL (Supabase) | 15+ |
| ORM | Prisma | 6.19.2 |
| Auth | Supabase Auth | JWT |
| Storage | Supabase Storage | - |
| IA | Google Cloud Vertex AI | - |
| Voz | Google Speech-to-Text | - |
| Automatización | n8n (self-hosted en VPS) | - |
| Monorepo | Turborepo | - |
| Vectorial | pgvector | 0.8.0 |
| CI/CD | GitHub Actions | - |

---

## 📁 Estructura del proyecto

```
EventosPrime-AI/
├── apps/
│   └── dashboard/              # App principal (Next.js 15)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx         # Dashboard CEO (datos reales)
│       │   │   ├── login/page.tsx   # Login real (Supabase Auth)
│       │   │   ├── eventos/page.tsx # CRUD eventos (datos reales)
│       │   │   ├── tareas/page.tsx  # Gestión de tareas (UI lista, falta conectar)
│       │   │   ├── sponsors/page.tsx# Pipeline kanban (UI lista, falta conectar)
│       │   │   ├── api/
│       │   │   │   ├── events/route.ts  # GET/POST eventos
│       │   │   │   └── tasks/route.ts   # GET/POST/PATCH tareas
│       │   │   ├── auth/
│       │   │   │   └── callback/route.ts # Auth callback
│       │   │   ├── globals.css      # Design System tokens + layouts
│       │   │   └── layout.tsx       # Sidebar navigation (español)
│       │   ├── middleware.ts        # Auth middleware (protege rutas)
│       │   └── lib/supabase/
│       │       ├── client.ts        # Browser Supabase client
│       │       └── server.ts        # SSR Supabase client
│       └── .env.local              # Variables de entorno (NO en git)
├── packages/
│   ├── db/
│   │   ├── prisma/schema.prisma    # 20+ modelos de DB
│   │   ├── src/index.ts            # Prisma singleton client
│   │   └── .env                    # DB connection (NO en git)
│   ├── types/                      # Tipos compartidos
│   └── ui/                         # Componentes reutilizables
├── credentials/
│   ├── CREDENCIALES.txt            # Referencia de todas las llaves
│   ├── CREDENCIALES_VAULT.zip      # Encriptado AES-256
│   └── gcp-service-account.json    # Google Cloud service account
├── .env.local                      # Variables root (NO en git)
├── .env.example                    # Template de variables
├── turbo.json                      # Config Turborepo
├── .github/workflows/ci.yml       # CI/CD pipeline
└── DEVELOPMENT_CONTEXT.md          # ← ESTE ARCHIVO
```

---

## 🗄️ Modelos de base de datos (Prisma)

El schema está en `packages/db/prisma/schema.prisma`. Tablas creadas:

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| User | `users` | Roles: DIRECTOR, ADMIN, COORDINADOR, STAFF, PROVEEDOR, SPONSOR |
| Event | `events` | Estados: BORRADOR → PLANIFICADO → PRE_PRODUCCION → EN_VIVO → CERRADO |
| Task | `tasks` | Prioridades: BAJA/MEDIA/ALTA/URGENTE, subtareas, SLA en horas |
| Evidence | `evidence` | Fotos/videos adjuntos a tareas |
| VoiceNote | `voice_notes` | Audio + transcripción + interpretación IA |
| Sponsor | `sponsors` | Empresas patrocinantes |
| SponsorDeal | `sponsor_deals` | Pipeline: PROSPECTO → CONTACTADO → REUNION → PROPUESTA → CERRADO |
| Supplier | `suppliers` | Proveedores de servicios |
| SupplierOrder | `supplier_orders` | Órdenes de trabajo |
| Ticket | `tickets` | Tickets QR con check-in |
| CheckIn | `checkins` | Registro de acceso |
| Payment | `payments` | DataFast / Transferencia / Efectivo |
| Checklist | `checklists` | Plantillas de checklist |
| ChecklistItem | `checklist_items` | Items individuales |
| GpsLog | `gps_logs` | Tracking GPS del staff |
| Incident | `incidents` | Incidencias durante evento |
| Notification | `notifications` | Push / Telegram / Email |
| AuditLog | `audit_logs` | Auditoría completa |
| FinancialAccount | `financial_accounts` | Cuentas bancarias, caja, billeteras digitales |
| FinancialTransaction | `financial_transactions` | Ingresos/gastos con IVA, categoría, OCR |
| BudgetLine | `budget_lines` | Líneas presupuestarias por evento |
| BankStatement | `bank_statements` | Estados de cuenta bancarios |
| BankStatementEntry | `bank_statement_entries` | Líneas de estados de cuenta |
| DocumentTemplate | `document_templates` | Plantillas de documentos |
| GeneratedDocument | `generated_documents` | Documentos generados (contratos, OC) |
| AIChatMessage | `ai_chat_messages` | Historial de chat IA + auditoría permisos |

---

## 🔐 Conexiones y credenciales

Todas las credenciales están en `credentials/CREDENCIALES.txt` (archivo plano) y `credentials/CREDENCIALES_VAULT.zip` (encriptado AES-256 con contraseña del usuario).

### Variables de entorno requeridas (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://jnogbvdxsqjckvmyhioz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT anon key>
SUPABASE_SERVICE_ROLE_KEY=<JWT service role key>
DATABASE_URL=<pooler URL puerto 6543 con ?pgbouncer=true>
DIRECT_URL=<pooler URL puerto 5432>
GOOGLE_CLOUD_PROJECT=eventosprime-ai
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcp-service-account.json
```

⚠️ La región del pooler de Supabase es `aws-1-us-east-2` (NO us-east-1).

---

## ✅ Lo que ya funciona

1. **Auth completo**: Login/Register con Supabase Auth, middleware protege rutas, callback para email
2. **Dashboard CEO**: Muestra datos reales de PostgreSQL (eventos, tareas pending, sponsors)
3. **CRUD Eventos**: Crear eventos con formulario, se guardan en Supabase, se listan con contadores
4. **API Tasks**: GET (con filtros), POST (crear), PATCH (actualizar status) — con audit log
5. **Design System**: Dark premium + gold (#facc15), fuentes Inter/Outfit, glassmorphism
6. **Sidebar**: Dashboard, Eventos, Tareas, Checklists, Equipo, Sponsors, Proveedores, Tickets, Presupuesto, Pagos
7. **Git**: Repo en github.com/eventosprimeai/Eventos-Prime-AI, CI/CD con GitHub Actions
8. **Google Cloud**: Proyecto activo con $300 crédito, 3 APIs habilitadas
9. **pgvector**: Habilitado para búsqueda semántica

---

## 🔜 Lo que falta (ordenado por prioridad)

### Inmediato (Semana 1-2)
- [ ] **Tareas**: Conectar `tareas/page.tsx` a `/api/tasks` con datos reales
- [ ] **Sponsors**: Conectar `sponsors/page.tsx` a API con datos reales + drag-and-drop
- [ ] **Crear usuario Director**: Seed script o registro manual con ventas@eventosprimeai.com
- [ ] **Crear Prime Festival**: Seed del primer evento piloto

### Corto plazo (Semana 2-3)
- [ ] **Voz → Tarea**: Grabar audio → Speech-to-Text → Gemini interpreta → crear tarea automática
- [ ] **Notificaciones Telegram**: Bot que notifica tareas asignadas y vencimientos
- [ ] **PWA & Notificaciones Nativas**: Service worker + manifest para instalar como app en Android/iOS. Implementar Push Notifications y Badge en el ícono de la app con el conteo numerico real de Tareas Pendientes del usuario logueado.
- [ ] **Checklists**: CRUD de plantillas clonables
- [ ] **Equipo**: Gestión de miembros y asignación de roles

### Mediano plazo (Semana 3-6)
- [ ] **Sponsors IA**: Gemini analiza afinidad empresa-evento, score automático
- [ ] **Proveedores**: CRUD con órdenes y verificación de entregas
- [ ] **Tickets**: Generación QR, venta con DataFast, check-in en evento
- [ ] **Presupuesto**: Dashboard financiero con gastos vs presupuesto
- [ ] **GPS Staff**: Tracking en tiempo real durante evento

### Pre-evento (Semana 6-12)
- [ ] **WhatsApp**: Atención al cliente (personas preguntando por el evento)
- [ ] **n8n Workflows**: Automatizar emails, recordatorios, reportes
- [ ] **Incidentes**: Reportar y escalar problemas durante el evento en vivo
- [ ] **Post-producción**: Reportes finales, encuestas, métricas

---

## 🎨 Patrones de diseño (para mantener consistencia)

### CSS
- **No usar Tailwind** — todo con CSS variables definidas en `globals.css`
- Variables: `--color-gold-400` (principal), `--color-bg-primary` (#0a0a0f), etc.
- Fuentes: `--font-display` (Outfit) para títulos, `--font-sans` (Inter) para body
- Clases: `.glass-card`, `.text-gold`, `.stat-card`, `.event-card`, `.task-item`, `.animate-fade-in`

### React
- Todas las páginas son `"use client"` por ahora (interactividad)
- Data fetching con `fetch("/api/...")` desde el cliente
- API routes en `app/api/` usan Prisma directamente
- Cada API route verifica auth con `supabase.auth.getUser()` y crea audit log

### Español
- **Toda la UI está en español** — labels, botones, mensajes de error
- Los enums en Prisma también están en español (PENDIENTE, EN_PROGRESO, etc.)

### Seguridad
- `.env.local` y `credentials/` están en `.gitignore`
- Todos los API routes verifican sesión de usuario
- AuditLog registra cada CREATE/UPDATE con userId y cambios
- RLS habilitado en Supabase

---

## 🏃 Cómo levantar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# Editar con las credenciales reales

# 3. Copiar .env.local al dashboard
cp .env.local apps/dashboard/.env.local

# 4. Generar Prisma Client
cd packages/db && npx prisma generate && cd ../..

# 5. Levantar el dashboard
cd apps/dashboard && npx next dev --port 3001

# Dashboard disponible en http://localhost:3001
```

---

## 👤 Información del cliente

- **Empresa**: Eventos Prime AI (Ecuador)
- **Evento piloto**: Prime Festival (en ~3 meses)
- **Equipo**: 5-25 usuarios iniciales, hasta 50+ staff
- **Email corporativo**: ventas@eventosprimeai.com
- **VPS**: Hostinger (eventosprimeai.com)
- **OpenClaw OS**: openclawos.eventosprimeai.com (self-hosted)
- **n8n**: n8n.eventosprimeai.com (self-hosted)
- **Idioma**: Todo en español
- **Pagos**: DataFast (gateway de Ecuador)
- **Comunicación interna**: Telegram (priorizado sobre WhatsApp)
- **WhatsApp**: Solo para atención al cliente externo

---

## 🔄 Punto de Continuidad (Cross-Account & Backup)

**Ultimo Punto de Restablecimiento:** 5 de marzo de 2026 (02:22 local)
**Estatus Actual:**
- **Dashboard desplegado en producción:** `https://app.eventosprimeai.com` — Online con SSL, HTTP/2, PM2, y Nginx.
- **API REST pública:** `https://api.eventosprimeai.com` — Gateway para webhooks y servicios externos.
- **Desarrollo local activo en `localhost:3001`** — Se sigue desarrollando localmente.
- **Vertex AI conectado:** $300 créditos GCP activos, service account con permisos `aiplatform.user`.

**Logros Alcanzados (Sesión 5 de marzo 2026):**
  - **Módulo Financiero Completo (Fases 1-3):** 7 nuevos modelos Prisma + 6 enums. 5 API routes financieras. 8 páginas frontend (panel, transacciones, cuentas, presupuesto, conciliación, impuestos, documentos, reportes). Sidebar actualizado con sección Finanzas.
  - **OCR Gemini Vision (Vertex AI):** Acepta imágenes y PDFs. Extrae tipo, monto, IVA, fecha, categoría, referencia, proveedor. Pre-llena formularios. Compresión de imágenes en cliente.
  - **Ecosistema IA (7 Endpoints):** assistant, report-summary, analyze-image, generate-email, generate-document, smart-insights, finance/ocr. Todos vía Vertex AI con fallback a AI Studio.
  - **Asistente IA con Permisos:** Widget flotante 🤖 en toda la app. PERMISSION_MAP por rol (Director=todo, Finanzas=finanzas+proveedores, Marketing=eventos+tareas, Staff=solo sus tareas). Historial persistido. Auditoría de restricciones.
  - **Vertex AI Integrado:** JWT auth con service account, token caching, módulo compartido `src/lib/ai/vertex.ts`.
  - Logros previos: Identidad Modular, Seguridad/Auditoría, Soft-Delete, Onboarding IAs, Avatar Editor, VPS, Subdominios, Build fixes.

**Proceso de Despliegue (para futuras actualizaciones):**
```bash
# En local: push a GitHub
git push origin main

# En el servidor (ssh root@168.231.74.200):
cd /opt/eventos-prime-ai
git pull origin main
npm run build -w apps/dashboard
pm2 restart eventos-prime-dashboard
```

**Siguiente Acción Pendiente:**
1. Probar scanner OCR con facturas reales (Vertex AI sin rate limits).
2. Registrar cuentas bancarias corporativas en `/finanzas/cuentas`.
3. Implementar Conciliación Bancaria (Fase 3): OCR estados de cuenta + match.
4. Implementar Generación de Documentos (Fase 4): Contratos y propuestas con IA.
5. Desarrollar PWA con Service Workers para notificaciones push.
6. Configurar n8n workflows para automatización de reportes financieros.

