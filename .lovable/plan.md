## Problema

En la vista de contratos, al abrir la previsualización:

1. El modal aparece **gigante y desplazado hacia abajo**: empieza a media pantalla y se extiende por debajo del borde inferior, dejando inaccesibles la esquina inferior (donde está el handle de redimensionado) y los botones del fondo.
2. El **PDF no se previsualiza** (panel izquierdo aparece gris vacío) aunque es un PDF normal.
3. El modal **no se puede mover** ni alcanzar la esquina para encogerlo, así que el usuario queda atrapado sin poder interactuar.

## Causas reales

- En `ContractDetailDialog.tsx` el panel izquierdo y derecho se montan dentro de un `ResizablePanelGroup` con `min-h-[70vh]`, y dentro del panel del PDF hay un contenedor con `min-h-[400px]` + flex column con `min-h-[60vh]`. La suma de mínimos **excede** el `max-h-[92vh]` del `DialogContent`, así que el grid crece por debajo del viewport.
- El `DialogContent` base usa `!top-1/2 !-translate-y-1/2` con `!important` (Radix), por lo que aun excediendo `max-h`, no se reposiciona y desborda hacia abajo.
- El iframe del PDF está dentro de un `flex-1` cuyo padre nunca recibe altura efectiva (porque el `ResizablePanel` no propaga altura a hijos sin `h-full` explícito en cada nivel). Resultado: el iframe se renderiza con altura 0 → **PDF en blanco**.
- El `.dialog-resizable` tenía `min-height: 320px` pero el contenido interno fuerza que el navegador ignore el `max-height` real, y como el handle está fuera de pantalla, el usuario no puede corregir el tamaño manualmente.

## Plan de corrección

### 1. `src/components/mobile/FullScreenDialog.tsx`
- Cambiar las clases de `size` para garantizar que el modal **nunca** exceda el viewport ni cuando es resizable:
  - Usar `top-[2vh]` + `translate-y-0` (override del centrado vertical) cuando `resizable` está activo, así el modal queda anclado arriba y el handle inferior siempre cae dentro de la pantalla.
  - Reducir `max-h` por defecto de `92vh` → `90vh` y aplicarlo también al contenedor interno.
- Asegurar que el área de contenido (`<div className="overflow-y-auto …">`) use `h-[calc(90vh-7rem)]` cuando es resizable, en lugar de `100%-6rem` que depende de un padre sin altura definida.
- Mantener `ResizeHandle` pero darle más tamaño táctil (24×24, posición `bottom-2 right-2`) para ser fácilmente alcanzable.

### 2. `src/index.css` — `.dialog-resizable`
- Quitar `min-height: 320px` (era demasiado bajo y conflictivo). Ajustar a:
  ```css
  .dialog-resizable {
    resize: both;
    overflow: hidden;     /* el scroll lo maneja el contenedor interno */
    min-width: 480px;
    min-height: 400px;
    max-width: 96vw;
    max-height: 90vh;
  }
  ```

### 3. `src/components/contracts/ContractDetailDialog.tsx`
- Eliminar el `min-h-[70vh]` del `ResizablePanelGroup` y los `min-h-[60vh]` / `min-h-[400px]` del panel de preview. Reemplazar con `h-full` puros y un único `min-h-0` en el flex parent para permitir que el iframe se ajuste al espacio disponible (técnica estándar de flex con altura).
- Envolver el iframe en un contenedor con `h-full w-full` y darle al iframe `style={{ height: '100%', width: '100%', minHeight: '60vh' }}` directamente; añadir `loading="lazy"` y `type="application/pdf"`. Esto soluciona el PDF en blanco.
- Para móvil, mantener el flujo apilado pero darle al preview una altura concreta (`h-[60vh]`) en vez de mínima, para que el iframe efectivamente renderice.

### 4. (Opcional pero recomendado) Botón "Abrir en pestaña nueva"
- Agregar un pequeño botón en el header del panel de preview que abra `previewUrl` en una pestaña nueva. Es el fallback universal cuando un PDF embebido falla por políticas del navegador (algunos navegadores bloquean iframes de signed URLs de Supabase).

## Resultado esperado

- El modal abre dentro del viewport, anclado a 2vh del borde superior, con el handle de redimensionado siempre visible y alcanzable.
- El PDF se renderiza correctamente porque el iframe ahora tiene altura efectiva propagada por la cadena flex.
- Si por algún motivo el iframe sigue fallando (CSP del navegador), el usuario tiene un botón de escape para abrirlo en pestaña nueva.

## Archivos a editar

- `src/components/mobile/FullScreenDialog.tsx`
- `src/components/contracts/ContractDetailDialog.tsx`
- `src/index.css`

## Verificación

Después de aplicar los cambios, abriré el preview con browser tools en viewport 1474×954 (el del usuario) para confirmar que el modal cabe entero, el PDF se ve, y el handle de la esquina es accesible.
