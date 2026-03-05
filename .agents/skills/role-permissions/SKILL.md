---
description: Administra y verifica los permisos, reglas de vista y restricciones de los módulos y respuestas de IA según el rol del usuario actual.
---

# Gestión Global de Roles y Permisos (Role-Permissions)

Esta skill es el núcleo conceptual para que el agente entienda **cómo** restringir y organizar la interfaz web y las respuestas de la IA (Harold) basado en el rol de quien navega o pregunta.

Los Roles principales en la base de datos (Prisma `Role` enum) son:
- \`ADMIN\` (Director, Socios): Tienen acceso a TODAS las vistas (Finanzas completas, Configuración de empresa, Auditar).
- \`COORDINADOR\` / \`STAFF\` (Personal de planta, Staff Administrativo, Logístico): Tienen restricciones por omisión. Solo ven Tareas, Eventos Operativos, y su propio perfil o chat. No ven finanzas globales.
- \`SPONSOR\`: Entran a su propio portal, ven sus métricas o retorno de inversión.
- \`PROVEEDOR\`: Ven contratos, tareas que les atañen, pagos pendientes.
- \`INVITADO\`: Sólo ven la landing page o comprar tickets.

## 1. Reglas para Frontend (UI)
Cuando el usuario (Director) te indique que "ocultes" cierta sección o botón para un tipo de rol (por ejemplo, "que el Staff Administrativo no vea los Totales de Caja en Finanzas"), debes:
1. Buscar el archivo donde se renderiza ese componente / menú (ej. \`layout-shell.tsx\` o \`finanzas/page.tsx\`).
2. Envolver el elemento en una verificación del rol proviniendo de la sesión del usuario o de Supabase \`user_metadata.role\`.
   - Ejemplo: \`{user.role === 'ADMIN' && <BotonFinanzas />}\`

## 2. Reglas para la Inteligencia Artificial (Harold)
Harold responde utilizando prompts de sistema definidos (por ejemplo \`app/api/chat/route.ts\`). Cuando el Director restrinja conocimiento de Harold hacia un tipo de perfil:
1. Modifica el prompt de inserción de Harold.
2. Intercepta quién está realizando la solicitud (usuario Supabase Auth o Prisma).
3. Inyecta reglas dinámicas en el system prompt de Harold, como: *"El usuario actual es un PROVEEDOR, bajo NINGÚN concepto le ofrezcas, reveles o calcules montos totales de ingreso del evento. Responde amablemente que esa información es de nivel ejecutivo."*

## Pasos para aplicar una nueva regla de seguridad dictada por el usuario:
1. Escribe o memoriza la regla enviada por el Director.
2. Identifica en qué componente (Sidebar, Finanzas, Botones de borrado) repercute.
3. Identifica en qué API Route repercute (Harold, Endpoints).
4. Aplica las cláusulas con el tipo \`Role\` extraído del session o context.
5. Avisa al Director detalladamente de los "Escudos de Nivel de Acceso" levantados.
