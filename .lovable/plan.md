

## Diagnóstico

El item **Dashboard** (Resumen Financiero, línea 178 en Layout.tsx) actualmente **no tiene submenús** — es un link plano a `/dashboard`.

El Dashboard tiene dos vistas principales con secciones ricas:

**Vista Resumen:**
- 📅 Timeline del Año (gráfico + detalle mensual)
- 🌐 Ecosistema
- ⚡ Workflows + Pagos
- 🔔 Alertas Inteligentes
- 🎮 Gamificación

**Vista Control (Centro de Control):**
- Ya tiene acceso via las áreas de enfoque (negocio, familia, etc.)

## Plan

### Agregar submenús al item "Dashboard" en Layout.tsx

Agregar `children` al item de Dashboard (línea 178) con links a las secciones principales de la vista Resumen:

```
children: [
  { label: '📅 Timeline Anual', path: '/dashboard#timeline' },
  { label: '🌐 Ecosistema', path: '/dashboard#ecosystem' },
  { label: '⚡ Workflows', path: '/dashboard#workflows' },
  { label: '🔔 Alertas', path: '/dashboard#alerts' },
  { label: '🎮 Aventura', path: '/dashboard#gamification' },
]
```

Con versiones en inglés correspondientes.

### Agregar anchors en Dashboard.tsx

Los `data-section` ya existen en el Dashboard (`data-section="timeline"`, `data-section="ecosystem"`, etc.) pero necesitan `id` explícitos para que los hash links funcionen con scroll. Agregar `id` a cada `<div>` wrapper de sección que ya tiene `data-section`.

### Archivos a modificar
1. **`src/components/Layout.tsx`** — agregar `children` al item Dashboard
2. **`src/pages/Dashboard.tsx`** — agregar `id` a los divs de sección existentes

