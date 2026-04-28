# Eliminar el microsegundo de flash restante en cambios de modo

## Causa raíz exacta

Después del fix anterior, queda un re-render visible porque `useDisplayPreferences` **sobrescribe el `ui_mode` de localStorage con `'unset'`** en varios caminos del fetch a Supabase:

En `src/hooks/data/useDisplayPreferences.ts`:

- **Línea 101 y 118 (manejo de error)**: `setPreferences(DEFAULT_DISPLAY_PREFERENCES)` — pierde el `ui_mode = 'simple'` de localStorage si Supabase falla o tarda.
- **Línea 109 (caso éxito)**: aunque hace merge, llama `setPreferences(merged)` siempre, incluso si el resultado es idéntico al estado actual → re-render innecesario y posible flash.
- **Toda la rama del fetch**: corre dentro de `useEffect` con `[user?.id]`. Cuando `AuthContext` aún está cargando, `user.id` cambia de `undefined` → valor real → dispara el fetch → `setPreferences` → otro render. Si en ese intermedio se pierde el `ui_mode`, hay flash.

## Solución

### Cambios en `src/hooks/data/useDisplayPreferences.ts` (`fetchPreferences`)

1. **Helper `withStoredMode(base)`** que SIEMPRE preserva el `ui_mode` de localStorage por encima de cualquier dato del servidor o defaults:
   ```ts
   const withStoredMode = (base) => ({
     ...DEFAULT_DISPLAY_PREFERENCES,
     ...base,
     ...(storedMode ? { ui_mode: storedMode } : {}),
   });
   ```

2. **Helper `applyIfChanged(next)`** que evita `setPreferences` cuando el resultado es estructuralmente idéntico al estado actual:
   ```ts
   const applyIfChanged = (next) => {
     const prev = preferencesRef.current;
     if (JSON.stringify(prev) === JSON.stringify(next)) {
       lastSavedRef.current = next;
       return;
     }
     setPreferences(next);
     lastSavedRef.current = next;
   };
   ```

3. **Reemplazar las 4 ramas** (`!user.id`, `error`, `data`, `else`, `catch`) para que TODAS usen `applyIfChanged(withStoredMode(...))`. Así en ningún caso se "rompe" el `ui_mode` ya correcto.

### Resultado

- En visitas recurrentes (caso 99%): el primer render ya tiene `uiMode='simple'` (gracias al fix anterior). Cuando llega Supabase, `applyIfChanged` detecta que el `ui_mode` no cambió y **no dispara re-render** → cero flash.
- Si Supabase falla o el usuario aún no está cargado: el `ui_mode` se mantiene en `'simple'` en lugar de revertir a `'unset'`.
- Si el servidor tiene un `ui_mode` distinto al de localStorage: localStorage gana, manteniendo consistencia con la UI ya pintada.

## Archivo a modificar

- `src/hooks/data/useDisplayPreferences.ts` — refactor de la función `fetchPreferences` (líneas 81-126).

No se tocan páginas, componentes ni el resto del hook.
