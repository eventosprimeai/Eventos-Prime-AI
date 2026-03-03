# Antigravity Preflight Protocol

Este es el sistema centralizado de pensamiento (brain/ruleset) para definir dinámicamente cómo estructurar la ejecución de las tareas que el usuario pida a Antigravity. Como ingeniero director de la IA, Antigravity DEBE ejecutar forzosamente este protocolo antes de lanzar cualquier comando que modifique código, borre o diseñe gran parte del sistema, sin importar si el usuario usó la regla del "fast" o "planing".

## ⚖️ Motor de Evaluación Dinámica

Para cada *prompt* principal o *issue* solicitado, procesa los siguientes criterios de complejidad internamente:

**Nivel 1: Complexity: LOW (Action: FAST MAPPING)**
- **Disparadores**: Ajustes de CSS/Tailwind, fixes de linting de TypeScript, cambios de estatus pasivos de botones, copys, refactors estéticos de diseño (UI/UX), contadores estadísticos en base a consultas establecidas.
- **Protocolo**: Modo *"Act fast, think brief"*.
  - Entender qué se necesita.
  - Ejecutar el código.
  - Testear pasivamente el error general.
  - Entregar el resultado sin pedir permiso y reportando "Tarea completada."

**Nivel 2: Complexity: MEDIUM (Action: HYBRID MAPPING)**
- **Disparadores**: Nuevas páginas (`page.tsx`) simples, conexiones sencillas de API `GET`/`POST`, refactors con dependencias internas de hasta 3-5 niveles, configuraciones locales `.env` + `prisma-layer`.
- **Protocolo**: Modo *"Think modular, Act fast"*.
  - Leer dependencias.
  - Presentar una nota breve de lo que se va a editar.
  - Ejecutar cambios en paralelo (escribir modelo + componente cliente + ruta api).
  - Validar. (No detenerse por permiso a menos que el sistema sugiera romper).

**Nivel 3: Complexity: HIGH (Action: PLANNING MAPPING)**
- **Disparadores**: Levantamiento de sistemas modulares complejos, nuevos flujos masivos de bases de datos (`schema.prisma` mayor), infraestructura core, flujos de tokens IA avanzados, rediseños integrales.
- **Protocolo**: *"Pause, Think Deep, Wait for Greenlight"*.
  1. *Stop execution*: Redactar un artefacto `[task-name]_architecture_plan.md` listando exactamente todo lo que va a pasar, librerías, riesgos y modelos de db.
  2. Imprimir confirmación: *"Esta es una tarea estructural. He mapeado el plan aquí. Por favor aprueba para iniciar la ráfaga de código."*
  3. Ejecutar sólo cuando el director dé la orden.

## Regla Estricta: Silencio Estructural (El Sistema Invisible)
No debes responder al usuario indicando el "Motor/Modo" de cada tarea en lenguaje natural o en el prompt, simplemente evalúa contra este documento de lógica y actúa. 
El "Punto de Continuidad" siempre quedará vivo al cierre de las sesiones independientemente del modo de complejidad en el que se trabajó.
