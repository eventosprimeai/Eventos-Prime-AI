---
description: How to resume work from another Google account, preserving the exact context.
---
# Flujo de Continuidad (Cross-Account & Respaldos)

Este flujo se utiliza siempre que el usuario abra el proyecto bajo otra cuenta de Google o solicite retomar el trabajo exactamente donde se quedó.

1. Al abrir la sesión, lee de inmediato `DEVELOPMENT_CONTEXT.md`, enfocándote en la última sección llamada **"🔄 Punto de Continuidad (Cross-Account & Backup)"**.
2. Identifica el **"Estatus Actual"** y la **"Siguiente Acción Pendiente"**.
3. Revisa brevemente los archivos enumerados en "Archivos Modificados Recientemente" (usando las herramientas de lectura) para empaparte del estado exacto del código.
4. Escribe un mensaje al usuario para confirmarle: "He recuperado el contexto. El último punto de restablecimiento fue [FECHA]. El siguiente paso de nuestra hoja de ruta es [ACCIÓN]. ¿Procedemos con eso?"

## Actualización Obligatoria (Regla de Mantenimiento de Contexto)
- Cada vez que culmines una **etapa del plan**, al terminar de forma **exitosa una tarea completa**, o siempre que el usuario pida un **punto de restablecimiento**, debes editar obligatoriamente `DEVELOPMENT_CONTEXT.md` actualizando la sección *Punto de Continuidad*.
- Si se considera necesario crear una copia dura adicional en disco local, utiliza `robocopy /MIR` o un clon en zip del repositorio fuera del directorio principal (evitando las carpetas pesadas como `node_modules` y `.git` o `.next`). También deberás hacer un commit de Git bajo el tag de 'punto de restablecimiento'.
