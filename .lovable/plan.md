

# Plan: Mejoras Finales de Claridad, Inventario y Guía del Usuario

## Problemas Identificados

### 1. DataInventoryPanel no incluye Transacciones Bancarias
El inventario de datos del dashboard muestra documentos, gastos, ingresos, contratos y clientes — pero **omite las transacciones bancarias**. Esto confunde al usuario porque importó datos bancarios pero no aparecen en el conteo de "su inventario".

### 2. DataInventoryPanel no incluye Pagos Recurrentes (Bills)
Si el usuario tiene pagos recurrentes configurados, tampoco se reflejan en el inventario.

### 3. BankingSummaryCard: sin estado vacío guía
Cuando no hay transacciones bancarias (`stats.total === 0`), el componente retorna `null`. No ofrece ningún camino al usuario para descubrir que puede importar. Sería útil un estado vacío con CTA "Importar estado de cuenta".

### 4. Redundancia de comentarios en Dashboard.tsx
Los comentarios de sección dicen `{/* 8. ... */}` tres veces (Mission Control, View Tabs, View Content). Menor pero confuso para mantenimiento.

## Solución

### 1. Agregar banco y bills al DataInventoryPanel
Agregar dos queries paralelas más al hook `useDataInventory`:
- `bank_transactions` → count + fechas
- `recurring_bills` → count + fechas

Renderizar como dos items más en el grid (total: 7 categorías). Completeness se calcula sobre 7 en vez de 5.

### 2. BankingSummaryCard: estado vacío con CTA
Cuando `stats === null` o `total === 0`, en lugar de `return null`, mostrar un card compacto con icono de banco y botón "Importar estado de cuenta" → `/banking`. Solo en modo no-compact.

### 3. Fix comentarios duplicados en Dashboard
Renumerar comentarios correctamente (7, 8, 9, 10).

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/dashboard/DataInventoryPanel.tsx` | Agregar bank_transactions + recurring_bills al inventario |
| `src/components/banking/BankingSummaryCard.tsx` | Estado vacío con CTA en modo full (no compact) |
| `src/pages/Dashboard.tsx` | Fix numeración de comentarios |

## Detalle Técnico

**DataInventoryPanel** — agregar al `Promise.all`:
```typescript
supabase.from('bank_transactions').select('created_at', { count: 'exact', head: false })
  .eq('user_id', user.id),
supabase.from('recurring_bills').select('created_at', { count: 'exact', head: false })
  .eq('user_id', user.id),
```
Y agregar items al array con iconos `Landmark` y `CalendarCheck`, links a `/banking` y `/bills`.

**BankingSummaryCard vacío** — card dashed con icono + texto "Importa tu estado de cuenta para ver un resumen aquí" + botón navigate(`/banking`).

