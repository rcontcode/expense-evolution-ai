## Rediseño visual del menú de tabs del CRM (`/admin/crm`)

### Problema actual
Las 6 filas de tabs (General, Leads, Contacto, Métricas, Técnico, BI) viven dentro de un mismo bloque gris plano. Los labels de grupo son etiquetas minúsculas de 9px que se pierden, los colores son pastel similares y no hay separación visual real — parece "un montón de chips de colores" en vez de un menú organizado por función.

### Objetivo
Convertir cada grupo en una "sección" claramente identificable, con identidad de color propia, ícono grande del grupo, descripción corta de para qué sirve, y separación física entre filas. Mantener compacto en desktop, accesible en móvil.

### Cambios (solo en `src/pages/admin/AdminCRM.tsx`, líneas 706–907)

1. **Refactor a estructura declarativa**: Extraer la config de los 6 grupos a un array `TAB_GROUPS` arriba del JSX, cada uno con `{ id, icon (Lucide), title, subtitle, accentClass, ringClass, items[] }`. Elimina los 6 bloques repetidos casi idénticos → un solo `.map()` que renderiza cada grupo. Mismo comportamiento, código más limpio.

2. **Tarjeta por grupo** (nuevo wrapper visual):
   - Cada grupo es una **mini-card** con:
     - Borde izquierdo de 3px del color del grupo (`border-l-4 border-l-{accent}`) → identifica el grupo de un vistazo.
     - Fondo sutil con gradiente del color del grupo (`bg-gradient-to-r from-{accent}/5 to-transparent`).
     - Sombra suave + `rounded-xl` + hover lift muy ligero.
   - Header del grupo (izquierda, ancho fijo ~140px):
     - **Ícono Lucide** real en círculo de color (no emoji): `Home`, `Target`, `MessageSquare`, `BarChart3`, `Settings2`, `Brain`.
     - **Título** en tamaño legible (text-xs font-bold uppercase) en el color del acento.
     - **Subtítulo** de 1 línea (text-[10px] muted) explicando para qué sirve el grupo (ej. "Vista general y agenda", "Captura y pipeline de leads", "Comunicación y secuencias", "KPIs y revenue", "Webhooks y reglas", "Inteligencia de negocio").
   - Divisor vertical sutil entre header y chips.
   - Chips a la derecha en flex-wrap (los mismos botones actuales, sin cambiar tamaños ni comportamiento).

3. **Chips mejorados ligeramente**:
   - Sombra interna sutil en estado normal para sensación "3D candy" alineada con el resto de la app.
   - Estado activo: mantener gradiente actual + pequeño "halo" (ring del color del grupo).
   - Indicador puntito de color del grupo a la izquierda del chip cuando no está activo, para reforzar pertenencia.

4. **Separación visual real entre grupos**:
   - `space-y-3` entre cards (en vez de `space-y-2` actual sin separadores).
   - Quitar el wrapper gris `bg-muted/30` que englobaba todo y "aplastaba" la jerarquía. Cada grupo respira por sí mismo.

5. **Responsive**:
   - Desktop: header del grupo a la izquierda, chips a la derecha (layout horizontal).
   - Móvil (`<md`): header arriba (ícono + título en línea), chips debajo en wrap — ya funciona porque los chips usan emoji en móvil.

6. **Accesibilidad**:
   - `aria-label` en cada card con el nombre del grupo.
   - Tooltips actuales se mantienen tal cual.

### Diagrama visual

```text
┌─────────────────────────────────────────────────────────────────┐
│ ▎🏠 GENERAL          │ [Home] [Agenda]                          │
│   Vista y agenda     │                                          │
├─────────────────────────────────────────────────────────────────┤
│ ▎🎯 LEADS            │ [Usuarios] [Leads] [Pipeline] [Ranking]  │
│   Captura y pipeline │                                          │
├─────────────────────────────────────────────────────────────────┤
│ ▎💬 CONTACTO         │ [Contactar•3] [Historial] [Plantillas]…  │
│   Comunicación       │                                          │
└─────────────────────────────────────────────────────────────────┘
```
(borde izquierdo de color por grupo, header con ícono real + subtítulo, chips a la derecha)

### Lo que NO cambia
- Lógica de tabs, valores, navegación, contenidos, badges de hotCount, tooltips → todo se preserva.
- No se toca ningún otro archivo.
- Se mantienen tokens semánticos del design system (sin colores hardcoded fuera de los acentos que ya se usaban).

### Resultado esperado
De "fila de chips colorida" → "panel de control segmentado" donde se entiende en 1 segundo qué hace cada grupo y los chips se leen como subitems del grupo, no como un mar de botones.