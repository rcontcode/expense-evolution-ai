

# Plan: Consolidar y Mejorar el Dashboard (Sin Caos)

## Problema Actual

El Dashboard tiene **6 elementos apilados** antes de llegar al contenido real (Timeline). Esto causa scroll excesivo y fatiga visual. Agregar componentes sin quitar nada empeoraría la situación.

## Estrategia: Consolidar + Reintegrar Selectivamente

### Que SI reintegrar

**WorkflowSummaryWidget** - Muestra progreso de 5 flujos (Gastos, Clientes, Impuestos, Banco, Riqueza) con barras de progreso y estados. Es información unica y accionable que NO existe en ningún otro componente.

**Ubicacion**: Entre el MonthDetailPanel y el ViewModeToggle, justo donde el usuario ya vio sus números y ahora necesita saber "que hacer".

**CompletenessCard** - Solo mostrarlo cuando hay gastos incompletos (condicional). Si todo esta completo, no se muestra. Evita ocupar espacio innecesario.

**Ubicacion**: Junto al WorkflowSummaryWidget en un grid de 2 columnas (solo en vista clasica).

### Que NO reintegrar

**DashboardHero** - El MonthDetailPanel ya muestra Ingresos/Gastos/Balance del mes seleccionado. Agregar DashboardHero seria duplicar la misma informacion. El saludo personalizado ya lo hace InteractiveWelcome.

### Que consolidar (reducir banners)

Actualmente hay 6 banners/widgets antes del Timeline. Se propone:

1. **Mantener**: NextActionBanner (ya es condicional y compacto)
2. **Mantener**: ProgressiveOnboarding (solo para nuevos usuarios, desaparece)
3. **Mantener**: BetaReminderBanner (temporal, desaparecera)
4. **Mover abajo**: DashboardGamificationWidget - moverlo DESPUES del Timeline, no antes. El usuario llega al dashboard para ver numeros, no gamificacion.
5. **Mover abajo**: ProfileCompletionNudge - moverlo despues del WorkflowSummaryWidget. Es una invitacion, no urgente.
6. **Condicional**: InteractiveWelcome ya es condicional (solo primera visita) - OK como esta.

## Estructura Propuesta del Dashboard (Desktop, Vista Clasica)

```text
+--------------------------------------------------+
| BetaReminderBanner (temporal)                     |
| NextActionBanner (condicional)                    |
| ProgressiveOnboarding (solo nuevos usuarios)      |
+--------------------------------------------------+
| InteractiveWelcome (solo primera visita)          |
+--------------------------------------------------+
| YearTimelineChart    |  MonthDetailPanel          |
+--------------------------------------------------+
| WorkflowSummaryWidget | CompletenessCard*         |
| (* solo si hay incompletos, sino full-width)      |
+--------------------------------------------------+
| ProfileCompletionNudge (movido aqui)              |
| DashboardGamificationWidget (movido aqui)         |
+--------------------------------------------------+
| ViewModeToggle + Export                           |
+--------------------------------------------------+
| OrganizedDashboard / Vista Clasica                |
+--------------------------------------------------+
```

## Cambios Tecnicos

### Archivo: `src/pages/Dashboard.tsx`

**1. Agregar imports:**
- `WorkflowSummaryWidget` (lazy loaded)
- `CompletenessCard` (lazy loaded)

**2. Mover DashboardGamificationWidget y ProfileCompletionNudge:**
- Sacarlos de arriba del Timeline
- Colocarlos despues del nuevo bloque de Workflows

**3. Agregar seccion de Workflows entre Timeline y ViewMode:**
```typescript
{/* Workflow Progress + Completeness (Vista Clasica) */}
<div className="grid gap-4 lg:grid-cols-2">
  <Suspense fallback={<Skeleton className="h-[200px]" />}>
    <WorkflowSummaryWidget />
  </Suspense>
  {allExpenses && allExpenses.length > 0 && (
    <Suspense fallback={<Skeleton className="h-[200px]" />}>
      <CompletenessCard expenses={allExpenses} isLoading={isLoading} />
    </Suspense>
  )}
</div>
```

**4. CompletenessCard condicional:**
- Solo renderizar si `allExpenses?.length > 0`
- Si no hay gastos incompletos, el WorkflowSummaryWidget ocupa full width

### Resultado

- **Menos scroll** antes del contenido real (2 widgets movidos abajo)
- **Informacion accionable** (WorkflowSummaryWidget) en posicion estrategica
- **Sin redundancia** (DashboardHero NO se agrega)
- **Sin caos** (CompletenessCard es condicional)
- **Orden logico**: Numeros (Timeline) → Que hacer (Workflows) → Motivacion (Gamification) → Herramientas (Control Center)

