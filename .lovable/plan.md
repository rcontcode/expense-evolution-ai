

## Respuesta corta: No, el plan original era solo para desktop

El Navigator lateral flotante y el botón ⌘K fueron diseñados exclusivamente para desktop. En móvil no tienen sentido porque:
- No hay espacio para un panel lateral flotante
- ⌘K no existe como atajo en celulares
- El scroll-spy lateral compite con el bottom nav existente

## Plan actualizado: Adaptaciones móviles

Además de las 2 soluciones desktop, agregaremos **2 adaptaciones específicas para móvil**:

### 1. Sticky Section Pills (Mobile)
Una barra horizontal sticky justo debajo de las `DashboardViewTabs` con pills/chips desplazables que representan las secciones visibles. Funciona como un mini-índice horizontal:

```text
┌─────────────────────────────────────┐
│ [Resumen] [Control]                 │  ← Tabs existentes
├─────────────────────────────────────┤
│ ● Timeline  ● Acciones  ● Mes  ... │  ← Nuevos pills (scroll horizontal)
├─────────────────────────────────────┤
│                                     │
│  Contenido del dashboard...         │
│                                     │
└─────────────────────────────────────┘
│  🏠   📊   ➕   👤   ⋯   │  ← Bottom nav existente
```

- Scroll-spy: la pill activa se resalta mientras el usuario hace scroll
- Tap en una pill = smooth scroll a esa sección
- Solo aparece en la vista activa (Resumen o Control)
- Ocupa ~36px de alto, se oculta al hacer scroll down y reaparece al scroll up

### 2. Botón flotante de búsqueda (Mobile)
Un pequeño botón circular (🔍) sobre el bottom nav que abre el `GlobalSearch` existente como un drawer de pantalla completa. Reemplaza el ⌘K que no existe en móvil.

### Archivos a crear/modificar

| Archivo | Cambio |
|---------|--------|
| **Nuevo**: `src/components/dashboard/DashboardNavigator.tsx` | Panel TOC flotante derecho (desktop only) con scroll-spy via IntersectionObserver |
| **Nuevo**: `src/components/dashboard/MobileSectionPills.tsx` | Barra horizontal sticky con chips de secciones + scroll-spy (mobile only) |
| **Modificar**: `src/pages/Dashboard.tsx` | Agregar `data-section` attrs, montar Navigator desktop |
| **Modificar**: `src/components/dashboard/MobileDashboard.tsx` | Montar `MobileSectionPills` debajo de tabs |
| **Modificar**: `src/components/search/GlobalSearch.tsx` | Agregar dashboard tabs y áreas del Centro de Control como items buscables |
| **Modificar**: `src/components/Layout.tsx` | Agregar botón flotante 🔍 en mobile (sobre bottom nav) y botón ⌘K en desktop |

### Resumen de experiencia por dispositivo

- **Desktop**: Navigator lateral derecho (TOC con scroll-spy) + botón ⌘K flotante
- **Mobile**: Section Pills horizontales (scroll-spy) + botón 🔍 flotante que abre GlobalSearch

Ambos comparten la misma lógica de `IntersectionObserver` y los mismos `data-section` attributes, solo cambia la presentación visual.

