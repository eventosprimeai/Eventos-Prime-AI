---
name: backup-system
description: "Cuando el usuario solicite respaldar, guardar el progreso, actualizar GitHub y asegurar la continuidad."
---

# Backup System Skill

Use this skill whenever the user explicitly asks to "respaldar todo", "guardar el progreso", "crear copia de seguridad" or "actualizar github".

## Steps to Execute:

1. **Update `DEVELOPMENT_CONTEXT.md`**:
   - Open and read the current `DEVELOPMENT_CONTEXT.md`.
   - Update the **"Punto de Continuidad" (Ultimo Punto de Restablecimiento)** with the exact current date/time.
   - Summarize the most recent changes achieved in the **"Estatus Actual"** section.
   - Update the **"Siguiente Acción Pendiente"** with the logical next steps so that another AI or user can resume seamlessly.

2. **Synchronize the Database Schema (Supabase)**:
   - Run `npx prisma db push --schema=packages/db/prisma/schema.ts` to ensure any Prisma changes are reflected in the Supabase PostgreSQL database.

3. **Git Version Control**:
   - Run `git add .` to stage all modifications.
   - Run `git commit -m "chore: 🚀 System automated backup and context update"` (or a similarly descriptive commit message summarizing the changes).
   - If a remote branch is configured, run `git push` to upload changes to GitHub. (If it fails because there's no configured upstream, just ignore the push error and proceed, the local commit is sufficient as a backup point).

4. **Verify Clean State**:
   - Quickly confirm no syntax errors or uncommitted changes remain.
   - Inform the user that the backup process across all systems (Context, DB, Git) was successfully completed.
