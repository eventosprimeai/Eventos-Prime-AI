# 🏗️ Eventos Prime Platform — EventOS

> Sistema integral de gestión de eventos para **Eventos Prime AI**

## Stack

- **Next.js 16** + React 19 + TypeScript
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Prisma** ORM
- **Turborepo** monorepo
- **n8n** automations

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start development
npm run dev
```

## Structure

```
eventos-prime-platform/
├── apps/
│   ├── dashboard/     # Panel CEO + Admin
│   ├── web/           # Landing pública
│   ├── portal/        # Portal Sponsors
│   └── pwa/           # App Staff (PWA)
├── packages/
│   ├── ui/            # Design System
│   ├── db/            # Prisma + modelos
│   ├── types/         # Tipos compartidos
│   └── auth/          # Autenticación
└── workflows/         # n8n exports
```

## Environment

Copy `.env.example` to `.env.local` and fill in your credentials.

## License

Private — Eventos Prime AI © 2026
