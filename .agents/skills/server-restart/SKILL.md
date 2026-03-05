---
name: server-restart
description: Cuando el usuario solicite reiniciar el servidor de desarrollo local de Next.js.
---

# Server Restart Skill

### Cuándo usar esta skill
- Cuando el usuario indique que se debe reiniciar el servidor.
- Cuando se hagan cambios manuales en un archivo de configuración como `.env`, `.env.local` o `next.config.js`, y el servidor necesite ser reiniciado para tomarlos.
- Cuando el usuario se confunda sobre cómo reiniciar el servidor manualmente en su terminal local.

### Pasos a seguir
1. **Identificar y matar el proceso en el puerto 3001:** Ejecutar en la terminal un comando de PowerShell para forzar el cierre del proceso que está ocupando el puerto de desarrollo local (el 3001). Esto detendrá el servidor antiguo que ya lleva tiempo corriendo:
   ```powershell
   Get-Process -Name node | Stop-Process -Force -ErrorAction SilentlyContinue
   ```
   *(También se puede utilizar la variante más específica: `$port = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue; if ($port) { Stop-Process -Id $port.OwningProcess -Force }`)*

2. **Iniciar nuevamente el servidor de desarrollo:**
   Ejecutar el comando para levantar nuevamente el proyecto de Next.js en el directorio correcto:
   ```powershell
   cd apps/dashboard
   npm run dev
   ```
   
3. **Notificación al usuario:** Confirmar verbalmente que el servidor interno ha sido apagado y encendido adecuadamente por nuestra cuenta. No pedirle al usuario que interactúe físicamente con la terminal de VS Code para reinicios estandarizados.
