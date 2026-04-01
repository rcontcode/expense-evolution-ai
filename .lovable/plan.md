

# Plan: Corregir menú lateral — enlaces, títulos y consistencia

## Problemas encontrados

### Errores de navegación (el enlace no lleva donde dice)
1. **"Deudas"** → va a `/dashboard?area=familia&atab=debts` (deep-link al dashboard, no página propia). Nunca se marca como "activo".
2. **"Ahorro"** → va a `/budget?tab=savings` — correcto, pero no se verifica que exista esa tab.
3. **Sub-items de Presupuesto** → van al Dashboard (`/dashboard?area=...`), no a `/budget`. Confuso porque el padre sí va a `/budget`.
4. **Sub-items de Inversiones**: "Págate Primero" y "Clasificación Deuda" van a tabs de **Mentoría**, no de Inversiones.
5. **Sub-item de Patrimonio** "Análisis Familiar" va al Dashboard, no tiene relación con Net Worth.
6. **Sub-item de Gastos** "Gráficos Día a Día" va al Dashboard control view, no a gráficos de gastos.

### Duplicados
7. **Proyectos** y **Contratos** aparecen como items independientes Y como sub-items de Clientes (misma ruta).

### Iconos repetidos/incorrectos
8. **Análisis** usa icono `Scale` (balanza) — igual que Patrimonio. Debería usar un icono de gráficos.
9. **Impuestos** usa icono `Receipt` — igual que Gastos.
10. **Reportes** y **Calendario Fiscal** ambos usan `FileText`.

### Tooltip incorrecto
11. **Reportes** tiene `tooltipKey: 'analytics'` — muestra tooltip de Analytics en vez de Reportes.

## Cambios propuestos en `src/components/Layout.tsx`

### Eliminar sub-items que confunden (no llevan a donde dicen)
- **Gastos**: quitar sub-item "Gráficos Día a Día" (lleva al dashboard, no a gráficos de gastos)
- **Presupuesto**: quitar sub-items que apuntan al dashboard; dejar solo accesos a tabs reales de `/budget`
- **Patrimonio**: quitar sub-item "Análisis Familiar" (no tiene relación)
- **Inversiones**: quitar "Págate Primero" y "Clasificación Deuda" (son de Mentoría, no de Inversiones)

### Eliminar duplicados
- Quitar **Proyectos** y **Contratos** como sub-items de Clientes (ya existen como items independientes justo debajo)

### Corregir iconos
- **Análisis**: cambiar `Scale` → `BarChart3` o similar
- **Impuestos**: cambiar `Receipt` → `Calculator` o `Landmark`
- **Reportes**: cambiar a `FileBarChart`
- **Calendario Fiscal**: mantener `FileText` o usar `CalendarDays`

### Corregir tooltip
- **Reportes**: cambiar `tooltipKey` de `'analytics'` a `'reports'` (agregar entrada si no existe en TOOLTIP_CONTENT)

### Mover "Deudas" a sub-item de Patrimonio
- En vez de ser item independiente apuntando al dashboard, convertirlo en sub-item de Patrimonio con ruta `/net-worth` (la página ya tiene un DebtManager)

## Archivos a modificar

1. **`src/components/Layout.tsx`** — Corregir `getNavSections()`: iconos, sub-items, tooltipKey, eliminar duplicados
2. **`src/components/ui/info-tooltip.ts`** — Agregar entrada `reports` si no existe (verificar)

