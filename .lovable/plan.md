

## Plan: Precios Unificados, Limpios y Basados en Valor

### Situacion actual (el desorden)

```text
                    EvoFinz         Fokuspark       ¿Match?
Free                $0              $0              ✅
Premium mensual     $6.99           $7.99           ❌ DIFERENTE
Premium anual       $5.59/mo        $6.39/mo        ❌ DIFERENTE
Pro mensual         $14.99          $14.99          ✅
Pro anual           $11.99/mo       $11.99/mo       ✅
Bundle mensual      $14.99          $14.99          ✅ pero = Pro
Bundle anual        $9.99/mo        $9.99/mo        ✅ pero 33% off
```

Problemas: Premium no coincide entre apps, Bundle cuesta igual o menos que Pro, strikethroughs y "savings" por todos lados.

### Precios nuevos (ambas apps identicos)

```text
Plan             Mensual      Anual (/mes)     Anual total
Free             $0           —                —
Premium          $7.99        $6.49            $77.88
Pro              $14.99       $11.99           $143.88
Bundle           $19.99       $15.99           $191.88
```

Logica:
- **Premium a $7.99**: Subir EvoFinz de $6.99 a $7.99 (igualar a Fokuspark, mejor margen, numero mas limpio)
- **Pro se mantiene**: $14.99 ya funciona en ambas
- **Bundle a $19.99**: Mayor que Pro como pediste. Menor que comprar 2 Pro ($29.98). Refleja el valor de acceso a 2 apps completas
- **Descuento anual 20% uniforme**: Sin excepciones, sin "33% OFF"
- **Cero marketing noise**: Sin strikethroughs, sin "Ahorras $X", sin badges "-20% OFF", sin "2 apps por el precio de 1"

### Cambios en EvoFinz (este proyecto)

**1. `src/hooks/data/useSubscription.ts`**
- `premium_monthly: 6.99` → `7.99`
- `premium_annual: 67.08` → `77.88`
- `bundle_monthly: 14.99` → `19.99`
- `bundle_annual: 119.90` → `191.88`
- Actualizar Price IDs de Premium y Bundle (nuevos precios en Stripe)

**2. `src/pages/Landing.tsx`**
- `monthlyPrice: 6.99` (Premium) → `7.99`
- `monthlyPrice: 14.99` (Bundle) → `19.99`
- `getPrice()`: eliminar toda logica de `strikethrough` y `savings` — retornar strings vacios siempre
- Eliminar badge "-20% OFF" del toggle anual
- Eliminar renderizado de strikethrough y savings en las cards
- Actualizar precios en sticky bar y Quick Pricing Preview ($6.99 → $7.99, Bundle $14.99/$9.99 → $19.99/$15.99)

**3. `src/components/settings/SubscriptionManager.tsx`**
- Premium price: `'$6.99'` → `'$7.99'`, priceAnnual: `'$5.59'` → `'$6.49'`
- Bundle price: `'$14.99'` → `'$19.99'`, priceAnnual: `'$9.99'` → `'$15.99'`
- Eliminar feature "33% savings vs separate plans"
- Eliminar "2 apps por el precio de 1"

**4. Stripe: Crear nuevos Price IDs**
- Premium Monthly: $7.99/mo (EvoFinz actualmente tiene $6.99)
- Premium Annual: $77.88/yr
- Bundle Monthly: $19.99/mo (reemplaza $14.99)
- Bundle Annual: $191.88/yr (reemplaza $119.90)

**5. `supabase/functions/create-checkout/index.ts`**
- Actualizar `PRICE_IDS` con los 4 nuevos Price IDs
- Actualizar descriptions: quitar "Ahorra 33%", "Ahorra 20%", poner descripciones limpias de valor
- `custom_text.submit.message`: quitar referencia a porcentajes de ahorro

**6. `supabase/functions/check-subscription/index.ts` y `stripe-webhook/index.ts`**
- Actualizar Product IDs del Bundle si se crean nuevos productos (solo si cambian)

**7. `src/components/PlanUsageCard.tsx`**
- Verificar que refleje los precios correctos (usa hooks, deberia actualizarse solo)

**8. `src/test/integration/subscription.test.ts`**
- Actualizar assertions de precios

**9. `.lovable/plan.md`**
- Documentar la nueva filosofia de precios unificados

### Cambios necesarios en Fokuspark (proyecto separado)

**`src/pages/PricingPage.tsx`**:
- Bundle: `monthlyPrice: '$14.99'` → `'$19.99'`, `annualPrice: '$9.99'` → `'$15.99'`, `annualTotal: '$119.90'` → `'$191.88'`
- Eliminar `strikethroughMonthly`, `strikethroughAnnual`, `savings: '$100+'`
- Eliminar feature "2 apps, 1 precio"
- Crear nuevos Stripe Price IDs en cuenta Fokuspark ($19.99/mo y $191.88/yr)
- Actualizar `PRICE_IDS.bundle_monthly` y `bundle_annual`
- Eliminar savings/strikethrough de todos los demas planes tambien

**`src/components/AICreditsExhaustedDialog.tsx`** y otros componentes que muestren precios hardcodeados de $7.99

