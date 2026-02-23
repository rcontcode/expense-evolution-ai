

# Problemas Pendientes en el Sistema de Recordatorios

## Hallazgos de la Auditoria Exhaustiva

Despues de revisar todos los archivos relacionados con recordatorios y notificaciones, encontre **7 problemas concretos** -- algunos son brechas funcionales y otros son configuraciones que se guardan pero nunca se usan.

---

## 1. `repeat_frequency` y `preferred_hour` se guardan pero NUNCA se usan

**Gravedad: Alta** -- El usuario configura estos valores en `ReminderPreferencesPanel` y se guardan en `notification_preferences`, pero `useAutoReminders` los ignora completamente.

- `repeat_frequency` ('once', 'daily_until_deadline', 'weekly') deberia controlar cada cuanto se re-envia un recordatorio. Actualmente el hook usa logica fija de 24h/168h.
- `preferred_hour` deberia controlar a que hora del dia se generan. Actualmente se generan en cualquier momento.

**Solucion**: En `useAutoReminders.ts`, leer `pref.repeat_frequency` para calcular el `withinHours` de anti-duplicado (once = nunca re-enviar, daily = 24h, weekly = 168h). Leer `pref.preferred_hour` y comparar con la hora actual antes de insertar.

---

## 2. Dos sistemas de preferencias desconectados

**Gravedad: Media** -- Existen dos UI de preferencias que no se hablan entre si:
- `/settings` tiene `NotificationPreferences` (toggles on/off por categoria guardados en tabla `settings.preferences.notifications`)
- `/notifications` tiene `ReminderPreferencesPanel` (configuracion avanzada guardada en tabla `notification_preferences`)

El `useAutoReminders` solo consulta `notification_preferences`. Los toggles de `/settings` no tienen efecto real sobre los recordatorios automaticos.

**Solucion**: Conectar ambos sistemas. Si el usuario desactiva "Contratos" en Settings, `useAutoReminders` deberia respetar eso. O mejor: reemplazar los toggles simples de Settings con un enlace al panel avanzado de Notifications para evitar confusion.

---

## 3. `useAutoReminders` no filtra notificaciones snoozed al verificar duplicados

**Gravedad: Media** -- Cuando un usuario pospone (snooze) una notificacion, el hook `hasRecentNotification` la cuenta como existente, lo que impide que se genere una nueva cuando el snooze expira. Deberia excluir notificaciones snoozed del chequeo de duplicados.

**Solucion**: Agregar `.or('snoozed_until.is.null,snoozed_until.lt.' + new Date().toISOString())` al query de `hasRecentNotification`.

---

## 4. Notificaciones de `conversion_reminder` no aparecen en el filtro "Reminders"

**Gravedad: Baja** -- `useConversionReminders` genera notificaciones con type `conversion_reminder`, pero la constante `REMINDER_TYPES` en `Notifications.tsx` no lo incluye. Estas notificaciones se ven en "All" pero no en el tab "Reminders".

**Solucion**: Agregar `'conversion_reminder'` a `REMINDER_TYPES` y su icono/color correspondiente.

---

## 5. TaxDeadlineCards: el nombre del reminder cambia con el idioma

**Gravedad: Media** -- En las cards de Canada, `handleSetReminder` usa el nombre traducido:
```
handleSetReminder(isEs ? "Impuestos Personales" : "Personal Taxes", ...)
```
Si el usuario activa un reminder en espanol y luego cambia a ingles, la verificacion `activeReminders.has(...)` fallara porque compara contra el nombre en el idioma actual. El indicador "Activo" desaparecera.

**Solucion**: Usar siempre una clave fija en ingles para el titulo del reminder (ej: "Personal Taxes") independiente del idioma de la UI. El mensaje puede ser bilingue, pero el titulo/clave debe ser consistente.

---

## 6. Settings no incluye el panel avanzado `ReminderPreferencesPanel`

**Gravedad: Baja** -- El plan decia "ambos lugares" (Settings + Notifications). El panel avanzado esta en `/notifications` pero no en `/settings`. Solo estan los toggles simples de `NotificationPreferences`.

**Solucion**: Agregar `ReminderPreferencesPanel` como seccion adicional en `/settings`, debajo de `NotificationPreferences`, o reemplazar los toggles simples con el panel avanzado.

---

## 7. Falta invalidar `['unread-notifications-count']` en markAsRead/delete/clearAll

**Gravedad: Baja** -- Las mutaciones `markAsRead`, `deleteNotification` y `clearAllNotifications` en `Notifications.tsx` solo invalidan `['notifications']` pero no `['unread-notifications-count']`, por lo que el badge del menu no se actualiza inmediatamente.

**Solucion**: Agregar `queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })` a cada `onSuccess`.

---

## Plan de Cambios

### A. `src/hooks/data/useAutoReminders.ts`
1. Leer `repeat_frequency` de cada preferencia y usarlo para calcular el intervalo anti-duplicado real (once=infinito, daily=24h, weekly=168h)
2. Leer `preferred_hour` y solo generar si la hora actual coincide (tolerancia de +/- 1 hora)
3. Excluir notificaciones snoozed del chequeo de duplicados

### B. `src/components/tax-calendar/TaxDeadlineCards.tsx`
4. Usar claves fijas en ingles para los nombres de reminder (no depender del idioma actual)

### C. `src/pages/Notifications.tsx`
5. Agregar `conversion_reminder` a `REMINDER_TYPES` con icono y color
6. Agregar invalidacion de `['unread-notifications-count']` a markAsRead, deleteNotification, clearAll

### D. `src/pages/Settings.tsx`
7. Agregar `ReminderPreferencesPanel` debajo de `NotificationPreferences` para cumplir con "ambos lugares"

### E. `src/components/settings/NotificationPreferences.tsx`
8. Agregar nota informativa que enlace a la configuracion avanzada en `/notifications`

