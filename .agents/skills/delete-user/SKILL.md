---
description: Elimina un usuario por correo electrónico de forma segura de Supabase y Prisma sin afectar a otros miembros
---

# Eliminar un Usuario Específico

A veces es necesario restablecer o eliminar la cuenta de un usuario específico (por ejemplo, después de una prueba fallida o un registro incorrecto) para permitirle volver a registrarse. Esta skill automatiza el proceso de eliminación segura en ambas bases de datos.

## Comandos y Utilidades Integradas

Hemos creado un script en \`scripts/delete-user.ts\` que recibe como argumento el correo electrónico de la cuenta que se desea purgar. Este script borra a la persona tanto de manera profunda en Supabase Auth y de la base de datos de Prisma, **sin** limpiar o truncar toda la tabla (a diferencia del script destructivo wipe-users).

### Instrucciones de uso para el Agente AI:

Para eliminar a un usuario de la plataforma:
1. Pide al usuario el correo exacto del empleado/usuario que desea eliminar.
2. Ejecuta el script de eliminación pasándole el correo como argumento.

\`\`\`bash
# Ejecutar localmente con ts-node
npx ts-node scripts/delete-user.ts [CORREO_DEL_USUARIO]
\`\`\`

3. Si la base de datos de producción está en Supabase en la nube y el comando anterior está apuntando a ella a través de \`.env.local\`, el cambio se reflejará instantáneamente en producción.

**ADVERTENCIA**: Este comando no tiene vuelta atrás, el usuario perderá su sesión, configuración de perfil y cualquier entrada referenciada a su ID si se tiene habilitado borrado en cascada. Procede con seguridad.
