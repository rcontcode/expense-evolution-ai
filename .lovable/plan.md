## Implementación aditiva (sin eliminar nada)

Regla de oro: **NO eliminar** temas visuales, modos, ni componentes actuales. Sólo añadir capas nuevas opcionales.

### 1. Sistema de texturas de superficie (nuevo, opcional)
- **Crear** `src/config/surfaceTextures.ts` — portado tal cual de Fokuspark (7 texturas CSS puras: Liso, Cuadrícula, Punteado, Lino, Denim, Caliza, Kraft).
- **Crear** `src/hooks/useSurfaceTexture.ts` — persiste en `localStorage` (`evofinz.surfaceTexture`), aplica `--surface-texture` y `--surface-texture-size` al `<body>`. Default: `none` (no cambia nada hasta que el usuario elija).
- **Modificar** `src/index.css` — añadir AL FINAL una regla que use las CSS vars sólo si están definidas:
  ```css
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: var(--surface-texture, none);
    background-size: var(--surface-texture-size, auto);
    pointer-events: none; z-index: 0; opacity: 1;
  }
  ```
  Así no toca el background existente, sólo añade una capa encima del fondo y debajo del contenido (`z-index: 0` con el resto del app en stacking contexts superiores).
- **Crear** `src/components/settings/SurfaceTextureSelector.tsx` — grid visual de previews con el patrón actual de la app (3D candy, scale 1.04 hover).
- **Montar** el hook en `src/App.tsx` (un `<SurfaceTextureMount />` invisible) para que la preferencia se aplique al cargar.

### 2. Experience Mode Switcher (nuevo, opcional, encima del toggle existente)
- **Crear** `src/hooks/useExperienceMode.ts` — 3 presets ("Tranquilo", "Equilibrado", "Pro") que aplican combinaciones de: `uiMode` + textura + (futuro) animaciones/sonidos. Persiste en `localStorage`.
- **Crear** `src/components/layout/ExperienceModeSwitcher.tsx` — dropdown estilo Fokuspark.
- **NO TOCAR** `UiModeToggle.tsx` ni `UiModeWelcomeDialog.tsx` — siguen funcionando igual. El nuevo switcher es complementario y opcional.

### 3. Mejoras al Modo Simple (aditivas, sin romper nada)
- **Modificar** `src/components/dashboard/SimpleModePageBanner.tsx` — añadir botón "X" para descartar (persiste en `localStorage`). NO eliminar el banner, sólo hacerlo dismissible.
- **Modificar** `src/components/simple/SimpleSettings.tsx` — AÑADIR (no quitar) tarjeta de Apariencia con `SurfaceTextureSelector` compacto y toggle de tema claro/oscuro. Las tarjetas existentes (Idioma, Modo, Más ajustes, Cerrar sesión) quedan intactas.
- **Modificar** `src/pages/Settings.tsx` — añadir nueva sección "Apariencia" con el selector completo de texturas + Experience Mode. No tocar las secciones existentes.

### 4. Nada más se elimina
- `SimpleBanking`, `SimpleBills`, `SimpleExpenses`, `SimpleClients`, `SimpleIncome`, `SimpleReports` quedan exactamente como están.
- `Layout.tsx` no se toca (la nav inferior sigue igual).
- Los temas, presets de color, gradients y demás no se tocan.

## Archivos NUEVOS
1. `src/config/surfaceTextures.ts`
2. `src/hooks/useSurfaceTexture.ts`
3. `src/components/settings/SurfaceTextureSelector.tsx`
4. `src/components/settings/SurfaceTextureMount.tsx` (componente vacío que sólo activa el hook)
5. `src/hooks/useExperienceMode.ts`
6. `src/components/layout/ExperienceModeSwitcher.tsx`

## Archivos MODIFICADOS (sólo añadiendo)
1. `src/index.css` — append de las CSS vars + regla `body::before`
2. `src/App.tsx` — montar `<SurfaceTextureMount />`
3. `src/components/simple/SimpleSettings.tsx` — añadir tarjeta Apariencia
4. `src/components/dashboard/SimpleModePageBanner.tsx` — añadir botón dismiss
5. `src/pages/Settings.tsx` — añadir sección Apariencia

## QA
- Verificar visualmente cada textura en preview (capturar screenshots).
- Confirmar que con textura "none" (default) la app se ve **idéntica** a hoy.
- Confirmar que el toggle Simple/Avanzado original sigue funcionando.