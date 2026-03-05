---
name: deploy-production
description: "Cuando el usuario solicite desplegar, actualizar producción, subir cambios al servidor, o hacer deploy de la app EventosPrime AI."
---

# Deploy to Production Skill

Use this skill whenever the user asks to "deploy", "desplegar", "subir a producción", "actualizar el servidor", or "push to production".

## Server Details

- **VPS Provider**: Hostinger (Ubuntu 24.04)
- **IP**: 168.231.74.200
- **SSH User**: root
- **SSH Key**: `C:\Users\hp\.ssh\eventosprimeai_vps` (key-based auth, NO password needed)
- **App Path on Server**: `/opt/eventos-prime-ai`
- **Process Manager**: PM2
- **PM2 Process Name**: `eventos-prime-dashboard`
- **Production URL**: https://app.eventosprimeai.com
- **Nginx**: Configured with SSL (Let's Encrypt), HTTP/2, gzip

## Steps to Execute

### 1. Ensure local changes are committed and pushed
```bash
git add .
git commit -m "chore: deploy updates to production"
git push origin main
```

### 2. Connect to VPS and deploy
Run this single SSH command to execute the full deployment:
// turbo
```bash
ssh -i C:\Users\hp\.ssh\eventosprimeai_vps root@168.231.74.200 "cd /opt/eventos-prime-ai && git pull origin main && npm install && npx prisma generate --schema=packages/db/prisma/schema.prisma && npm run build -w apps/dashboard && pm2 restart eventos-prime-dashboard && echo '✅ Deploy completado exitosamente'"
```

### 3. Verify deployment
// turbo
```bash
ssh -i C:\Users\hp\.ssh\eventosprimeai_vps root@168.231.74.200 "pm2 status eventos-prime-dashboard && curl -s -o /dev/null -w '%{http_code}' https://app.eventosprimeai.com"
```
- PM2 should show `online` status
- curl should return `200`

### 4. Inform the user
Tell the user:
- ✅ Production updated at https://app.eventosprimeai.com
- Show the PM2 status and HTTP response code

## Troubleshooting

### If `npm run build` fails:
- Check TypeScript errors: `ssh -i C:\Users\hp\.ssh\eventosprimeai_vps root@168.231.74.200 "cd /opt/eventos-prime-ai && npx tsc --noEmit -w apps/dashboard 2>&1 | tail -30"`
- Fix errors locally, commit, push, and retry

### If PM2 shows `errored`:
- Check logs: `ssh -i C:\Users\hp\.ssh\eventosprimeai_vps root@168.231.74.200 "pm2 logs eventos-prime-dashboard --lines 30"`

### If SSH fails:
- The correct SSH key is `C:\Users\hp\.ssh\eventosprimeai_vps`
- Do NOT use password auth (it's disabled for root)
- Do NOT use other keys (id_rsa_vps, hostinger_rsa, etc.) — only `eventosprimeai_vps` works

## Important Notes
- The credentials directory (`credentials/`) is in `.gitignore` and does NOT exist on the server. The server has its own `.env.local` with the same variables.
- The `gcp-service-account.json` must be present on the server at the correct path for Vertex AI to work.
- Always run `npx prisma generate` before build to ensure Prisma Client is up to date with schema changes.
