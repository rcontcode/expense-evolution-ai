

# Implementar Sistema de Recordatorios Real en Toda la App

## Problema

Hay 4 sistemas de recordatorios que se mencionan en la app y en el manual pero **solo muestran un toast falso o no existen**:

1. **Calendario Fiscal** -- el boton "Recordar" solo muestra un toast, no guarda nada
2. **Contratos** -- no existe ningun hook que revise contratos proximos a vencer/renovar
3. **Pagos Fijos (Bills)** -- el campo `reminder_days_before` se guarda pero nada lo revisa para crear notificaciones
4. **Presupuesto (Budget Alerts)** -- las reglas se pueden crear/editar pero nada las ejecuta contra gastos reales

## Solucion

Crear un hook centralizado `useAutoReminders` que corra en el `Layout` (como ya lo hace `useGlobalReminders`) y que revise periodicamente estas 4 areas, insertando notificaciones reales en la tabla `notifications`.

## Archivos a Crear

### 1. `src/hooks/data/useAutoReminders.ts` (nuevo)
Hook principal que se ejecuta cada 60 segundos y verifica:

**A) Pagos Fijos (Bills)**
- Consulta `recurring_bills` activos del usuario
- Para cada bill, calcula dias hasta `next_due_date`
- Si `dias <= reminder_days_before` y no hay notificacion reciente (ultimas 24h) para ese bill, inserta en `notifications` con `type: 'bill_reminder'`

**B) Contratos**
- Consulta `contracts` activos (no eliminados, con `end_date`)
- Si un contrato vence en <= 30 dias (o segun `renewal_notice_days`), y no hay notificacion reciente, inserta con `type: 'contract_reminder'`
- Si tiene `auto_renew = true`, el mensaje indica que se renovara automaticamente

**C) Calendario Fiscal**
- En lugar de guardar recordatorios custom, el hook calcula las fechas fiscales conocidas (las mismas de TaxDeadlineCards) y si alguna esta a 30, 14, o 7 dias, crea notificacion con `type: 'tax_reminder'`
- Usa el pais del usuario y tipo de entidad para determinar que fechas aplican

**D) Presupuesto**
- Consulta `budget_alert_rules` activos
- Consulta gastos del mes actual por categoria
- Si una regla de tipo `exceeds` o `approaches` se cumple y no se ha disparado hoy, inserta notificacion con `type: 'budget_alert'` y actualiza `last_triggered_at`

### 2. Modificar `src/components/tax-calendar/TaxDeadlineCards.tsx`
- Cambiar `handleSetReminder` para que realmente inserte un registro en `notifications` con la fecha del deadline y un recordatorio configurado
- Mostrar un indicador visual de "Recordatorio activo" en el boton despues de activarlo

### 3. Modificar `src/components/Layout.tsx`
- Importar y activar `useAutoReminders()` junto al existente `useGlobalReminders()`

## Logica Anti-Duplicados

Cada vez que el hook quiere crear una notificacion, primero consulta si ya existe una con:
- Mismo `user_id`
- Mismo `type`
- Titulo similar (contiene el nombre del bill/contrato/deadline)
- Creada en las ultimas 24 horas (para bills/budget) o 7 dias (para contratos/fiscal)

Si ya existe, no crea duplicado.

## Detalles Tecnicos

```text
useAutoReminders()
  |
  |-- checkBillReminders()
  |     Lee: recurring_bills (status=active)
  |     Escribe: notifications (type=bill_reminder)
  |
  |-- checkContractReminders()
  |     Lee: contracts (end_date NOT NULL, deleted_at IS NULL)
  |     Escribe: notifications (type=contract_reminder)
  |
  |-- checkTaxReminders()
  |     Lee: settings (country, entity type)
  |     Escribe: notifications (type=tax_reminder)
  |
  |-- checkBudgetAlerts()
  |     Lee: budget_alert_rules + expenses (mes actual)
  |     Escribe: notifications (type=budget_alert)
  |     Actualiza: budget_alert_rules.last_triggered_at
```

## Resultado Esperado

- Al entrar a la app, el sistema verifica automaticamente todas las areas
- Las notificaciones aparecen en `/notifications` como cualquier otra
- Los botones de "Recordar" en el calendario fiscal realmente funcionan
- Los pagos fijos generan alertas antes del vencimiento
- Los contratos proximos a vencer generan alertas segun `renewal_notice_days`
- Las reglas de presupuesto se ejecutan y alertan cuando se exceden umbrales

