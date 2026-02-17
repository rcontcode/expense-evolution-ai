

# Reestructuración UX de la Página de Presupuesto

## Problema Actual

La FamilyBudgetView apila ~15 CollapsibleSections en un scroll vertical sin jerarquía clara. Cuando hay datos, el usuario ve:
- Resumen rapido (4 mini-cards)
- Ingresos del Mes
- Salud Financiera + Consejos Inteligentes
- Ritmo de Gasto + Presupuesto vs Real
- Comparacion Mensual + Proximos Pagos
- Distribucion de Gastos + Pagos Fijos
- Detalle por Categoria + Calendario
- Limites por Categoria + Alertas
- Proyecciones (full width)
- Metas de Ahorro + Comparacion Anual
- Reglas + Historial + Exportar (3 cols)
- Deudas + Suscripciones + Progreso (3 cols)
- Gastos del Negocio

Son 15+ secciones mezclando informacion esencial con herramientas avanzadas. No hay un camino claro.

## Solucion: Tabs de Navegacion Principal

Reemplazar el scroll infinito con **tabs claros** que agrupen logicamente las secciones. El scroll nav horizontal existente (SECTION_IDS) ya tiene la estructura correcta pero solo hace scroll -- ahora cada tab sera una vista separada que oculta el resto.

### Nueva Estructura por Tabs

**Tab 1: Resumen (default)**
- Summary strip (4 mini-cards) - siempre visible
- Daily budget indicator
- Salud Financiera + Consejos Inteligentes (2 cols)
- Comparacion Mensual + Proximos Pagos (2 cols)

**Tab 2: Gastos**
- Distribucion de Gastos (donut)
- Detalle por Categoria (con barras de progreso)
- Calendario de Gastos (heatmap)
- Gastos del Negocio (si aplica)

**Tab 3: Ritmo**
- Ritmo de Gasto Diario (cumulative chart)
- Presupuesto vs Real (by category)
- Limites por Categoria
- Alertas

**Tab 4: Pagos**
- Pagos Fijos (lista completa)
- Proximos Pagos / Recordatorios
- Ingresos del Mes

**Tab 5: Metas**
- Metas de Ahorro
- Proyecciones (savings, annual, rate, daily)
- Comparacion Ano vs Ano

**Tab 6: Herramientas** (icono de engranaje, solo power users)
- Reglas Automaticas
- Historial de Cambios
- Exportar Presupuesto
- Deudas
- Suscripciones
- Progreso / Gamificacion

### Cambios Clave de UX

1. **El summary strip (4 mini-cards + daily budget) siempre visible arriba de los tabs** -- es la informacion mas importante y debe verse sin importar que tab este activo

2. **Cada tab muestra solo 3-4 secciones** en lugar de 15, reduciendo dramaticamente el scroll y la complejidad visual

3. **Las herramientas avanzadas se agrupan en un solo tab** para no contaminar la vista principal

4. **Los tabs usan el mismo estilo visual** que ya tiene BudgetSection.tsx (con iconos y badges de conteo)

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `src/components/budget/FamilyBudgetView.tsx` | Reestructurar: extraer summary strip como siempre-visible, agrupar secciones en tabs usando Tabs/TabsContent de Radix, eliminar scroll nav horizontal |

## Detalles Tecnicos

- Se reutilizara el componente `Tabs` de Radix UI ya importado en el proyecto
- Los tabs reemplazaran los botones de scroll nav (`SECTION_IDS`)
- El estado del tab activo se manejara con `useState` (default: "overview")
- Todos los sub-componentes existentes se mantienen intactos, solo cambia su agrupacion
- La logica de onboarding (sin datos) sigue igual
- El FAB flotante sigue visible en todos los tabs
- Los tabs seran responsive: en mobile mostraran solo iconos, en desktop icono + texto
- Se mantendra lazy loading para charts pesados dentro de cada tab

