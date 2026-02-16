
# Auditoria de Responsive Movil: Plan de Mejora

## Diagnostico Visual

Tras revisar la app en viewport 390x844 (iPhone 14), identifico estos problemas criticos:

---

## Problemas Encontrados

### 1. Header demasiado alto y denso
- El header tiene demasiados elementos (logo + nombre + sync + auth + search + bell + hamburger = 7 items) comprimidos en una sola linea
- El logo Phoenix es grande (44x44px aprox) y compite con el nombre "EvoFinz"
- Los iconos de SyncStatus y AuthStatus no son necesarios en el header visible - solo confunden

**Solucion**: Reducir header a 3 elementos: Logo+nombre (izq), Search (centro-der), Bell con badge (der). Mover sync/auth al menu lateral.

### 2. Barra de navegacion inferior NO destaca la ruta activa visualmente
- El texto "Budget" se muestra en azul pero el contraste es muy sutil
- No hay indicador visual fuerte (barra, fondo, etc.) para saber donde estas
- El FAB central de camara se pierde en el diseno

**Solucion**: Agregar barra indicadora superior en el item activo (como iOS/Android nativo), fondo sutil en el item activo, y hacer el FAB mas prominente con animacion de entrada.

### 3. PageHeader con boton "back" redundante
- El boton de "back" (<) aparece en TODAS las paginas incluso Dashboard
- Ocupa espacio horizontal valioso junto al titulo
- En apps nativas, el back lo maneja el OS, no un boton explicito en cada pagina

**Solucion**: Ocultar boton back cuando la ruta actual es una de las 5 rutas principales del bottom nav (dashboard, expenses, budget, etc). Solo mostrarlo en sub-paginas.

### 4. Chips/filtros no son horizontalmente scrollables en todas las paginas
- En Budget, los tabs (Summary, Health, Pace, Payments) se ven comprimidos
- En Expenses, los filtros (Incomplete, All..., All clients) estan apretados
- No hay indicador visual de que se puede hacer scroll horizontal

**Solucion**: Aplicar la clase `.chips-scroll` de forma consistente con gradiente de fade en los bordes para indicar scroll disponible.

### 5. Cards de estadisticas del Dashboard muy espaciadas
- Las 4 tarjetas (Income, Expenses, Balance, Savings) en el MobileDashboard tienen buen diseno pero los valores "$0" se ven desproporcionados cuando son cero
- El Year Overview ocupa demasiado espacio vertical con el grafico de barras
- Los botones de accion (Capture, +Expense, +Income, View All) deberian ser mas prominentes

**Solucion**: Hacer las stat cards mas compactas cuando los valores son 0, reducir padding del grafico anual, y convertir los action buttons en un grid 2x2 con iconos mas visibles.

### 6. Menu lateral (Sheet) tiene truncamiento de texto
- "Contracts..." y "Reconcili..." se cortan en la cuadricula 2-col del menu
- Los iconos de seccion son muy pequenos (w-5 h-5 con emoji dentro) y dificiles de leer
- La seccion "SYSTEM" queda cortada debajo del fold

**Solucion**: Hacer los items de menu con texto completo (usar 1 columna para nombres largos), aumentar iconos a w-7 h-7, y agregar scroll indicator.

### 7. CSS global force de min-height en TODOS los botones
- La regla `button, [role="button"] { min-height: 44px; min-width: 44px; }` en el media query movil afecta TODOS los botones incluyendo badges, chips, tags y botones inline
- Esto infla elementos que no deberian ser tan grandes (como los tags "Pending", "Unclassified" en expenses)

**Solucion**: Remover la regla global y aplicar `.touch-target-min` solo a botones de accion primarios, no a chips/badges/tags.

### 8. FABs flotantes obstruyen contenido
- Los FABs de Camera y "+" en el Dashboard estan posicionados sobre contenido scrollable
- Cuando scrolleas hasta abajo, los FABs tapan los ultimos elementos

**Solucion**: Agregar padding-bottom extra al contenido cuando los FABs estan visibles, o mover los FABs al bottom-nav integrado.

### 9. Tipografia inconsistente entre paginas
- Dashboard: titulo no visible (MobileDashboard no usa PageHeader)
- Expenses: "Expenses" con font-bold text-xl
- Income: "Income" con font-bold text-xl
- Budget: "Budget" con emoji + font-bold
- Inconsistencia en si llevan emoji o no, si llevan descripcion o no

**Solucion**: Estandarizar todos los titulos moviles con el mismo patron: emoji + titulo + descripcion opcional debajo.

### 10. Espaciado vertical excesivo
- Hay demasiado espacio entre secciones en varias paginas
- El gap entre el header y el primer contenido es muy grande
- Los cards tienen padding interior excesivo para movil

**Solucion**: Reducir `--mobile-section-gap` de 0.875rem a 0.75rem, reducir padding top del main content area.

---

## Plan de Implementacion

### A. Optimizar Header Movil (Layout.tsx)
- Reducir a: PhoenixLogo mini + "EvoFinz" (izq) | Search + Bell (der)
- Mover SyncStatus y AuthStatus al menu lateral Sheet
- Reducir height del header de py-2.5 a py-2
- Eliminar el hamburger del header (ya esta en bottom nav como "More")

### B. Mejorar Bottom Nav (index.css + Layout.tsx)
- Agregar barra indicadora de 3px en la parte superior del item activo
- Agregar fondo sutil (bg-primary/10) al item activo
- Hacer el FAB central mas grande (w-13 h-13) con sombra mas pronunciada
- Agregar haptic-like animation (scale bounce) al tap

### C. Corregir regla CSS global de touch targets (index.css)
- Remover `button, [role="button"] { min-height: 44px }` del media query global
- Crear clase `.btn-touch` para botones que SI necesitan 44px
- Agregar excepciones para badges, chips, tags con `.badge, .chip, [data-slot="badge"] { min-height: auto; min-width: auto; }`

### D. Mejorar Menu Lateral Sheet (Layout.tsx)
- Cambiar grid de items a 1 columna para nombres largos
- Agregar SyncStatus y AuthStatus aqui (movidos del header)
- Mostrar el tema oscuro/claro toggle aqui
- Iconos de seccion mas grandes

### E. Estandarizar PageHeader movil (PageHeader.tsx)
- Ocultar back button en rutas principales del bottom nav
- Consistencia: todos los titulos con mismo estilo
- Reducir margen inferior

### F. Dashboard Movil (MobileDashboard.tsx)
- Reducir padding de stat cards
- Eliminar FABs flotantes redundantes (ya hay Capture en bottom nav)
- Comprimir Year Overview chart en altura
- Mejorar action buttons grid

### G. Chips y Filtros scroll (index.css)
- Agregar gradiente de fade en los bordes de `.chips-scroll`
- Aplicar patron consistente en Budget tabs, Expense filters, etc.

**Total: 7 archivos a modificar, 0 migraciones SQL.**
