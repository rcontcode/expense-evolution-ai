## Plan: 3 mejoras al Modo Simple

### Hallazgo importante (buena noticia)

Al revisar el código, **la persistencia del onboarding YA funciona correctamente**. El componente `SimpleOnboardingPath` consulta datos reales:

```ts
const { data: profile }       = useProfile();
const { data: clients }       = useClients();
const { data: contracts }     = useContracts();
const { data: fiscalEntities } = useFiscalEntities();
```

Si tienes ≥1 cliente, ese paso queda permanentemente check. Si recargas, se mantiene. **No necesita columna `onboarding_progress` en BD** — la fuente de verdad son los datos mismos. Esto es lo correcto.

Lo que sí podemos pulir:

---

### 1. Pulir el onboarding (sin tocar BD)

**Problema menor**: el detector `hasFiscal` requiere `country` + (`tax_regime` OR `business_number`) + (entidad fiscal OR `business_name`). Es estricto. Un usuario que solo puso país queda en "no completo" sin saber qué falta.

**Cambios**:

a) **Tooltip / texto secundario** que muestre qué falta exactamente:
```
"Datos fiscales — Falta: régimen fiscal"
```

b) **Quick-add inline también en "Contratos"** (igual que en "Clientes"). Hoy el step de Contratos solo navega; agregaremos botón `+ Agregar` que abra el `ContractDialog` directo.

c) **Mensaje de éxito** cuando completas los 3: una tarjeta verde "¡Listo! Tu cuenta está configurada" con botón para ocultarla permanentemente (vía localStorage `simple_onboarding_dismissed`).

**Archivo**: `src/components/dashboard/SimpleOnboardingPath.tsx`

---

### 2. Toggle Simple/Avanzado: ubicación canónica

**Problema actual**: 4 ubicaciones del toggle:
1. Header desktop (línea 881 Layout.tsx)
2. Header mobile compact (línea 552 Layout.tsx) — `hidden xs:inline-flex`
3. Sidebar mobile sheet (línea 600 Layout.tsx)
4. Inicio del MobileDashboard (que agregué la última vez)

Son demasiadas. **Decisión**:

- ✅ **Mantener**: Header desktop (siempre visible) + Header mobile compact (siempre visible)
- ❌ **Quitar**: el del MobileDashboard (línea 161) — duplicado con el del header
- ❌ **Quitar**: el del sidebar sheet — ya no necesario porque el del header mobile siempre es visible

Resultado: 1 toggle visible permanente en cada viewport (header). Limpio y predecible.

**Verificación**: confirmar que `UiModeToggle compact` cabe en mobile a 320px (xs breakpoint).

**Archivos**:
- `src/components/dashboard/MobileDashboard.tsx` (eliminar bloque toggle agregado)
- `src/components/Layout.tsx` (eliminar bloque sidebar lines 595-601, ajustar `hidden xs:inline-flex` → `inline-flex` para garantizar visibilidad incluso a 320px)

---

### 3. "Ver todo" en movimientos: arreglar destino

**Problema actual** (`SimpleDashboard.tsx` línea 231):
```tsx
<Button onClick={() => navigate('/expenses')}>Ver todo</Button>
```
Pero la lista mezcla **gastos + ingresos**. Llevar solo a `/expenses` confunde — el usuario no encuentra los ingresos que vio.

**Cambios**:

a) Crear menú contextual al click de "Ver todo" con 2 opciones:
   - "Ver gastos" → `/expenses`
   - "Ver ingresos" → `/income`

   Implementación: `DropdownMenu` de shadcn (ya disponible).

b) Alternativa más simple si prefieres: cambiar el botón único por dos pequeños chips:
```
[Gastos →] [Ingresos →]
```

Voy con la **opción b (chips)** — más visual, un click menos, encaja mejor con la estética "3D candy".

**Archivo**: `src/components/dashboard/SimpleDashboard.tsx` (líneas 227-235)

---

### Orden de ejecución

1. Limpiar toggles duplicados (cambio quirúrgico, bajo riesgo)
2. Arreglar "Ver todo" → chips Gastos/Ingresos
3. Pulir onboarding: quick-add Contratos + texto "qué falta" + estado completado dismissible

### Archivos a editar

- `src/components/Layout.tsx` (quitar 1 toggle del sidebar, ajustar visibilidad header mobile)
- `src/components/dashboard/MobileDashboard.tsx` (quitar bloque toggle duplicado)
- `src/components/dashboard/SimpleDashboard.tsx` (chips Gastos/Ingresos en lugar de "Ver todo")
- `src/components/dashboard/SimpleOnboardingPath.tsx` (quick-add Contratos + qué falta + completado dismissible)

### Sin cambios en BD

No se requieren migraciones ni nuevas columnas. La detección por datos reales ya funciona y es la arquitectura correcta.

### Lo que NO hago (por decisión consciente)

- **No agrego columna `onboarding_progress`** — los datos reales son la verdad; una columna paralela se desincroniza.
- **No hago tour guiado** — pediste los 3, no más.
- **No agrego mini-gráfico de tendencia** — fuera de scope.
