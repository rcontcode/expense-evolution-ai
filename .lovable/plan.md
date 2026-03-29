

# Navegación Temporal en Pagos Fijos y Herramientas Clave

## Problema
Solo el **Calendario** tiene flechas para navegar entre meses. El Checklist, Kanban, Lista y Summary Cards están fijos en el mes actual, limitando la utilidad de la herramienta.

## Solución: Navegador de Mes Compartido

Crear un **selector de mes centralizado** en `BillsDashboard` que controle la vista de todas las pestañas (excepto Proyección, que ya muestra 6 meses adelante). Así el usuario puede revisar pagos pasados y futuros desde cualquier vista.

```text
  ◀  marzo 2026  ▶   [Hoy]
```

### Componentes afectados

| Componente | Estado actual | Cambio |
|---|---|---|
| `BillsDashboard` | Sin estado de mes | Agregar `selectedMonth` state + componente `MonthNavigator` |
| `PaymentChecklist` | Hardcoded `now` | Recibir `selectedMonth` prop, filtrar por ese mes |
| `BillsKanban` | Hardcoded `now` | Recibir `selectedMonth` prop, clasificar bills por ese mes |
| `BillsSummaryCards` | Hardcoded `now` | Recibir `selectedMonth` prop para stats de ese mes |
| `PaymentCalendar` | Ya tiene navegación propia | Sincronizar con `selectedMonth` del parent |
| `NetCashFlowCard` | Hardcoded `now` | Recibir `selectedMonth` prop |
| `BillsManager` | Sin filtro de mes | Agregar filtro por mes seleccionado (bills con due date en ese mes) |
| `CashFlowProjection` | Proyección 6 meses | Sin cambios (ya funciona bien) |

### Implementación

**1. Crear `MonthNavigator` component** (`src/components/bills/MonthNavigator.tsx`)
- Flechas izquierda/derecha + nombre del mes localizado + botón "Hoy" (solo si no es mes actual)
- Props: `value: Date`, `onChange: (date: Date) => void`
- Reutilizable para otras herramientas de la app

**2. Actualizar `BillsDashboard.tsx`**
- Agregar `const [selectedMonth, setSelectedMonth] = useState(new Date())`
- Renderizar `<MonthNavigator>` entre las tabs y el contenido
- Pasar `selectedMonth` a todos los sub-componentes

**3. Actualizar `PaymentChecklist.tsx`**
- Aceptar `selectedMonth: Date` prop
- Reemplazar `const now = new Date()` por `selectedMonth` para el `monthInterval`
- Mantener `now` solo para determinar si un bill "isPaid"

**4. Actualizar `BillsKanban.tsx`**
- Aceptar `selectedMonth: Date` prop
- Usar `selectedMonth` como referencia para clasificar overdue/due_soon/upcoming/paid

**5. Actualizar `BillsSummaryCards.tsx`**
- Aceptar `selectedMonth: Date` prop
- Calcular stats basados en el mes seleccionado

**6. Actualizar `PaymentCalendar.tsx`**
- Aceptar `selectedMonth` y `onMonthChange` props opcionales
- Sincronizar su estado interno con el prop externo

**7. Actualizar `NetCashFlowCard.tsx`**
- Aceptar `selectedMonth: Date` prop para el análisis

**8. Actualizar `BillsManager.tsx`**
- Aceptar `selectedMonth: Date` prop
- Filtrar bills que tienen `next_due_date` dentro del mes seleccionado
- Mostrar indicador cuando no hay bills en ese mes

## Archivos a crear/modificar
1. **Crear** `src/components/bills/MonthNavigator.tsx` — Componente reutilizable
2. `src/components/bills/BillsDashboard.tsx` — Estado centralizado + MonthNavigator
3. `src/components/bills/PaymentChecklist.tsx` — Prop selectedMonth
4. `src/components/bills/BillsKanban.tsx` — Prop selectedMonth
5. `src/components/bills/BillsSummaryCards.tsx` — Prop selectedMonth
6. `src/components/bills/PaymentCalendar.tsx` — Sincronizar con prop externo
7. `src/components/bills/NetCashFlowCard.tsx` — Prop selectedMonth
8. `src/components/bills/BillsManager.tsx` — Filtrar por mes seleccionado

