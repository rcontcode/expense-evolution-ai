

# Plan: Mejoras Finales al Panorama Financiero

## Problemas Encontrados

### 1. No aparece en Mobile
El `FinancialNarrativeCard` solo se renderiza en el Dashboard desktop. El `MobileDashboard.tsx` no lo incluye. El usuario actual tiene viewport de 360px -- esta viendo mobile y **nunca ve el Panorama Financiero**.

### 2. Balance section carece de contexto visual
La seccion de balance solo muestra numeros en texto plano. Falta una barra visual de proporcion ingreso/gasto que de claridad instantanea.

### 3. Clientes sin ingresos no aparecen
Si un cliente existe pero no tiene ingresos en los ultimos 3 meses, se filtra completamente. El usuario pierde visibilidad de clientes inactivos.

### 4. Seccion de Perfil no se muestra si no hay work_types
Si el usuario no configuro work_types en su perfil, toda la seccion Perfil desaparece, incluyendo la info de clientes.

### 5. No hay indicador de "datos del periodo"
El usuario no sabe que periodo de datos esta mirando (ultimos 3 meses promediados). Falta contexto temporal.

## Solucion

### 1. Agregar FinancialNarrativeCard al MobileDashboard
Importar lazy y renderizar despues del BankingSummaryCard, antes de gamification. Modo compacto no necesario -- el componente ya es responsive con sus collapsibles.

### 2. Barra visual de proporcion en Balance
Agregar un `div` con dos barras horizontales proporcionales (ingreso verde, gasto rojo) debajo de los numeros. Simple CSS `flex` con width porcentual.

### 3. Mostrar clientes inactivos
Incluir clientes con `totalIncome === 0` pero marcarlos como "(sin actividad reciente)" en gris. El usuario sabe que existen.

### 4. Perfil siempre visible si hay clientes
Cambiar la condicion: mostrar seccion Perfil si hay `workTypes.length > 0 OR clients.length > 0`.

### 5. Indicador de periodo
Agregar una linea sutil debajo del titulo: "Basado en los ultimos 3 meses" con el rango de fechas.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/dashboard/MobileDashboard.tsx` | Agregar FinancialNarrativeCard lazy-loaded |
| `src/components/dashboard/FinancialNarrativeCard.tsx` | Barra visual balance, perfil siempre con clientes, indicador de periodo, clientes inactivos |
| `src/hooks/data/useFinancialNarrative.ts` | No filtrar clientes con totalIncome 0 |

## Detalle Tecnico

**MobileDashboard**: Agregar import lazy + Suspense del FinancialNarrativeCard entre BankingSummaryCard y ProfileCompletionNudge.

**Barra de proporcion**: Simple `flex` con dos divs, max = totalMonthlyIncome, widths proporcionales. Verde para ingreso, rojo para gasto.

**Clientes**: En `useFinancialNarrative`, remover `.filter(c => c.totalIncome > 0)` y en el componente renderizar los de `totalIncome === 0` con estilo atenuado.

**Periodo**: Texto `text-xs text-muted-foreground` bajo el CardTitle: "Basado en datos de [mes-3] a [mes actual]".

