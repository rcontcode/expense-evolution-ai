

## Problema

El sidebar actual tiene secciones planas — cada ítem es un enlace directo a una página. Pero hay ~15 herramientas que solo existen dentro del Centro de Control del Dashboard (FIRE Calculator, Gestor de Deudas, Análisis Familiar, etc.) y no tienen presencia en el sidebar. El usuario se pierde porque no sabe dónde encontrarlas.

## Propuesta: Submenús colapsables en el sidebar

Agregar ítems expandibles dentro de las secciones existentes del sidebar. Al hacer clic en el ítem padre se navega a la página principal; al expandir con el chevron se muestran sub-ítems que llevan directamente a herramientas específicas del Centro de Control.

```text
📈 ANÁLISIS
  ├─ Análisis         → /analytics
  ├─ Calendario Fiscal → /tax-calendar  
  └─ Impuestos        → /tax-optimizer
      ├─ RRSP/TFSA     → /dashboard?area=impuestos&tab=optimizacion
      └─ Resumen Fiscal → /dashboard?area=impuestos&tab=resumen

🎓 CRECIMIENTO
  ├─ Mentoría         → /mentorship
  │   ├─ Cuadrante Kiyosaki → /dashboard?area=crecimiento&tab=mentoria
  │   ├─ Libertad Financiera → /dashboard?area=crecimiento&tab=mentoria
  │   └─ Hábitos        → /dashboard?area=crecimiento&tab=educacion
  └─ Inversiones      → /investments
      ├─ Calculadora FIRE → /dashboard?area=crecimiento&tab=inversiones
      ├─ Portafolio      → /dashboard?area=crecimiento&tab=inversiones
      └─ Metas SMART     → /dashboard?area=crecimiento&tab=metas

💰 DÍA A DÍA
  └─ Presupuesto      → /budget
      ├─ Presupuesto Global → /dashboard?area=familia&tab=presupuesto
      ├─ Gestor de Deudas   → /dashboard?area=familia&tab=deudas
      └─ Análisis Familiar  → /dashboard?area=familia&tab=analisis
```

## Plan de implementación

### 1. Deep-linking al Centro de Control
**Archivos:** `Dashboard.tsx`, `OrganizedDashboard.tsx`, `useDisplayPreferences.ts`

- Leer query params `?area=X&tab=Y` en Dashboard
- Auto-cambiar a vista "Centro de Control", expandir el área correcta, y activar el sub-tab
- Limpiar los query params después de aplicar

### 2. Submenús colapsables en el sidebar  
**Archivo:** `Layout.tsx`

- Extender la estructura `getNavSections` para soportar `children` opcionales en cada ítem
- Renderizar un `Collapsible` cuando un ítem tiene `children`
- El ítem padre sigue navegando a su página al hacer clic
- Un pequeño chevron a la derecha expande/colapsa los sub-ítems
- Los sub-ítems usan texto más pequeño e indentado, con un punto de color o icono sutil
- Cuando el sidebar está colapsado (`collapsed=true`), los sub-ítems aparecen en un tooltip/popover al hover

### 3. Persistencia del estado colapsado
- Guardar qué submenús están abiertos en `localStorage` para que persistan entre sesiones

### Archivos a modificar
1. `src/components/Layout.tsx` — agregar soporte para children en nav items + renderizar collapsibles
2. `src/pages/Dashboard.tsx` — leer query params `area` y `tab`
3. `src/components/focus/OrganizedDashboard.tsx` — aceptar props para auto-expandir área
4. `src/components/focus/AreaTabsLayout.tsx` — aceptar prop para forzar tab activo

**Cero eliminaciones. Solo se agrega funcionalidad nueva.**

