---
name: prisma-restart
description: Cuando el usuario solicite reiniciar el servidor de Next.js y regenerar Prisma Client en Windows debido a un error de EPERM o error interno de Prisma.
---

# Prisma Restart & Sync Skill

### Cuándo usar esta skill
- Cuando Prisma o TypeScript arroje errores relacionados a "Unknown field ... for include statement on model" o "Invalid prisma invocation".
- Cuando el servidor local esté devolviendo errores `500` tras un cambio en el esquema `.prisma`.
- Cuando se intente correr `npx prisma generate` y falle con un error de operación no permitida (`EPERM`) sobre el archivo `query_engine-windows.dll.node` porque Windows tiene el archivo bloqueado por el servidor de Next.js en ejecución.

### Pasos a seguir
1. **Identificar puerto:** Determinar en qué puerto se está ejecutando la aplicación (generalmente el 3001).
2. **Matar el proceso:** Ejecutar en terminal un comando de PowerShell para forzar el cierre del proceso de Node.js que mantiene trabado a Prisma en ese puerto:
   ```powershell
   Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue
   ```
3. **Regenerar Cliente de Prisma:**
   Ejecutar `npx prisma generate` en el directorio de Prisma:
   ```powershell
   cd packages/db && npx prisma generate
   ```
4. **Reiniciar Servidor:**
   Volver a raíz y ejecutar en segundo plano el comando de servidor de Next.js para restaurar el acceso:
   ```powershell
   npm run dev -w apps/dashboard -- --port 3001
   ```
5. **Notificar al usuario:** Confirmar que el motor interno de Prisma fue regenerado con el último esquema y el servidor está operativo de nuevo en el puerto 3001.
