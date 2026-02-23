

# Mejoras al Sistema de Recordatorios

## Problemas Detectados

### 1. Mensajes solo en espanol (no bilingue)
Los mensajes de notificacion en `useAutoReminders` estan hardcodeados en espanol ("Vence en X dia(s)", "Proximo vencimiento"). Deberian respetar el idioma del usuario.

### 2. Bills query no filtra por user_id
En `checkBillReminders()`, la query a `recurring_bills` filtra por `status = 'active'` pero **no filtra por `user_id`**. Esto significa que si RLS no estuviera activo, mostraria bills de otros usuarios. Es buena practica agregar `.eq('user_id', userId)` como defensa en profundidad.

### 3. Contracts query no filtra por user_id
Mismo problema en `checkContractReminders()` -- no filtra por `user_id` explicitamente.

### 4. Estado de "Recordatorio Activo" no persiste entre sesiones
En `TaxDeadlineCards`, `activeReminders` es un `useState` local. Si el usuario recarga la pagina, pierde el estado visual de cuales recordatorios ya activo. Deberia consultar la tabla `notifications` al montar para saber cuales ya existen.

### 5. F29 (Chile) no tiene boton de recordatorio
La card de F29 no tiene boton "Recordatorio" como si lo tienen F22 y APV.

### 6. Notificaciones de presupuesto no invalidan el cache de React Query
Cuando `useAutoReminders` inserta notificaciones, no llama `queryClient.invalidateQueries` para actualizar el badge de notificaciones no leidas. Solo `TaxDeadlineCards` lo hace.

### 7. No hay manejo de errores visible para el usuario
Si alguna de las 4 verificaciones falla silenciosamente (error de red, RLS, etc.), el usuario nunca lo sabe. Al menos deberia loguearse de forma mas detallada.

### 8. Bills vencidos (dias negativos) no generan alerta
Si `daysUntilDue < 0`, el bill ya esta vencido y no se genera ninguna notificacion. Deberia alertar tambien cuando un bill esta vencido y no pagado.

---

## Plan de Cambios

### A. `src/hooks/data/useAutoReminders.ts`
- Agregar soporte bilingue: recibir el idioma del contexto y usarlo en los mensajes
- Agregar `.eq('user_id', userId)` a las queries de bills y contracts
- Incluir alertas para bills vencidos (daysUntil < 0, hasta -7 dias)
- Invalidar cache de `['unread-notifications-count']` y `['notifications']` despues de insertar

### B. `src/components/tax-calendar/TaxDeadlineCards.tsx`
- Consultar `notifications` al montar para pre-llenar `activeReminders` con recordatorios ya existentes
- Agregar boton de recordatorio al F29 (Chile)
- Hacer mensajes bilingues en los botones que faltan

### C. Mejoras menores
- Agregar `console.warn` con detalle cuando una verificacion individual falla (dentro de `Promise.allSettled`)
- Documentar en comentarios la logica de anti-duplicados

---

## Detalles Tecnicos

**Bilingue en useAutoReminders:**
El hook no tiene acceso a `useLanguage()` facilmente sin reestructurar. La solucion es guardar el idioma en la notificacion usando un formato neutral y que la UI de notificaciones traduzca, O pasar el idioma como parametro.

Opcion mas simple: usar `useLanguage()` directamente en el hook (ya esta en un componente React via Layout) y condicionar los strings.

**Persistir activeReminders:**
Al montar `TaxDeadlineCards`, hacer un `useEffect` que consulte:
```
SELECT title FROM notifications 
WHERE user_id = ? AND type = 'tax_reminder' 
AND created_at > (now - 30 days)
```
Y extraer los nombres de deadlines del titulo para pre-llenar el Set.

**Invalidar cache:**
Agregar `useQueryClient()` al hook y llamar `invalidateQueries` despues de cada `insertNotification`.
