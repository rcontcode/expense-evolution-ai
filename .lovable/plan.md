

# Auditoria de Lanzamiento: Landing Page y Asistente Financiero

## Estado General: NO listo para lanzamiento

Se encontraron **8 problemas** que deben corregirse antes del lanzamiento.

---

## LANDING PAGE - 4 Problemas

### 1. LiveSocialProof y UrgencyBanner nunca se integraron
Los componentes `LiveSocialProof.tsx` y `UrgencyBanner.tsx` fueron creados en `src/components/landing/` pero **nunca se importaron ni se usaron** en `Landing.tsx`. Son componentes de conversion criticos para el lanzamiento.

**Correccion**: Importar e integrar ambos componentes:
- `LiveSocialProof` debajo del hero section (despues de los CTAs)
- `UrgencyBanner variant="banner"` antes de la seccion de pricing

### 2. Footer expone URLs de Supabase directamente
Las lineas 1668-1703 del footer tienen links directos a `supabase.com/security`, `supabase.com/privacy`, etc. Esto rompe la regla de abstraer la infraestructura y expone al usuario la tecnologia subyacente.

**Correccion**: Cambiar los textos a "Certificacion de Infraestructura", "Seguridad de Datos" sin mencionar Supabase, y apuntar los links a paginas genericas o eliminarlos.

### 3. Precios en USD hardcodeados
Los precios ($6.99, $14.99) estan en dolares americanos sin indicar la moneda. Para usuarios en Chile o Canada, esto es confuso.

**Correccion**: Agregar "USD" despues de los precios, o detectar pais del usuario para mostrar precios localizados.

### 4. Falta seccion de Presupuesto Familiar en features
La landing menciona 12 herramientas pero no incluye el Presupuesto Familiar (`/budget`), que es una funcionalidad principal de la app. Tampoco se menciona el Centro de Pagos ni las Metas de Ahorro.

**Correccion**: Agregar "Presupuesto Familiar" y "Centro de Pagos" a la lista de features, reemplazando o complementando items existentes.

---

## ASISTENTE FINANCIERO (app-assistant) - 4 Problemas

### 5. Rutas faltantes en AVAILABLE_ROUTES
El asistente NO conoce estas rutas, por lo que no puede navegar a ellas:
- `/budget` - Presupuesto Familiar (seccion principal del bottom nav)
- `/bills` - Centro de Pagos
- `/savings` - Metas de Ahorro
- `/analytics` - Analytics (si existe como ruta separada)

**Correccion**: Agregar las rutas faltantes al objeto `AVAILABLE_ROUTES` en el edge function.

### 6. System prompt no menciona el modulo de Presupuesto
La seccion "CONOCIMIENTO COMPLETO DE LA APLICACION" del system prompt no incluye informacion sobre:
- Presupuesto Familiar (Budget) - limites por categoria, health score, ritmo de gasto
- Centro de Pagos (Bills) - pagos fijos, cuentas recurrentes
- Metas de Ahorro (Savings Goals) - tracking de objetivos financieros

El asistente no puede explicar ni guiar al usuario en estas secciones.

**Correccion**: Agregar secciones de conocimiento para Budget, Bills y Savings al system prompt.

### 7. highlight_ui no tiene IDs para Budget/Bills
La lista de `elements` disponibles en la tool `highlight_ui` no incluye IDs para elementos del presupuesto familiar ni del centro de pagos.

**Correccion**: Agregar IDs como `budget-categories`, `budget-health`, `bills-list`, `add-bill-button`, `savings-goals-list` a la descripcion del parametro `elements`.

### 8. Ejemplos de voz no cubren presupuesto
Los ejemplos de comandos de voz en el system prompt no incluyen:
- "Cuanto me queda de presupuesto?"
- "Lleva me al presupuesto"
- "Cuales son mis pagos fijos?"
- "Como va mi meta de ahorro?"

**Correccion**: Agregar ejemplos de comandos para budget, bills y savings.

---

## Plan de Implementacion

### Archivos a modificar: 2

1. **`src/pages/Landing.tsx`**:
   - Importar LiveSocialProof y UrgencyBanner
   - Integrar LiveSocialProof despues del hero
   - Integrar UrgencyBanner antes de pricing
   - Limpiar URLs de Supabase del footer
   - Agregar "USD" a precios
   - Agregar Budget/Bills a features

2. **`supabase/functions/app-assistant/index.ts`**:
   - Agregar rutas: budget, bills, savings
   - Agregar conocimiento de Budget, Bills, Savings al system prompt
   - Agregar IDs de highlight para Budget/Bills
   - Agregar ejemplos de comandos de voz para presupuesto

---

## Resumen

| Area | Problema | Severidad |
|------|----------|-----------|
| Landing | LiveSocialProof/UrgencyBanner no integrados | Alta |
| Landing | URLs de Supabase expuestas en footer | Media |
| Landing | Precios sin indicar moneda | Media |
| Landing | Falta Budget en features | Media |
| Asistente | Rutas budget/bills/savings faltantes | Alta |
| Asistente | System prompt sin conocimiento de Budget | Alta |
| Asistente | highlight_ui sin IDs de Budget | Media |
| Asistente | Sin ejemplos de voz para presupuesto | Baja |

**Despues de estas correcciones, la app estara lista para lanzamiento beta.**

