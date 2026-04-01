

# Plan: Agregar selector de idioma y tema en PageHeader global

## Archivos a modificar

### 1. `src/components/PageHeader.tsx`
- Importar `useTheme` de `@/contexts/ThemeContext`, `LanguageSelector` de `@/components/LanguageSelector`, y `Sun`/`Moon` de `lucide-react`
- Crear un grupo de controles `GlobalControls` que contenga:
  - `<LanguageSelector />` (componente existente, botón ghost icon)
  - Botón Sun/Moon toggle: `variant="ghost" size="icon"`, al hacer click alterna entre `light` y `dark` (si `resolvedMode === 'dark'` muestra Sun, si no Moon)
- **Desktop**: Renderizar `GlobalControls` después de `{children}` en el bloque de título
- **Mobile**: Renderizar `GlobalControls` después de `{children}` en el contenedor `shrink-0`

### 2. `src/pages/UserGuide.tsx`
- Quitar import de `LanguageSelector` (línea 17)
- Quitar `<LanguageSelector />` del children del PageHeader (línea 74)

## Detalle técnico
- El toggle de tema usará `setMode(resolvedMode === 'dark' ? 'light' : 'dark')` para alternar directamente
- Los controles son compactos (`h-8 w-8`) y se renderizan con `gap-1` entre ellos

