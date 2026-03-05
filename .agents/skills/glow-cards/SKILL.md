---
name: glow-cards
description: Apply modern Resend-like glow state cards
---
# Glow Cards Styling Pattern

## Objetivo
Cuando el usuario solicite aplicar la apariencia "glow" o "tarjetita con brillo" a un nuevo componente o tarjeta, sigue esta guía para aplicar los patrones CSS consistentes que ya se crearon en `globals.css`.

## Guía de Implementación

Para aplicar este efecto a cualquier contenedor, sigue estos 2 pasos obligatorios:

### 1. Asignar la Clase Base y su Variante
Añade la clase `stat-card` al elemento contenedor **más** una de las variantes de estado dependiendo de su contexto o valor:

*   `.stat-card--success`: Úsalo para métricas mayores a `0` que representen resultados positivos (ej. Tareas Completadas, Ingresos). Color: Verde.
*   `.stat-card--warning`: Úsalo para métricas mayores a `0` que requieran atención, representen un flujo negativo o acciones pendientes (ej. Tareas Pendientes, Gastos). Color: Rojo/Ámbar.
*   `.stat-card--info`: Úsalo para métricas mayores a `0` representando cosas actualmente en progreso. Color: Púrpura/Azul.
*   `.stat-card--prime`: Úsalo para métricas mayores a `0` relacionadas con entidades activas o elementos principales/core (ej. Eventos Activos, Cuentas Bancarias). Color: Dorado Brand (`var(--color-gold-400)`).
*   `.stat-card--neutral`: Úsalo **siempre** que la métrica sea exactamente `0`, o para tarjetas desactivadas/sin datos. Color: Gris.

**Ejemplo React/TSX:**
```tsx
<div className={`stat-card ${count > 0 ? 'stat-card--success' : 'stat-card--neutral'}`}>
  {/* contenido */}
</div>
```

### 2. Inyectar el Elemento Glow Interior
El resplandor ambiental se renderiza mediante un elemento vacío que **DEBE** añadirse siempre como el primer hijo dentro de `.stat-card`:

```tsx
<div className="stat-card stat-card--success">
  <div className="stat-card-glow"></div>  {/* OBLIGATORIO: PRIMER HIJO */}
  <div className="stat-label">Título</div>
  <div className="stat-value">{count}</div>
</div>
```

**¡Eso es todo!** El archivo `globals.css` maneja de forma automática las sombras, colores, bordes semi-transparentes de vidrio, transformaciones y la línea LED superior. Nunca inyectes colores o sombras en línea (estilos inline) en este tipo de tarjetas.
