

# Auditoría Legal Fiscal: ¿Estamos Protegidos en Chile y Canadá?

## Veredicto General: ESTAMOS BIEN PROTEGIDOS (8/10)

La app tiene una cobertura legal sólida. Hay disclaimers en los lugares correctos, páginas legales completas (Legal, Terms, Privacy), y el componente `LegalDisclaimer` se usa en **14 archivos** con 4 variantes (tax, investment, education, general). Sin embargo, hay **5 gaps específicos** que cerrar para estar al 100%.

---

## Lo que YA tenemos (bien hecho)

| Protección | Estado | Dónde |
|---|---|---|
| Disclaimer "no somos asesores" | ✅ | Legal.tsx, Terms.tsx sección 2 y 8 |
| Disclaimer IA puede tener errores | ✅ | Legal.tsx sección AI |
| Tax estimates son aproximadas | ✅ | LegalDisclaimer variant="tax" en TaxEstimator, TaxOptimizer |
| Investment projections hipotéticas | ✅ | LegalDisclaimer variant="investment" en FIRE, RRSP/TFSA |
| Links oficiales a CRA y SII | ✅ | Legal.tsx, TaxResources |
| Fair Use + no afiliación autores | ✅ | Legal.tsx footer, Mentorship.tsx disclaimer |
| Edad mínima 18 años | ✅ | Legal.tsx |
| Datos pertenecen al usuario | ✅ | Terms.tsx sección 5 |
| Limitación de responsabilidad | ✅ | Terms.tsx sección 8 |
| Contenido educativo disclaimer | ✅ | LegalDisclaimer variant="education" en 8 componentes de mentoría |

## Gaps Encontrados (5 mejoras necesarias)

### Gap 1: Regulación específica de Chile — Ley 18.045 y CMF
**Riesgo**: En Chile, la CMF (Comisión para el Mercado Financiero) regula quién puede dar "asesoría financiera". Nuestro disclaimer dice "no somos asesores" pero no menciona explícitamente la ley chilena.
**Fix**: Agregar en Legal.tsx sección tax: "En Chile, conforme a la Ley 18.045, esta herramienta NO constituye asesoría de inversiones regulada por la CMF."

### Gap 2: Regulación de Canadá — Securities Act
**Riesgo**: En Canadá, las provincias regulan quién puede dar investment advice (OSC en Ontario, BCSC en BC, etc.). El RRSP/TFSA optimizer da "recomendaciones" de cuánto contribuir.
**Fix**: Agregar disclaimer específico: "This tool does not provide securities advice as defined by provincial securities legislation. Consult a licensed financial advisor."

### Gap 3: Edge Functions sin disclaimer en respuesta
**Riesgo**: `optimize-taxes`, `optimize-rrsp-tfsa`, `optimize-apv-chile` devuelven recomendaciones JSON pero **no incluyen un campo `disclaimer`** en la respuesta. Si alguien consume la API directamente, no hay protección.
**Fix**: Agregar `disclaimer: string` al response JSON de las 3 edge functions.

### Gap 4: TaxSituationWizard calcula impuestos sin disclaimer visible
**Riesgo**: El wizard calcula impuestos estimados y muestra resultados. Tiene un disclaimer al final pero **no antes de mostrar los números**, lo que podría dar la impresión de exactitud.
**Fix**: Agregar `LegalDisclaimer variant="tax" size="compact"` justo arriba de los resultados calculados en el wizard.

### Gap 5: Mileage rates hardcodeados sin fecha de vigencia visible
**Riesgo**: `CRA_RATE_2024 = 0.70` y `SII_RATE = 0.15` están hardcodeados. Si las tasas cambian y no actualizamos, el usuario podría usar tasas incorrectas para su declaración.
**Fix**: Mostrar badge visible "Tasas 2024" junto a los rates en MileageDeductionMaximizer y MileageForm, con nota de verificar con fuente oficial.

---

## Plan de Implementación

### Paso 1: Legal.tsx — Agregar secciones regulatorias por país
- En sección "Información Fiscal", agregar subsección con:
  - **Chile**: referencia a Ley 18.045, CMF, y que no somos entidad regulada
  - **Canadá**: referencia a provincial securities acts, OSC, y que no somos licensed advisors
  - Ambos: "Las tasas y reglas fiscales se actualizan periódicamente pero pueden no reflejar cambios legislativos recientes"

### Paso 2: Edge Functions — Agregar disclaimer en response JSON
- `optimize-taxes/index.ts`: agregar campo `disclaimer` al JSON de respuesta
- `optimize-rrsp-tfsa/index.ts`: agregar campo `disclaimer` al JSON de respuesta
- `optimize-apv-chile/index.ts`: agregar campo `disclaimer` al JSON de respuesta

### Paso 3: TaxSituationWizard — Disclaimer antes de resultados
- Agregar `LegalDisclaimer variant="tax" size="compact"` justo antes del bloque de resultados calculados

### Paso 4: Mileage — Badge de vigencia de tasas
- En `MileageDeductionMaximizer.tsx`: agregar badge "CRA 2024" con tooltip que diga verificar en canada.ca
- En `MileageForm.tsx`: agregar nota de vigencia junto al rate display

### Paso 5: Terms.tsx — Ley aplicable multi-jurisdicción
- Sección 9 actualmente dice solo "leyes de Canadá". Actualizar para cubrir usuarios chilenos: "Para usuarios en Chile, se aplicarán las leyes de la República de Chile y los tribunales competentes de Santiago."

## Archivos a modificar
1. `src/pages/Legal.tsx` — Secciones regulatorias CL/CA
2. `src/pages/Terms.tsx` — Ley aplicable multi-jurisdicción
3. `supabase/functions/optimize-taxes/index.ts` — Disclaimer en response
4. `supabase/functions/optimize-rrsp-tfsa/index.ts` — Disclaimer en response
5. `supabase/functions/optimize-apv-chile/index.ts` — Disclaimer en response
6. `src/components/tax-calendar/TaxSituationWizard.tsx` — Disclaimer antes de resultados
7. `src/components/mileage/MileageDeductionMaximizer.tsx` — Badge vigencia tasas
8. `src/components/forms/MileageForm.tsx` — Nota vigencia tasas

