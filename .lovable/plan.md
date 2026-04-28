# Eliminar el flash "Modo Avanzado → Simple" al cargar páginas

## Problema confirmado

Al entrar a cualquier página (Bills, Banking, Budget, Dashboard) en Modo Simple, durante ~300-500ms se ve la versión **Avanzada** y luego salta a la **Simple**. Parece un error visual.

## Causa raíz

1. `useDisplayPreferences` arranca con `ui_mode = 'unset'` (default) y luego **dentro de un `useEffect` asíncrono** consulta Supabase y/o `localStorage`.
2. En el primer render, las páginas evalúan `if (uiMode === 'simple')`. Como aún es `'unset'`, cae al `return <VersiónAvanzada />`.
3. Cuando llega el valor real (`'simple'`), React re-renderiza la simple → flash visible.
4. `Bills.tsx`, `Banking.tsx`, `Budget.tsx` **no usan `isLoading`** del hook, así que no pueden esperar.
5. Aunque el hook ya guarda `ui_mode` en `localStorage` (clave `evofinz-ui-mode`), no lo usa en la **inicialización síncrona** del `useState` — sólo dentro del `useEffect`.

## Solución

### 1. Inicialización síncrona desde `localStorage` (`src/hooks/data/useDisplayPreferences.ts`)

Cambiar el `useState` inicial para leer `localStorage` antes del primer render, evitando el `'unset'` transitorio:

```ts
const [preferences, setPreferences] = useState<DisplayPreferences>(() => {
  const storedMode = getStoredUiMode();
  return storedMode
    ? { ...DEFAULT_DISPLAY_PREFERENCES, ui_mode: storedMode }
    : DEFAULT_DISPLAY_PREFERENCES;
});
```

Esto garantiza que en cualquier visita posterior (donde ya elegimos modo Simple), el primer render tenga `uiMode = 'simple'` desde el inicio.

### 2. Marcar `isLoading = false` cuando ya hay valor de `localStorage`

Si tenemos un `ui_mode` en localStorage, no necesitamos esperar a Supabase para decidir qué versión renderizar. La consulta a Supabase puede seguir en background y rehidratar el resto de preferencias sin causar flash, porque `ui_mode` ya está correcto.

```ts
const [isLoading, setIsLoading] = useState(() => getStoredUiMode() === null);
```

### 3. Defensa en las páginas que ramifican por `uiMode`

En `Bills.tsx`, `Banking.tsx`, `Budget.tsx` (y verificar otros), respetar `isLoading` antes de elegir variante. Mientras carga y `uiMode === 'unset'`, mostrar un placeholder ligero (skeleton del Layout) en vez de adivinar:

```tsx
const { uiMode, isLoading } = useDisplayPreferences();
if (isLoading && uiMode === 'unset') {
  return <Layout><div className="page-container" /></Layout>;
}
if (uiMode === 'simple' && sp.get('advanced') !== '1') return <SimpleBills/>;
return <BillsAdvanced/>;
```

Con el cambio (1), esta rama de espera solo se activará en la **primera visita absoluta** del usuario (cuando aún no hay valor en localStorage), que es cuando sí tiene sentido esperar al servidor.

### 4. Verificar `Dashboard.tsx`

`Dashboard.tsx` ya usa `prefsLoading`, así que solo se beneficia del cambio (1) — ya no necesita esperar en visitas recurrentes.

## Archivos a modificar

- `src/hooks/data/useDisplayPreferences.ts` — inicialización síncrona desde localStorage + `isLoading` inicial condicional.
- `src/pages/Bills.tsx` — respetar `isLoading` antes de elegir variante.
- `src/pages/Banking.tsx` — mismo patrón.
- `src/pages/Budget.tsx` — mismo patrón.
- (Revisar) `src/components/dashboard/DashboardNavigator.tsx` y otros lugares que ramifican por `uiMode` sin chequear `isLoading`.

## Resultado esperado

- En visitas posteriores (caso 99%): el primer render ya muestra la versión Simple correctamente. Sin flash.
- En la primera visita absoluta: muestra un contenedor vacío durante ~300ms en vez del flash de la versión equivocada.
