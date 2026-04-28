## Mejoras al Dashboard Mobile

### Problemas detectados en tu screenshot

1. **Barra horizontal visible** debajo de los tabs Resumen/Año/Acciones/Sistema — el `scrollbar-hide` de Tailwind no se aplica en algunos browsers.
2. **Sigues en Modo Avanzado** (BD confirma `ui_mode = "advanced"`) — por eso ves los tabs en vez del SimpleDashboard limpio.
3. **El toggle Simple/Avanzado solo está en el menú lateral** — no se ve directo en mobile, hay que abrir el sheet.

---

### Cambios propuestos

#### 1. Eliminar barra de scroll horizontal (real, no parche)

`src/components/mobile/MobileTabLayout.tsx` — Reemplazar el div con `overflow-x-auto` por estilos inline que garantizan ocultar la scrollbar en TODOS los browsers (Chrome, Safari, Firefox, IE):

```tsx
style={{
  scrollbarWidth: 'none',       // Firefox
  msOverflowStyle: 'none',       // IE/Edge legacy
  WebkitOverflowScrolling: 'touch',
}}
```
+ tag `<style>` inline con `::-webkit-scrollbar { display: none !important; }` con scope al `.mobile-tab-layout`.

#### 2. Toggle Simple/Avanzado prominente en MobileDashboard

`src/components/dashboard/MobileDashboard.tsx` — Insertar un mini-banner arriba de todo (antes de `<LiveClock />`) que muestre:

```
┌──────────────────────────────────────┐
│  Vista actual:  [Simple] [Avanzado] │
└──────────────────────────────────────┘
```

Usa el `<UiModeToggle />` ya existente (segmented control). Pequeño pero siempre visible.

#### 3. Forzar tu cuenta a Modo Simple

Update directo a tu perfil (`Rudy`) en BD: `ui_mode = "simple"`. Así al recargar verás el SimpleDashboard inmediatamente y podrás comparar.

---

### Sobre tu pregunta del gráfico mes/año en Simple

**No, el gráfico mes/año NO va en Simple Mode.**

Simple Mode = ultra-minimalista. Su propósito es:
- Saludo
- Onboarding pendiente
- Balance del mes (solo número grande + barra de progreso)
- 3 acciones grandes (Gasto / Ingreso / Capturar)
- 2 atajos (Presupuesto / Banco)
- 8 movimientos recientes
- 1 tip de educación financiera

El gráfico anual (timeline de 12 meses) es **valor de Modo Avanzado**. Si lo agregamos a Simple, deja de ser simple.

Si quieres que el usuario en Simple **vea tendencia**, podemos agregar una **mini-barra horizontal de 6 meses** (no full chart) — pero solo si lo pides explícito.

---

### Archivos a modificar

- `src/components/mobile/MobileTabLayout.tsx` — fix scrollbar
- `src/components/dashboard/MobileDashboard.tsx` — agregar toggle visible arriba
- BD: update `profiles.display_preferences.ui_mode = 'simple'` para tu user

---

### Resultado esperado

- Sin barra horizontal feo en ningún tab.
- Toggle Simple/Avanzado visible siempre al abrir el dashboard mobile.
- Tu cuenta en Simple, podrás comparar al instante.
