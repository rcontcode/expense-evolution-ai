

## Diagnóstico: Discriminación Chile vs Canadá

### Estado Actual — NO hay discriminación por país

Revisé todos los flujos end-to-end y encontré que **ninguno** envía el país del usuario a las funciones backend:

| Flujo | ¿Envía país? | Problema |
|-------|:---:|---------|
| `classify-document` (Bandeja del Caos) | ❌ | El prompt dice "Canada and Chile" genéricamente pero no sabe cuál es el usuario |
| `process-receipt` (OCR/Captura) | ❌ | El prompt menciona CRA pero nunca SII. Hardcodea `currency: "CAD"` como default |
| `useUnifiedChaosInbox` (procesamiento) | ❌ | Hardcodea `currency: 'CAD'` en líneas 312, 334, 424 |
| `tax-report-export.ts` (Reporte) | ✅ | Recibe `country` como parámetro y discrimina correctamente |
| `useTaxCalculations.ts` (Reglas) | ✅ | Tiene reglas separadas CA vs CL |
| `TaxDocumentChecklist.tsx` | ✅ | Filtra por país correctamente |

### Gaps Concretos

**G1 — classify-document**: El prompt IA ya menciona ambos países, pero no adapta prioridades ni moneda según el usuario. Un chileno que suba un certificado AFP recibe `currency: "CAD"` por default.

**G2 — process-receipt**: El prompt OCR está 100% sesgado a Canadá:
- Solo menciona tiendas canadienses (Home Depot CA, Costco CA, Canadian Tire)
- Solo menciona CRA como autoridad fiscal
- No incluye tiendas/contexto chileno (Falabella, Ripley, Líder, Jumbo, Copec, etc.)
- Product search URLs son todas `.ca`

**G3 — useUnifiedChaosInbox**: Hardcodea `'CAD'` como moneda fallback en 3+ lugares.

**G4 — VoiceParsers.ts**: Los keywords de categorías no incluyen términos chilenos (boleta, cotización, AFP, etc.)

### Plan de Cambios

**Cambio 1 — Pasar país al backend** (cliente → Edge Functions)
- `useUnifiedChaosInbox.ts`: Obtener `currentCountry` de `useCountryContext()` o `EntityContext`, enviarlo como `country` en el body de `classify-document` y `process-receipt`
- `useReceiptProcessor.ts`: Enviar `country` en el body

**Cambio 2 — classify-document**: Recibir `country` en el request body, adaptar:
- Moneda default (CAD vs CLP)
- Priorizar tipos de documento relevantes al país
- Adaptar `suggested_actions` al contexto fiscal

**Cambio 3 — process-receipt**: Recibir `country`, adaptar:
- Agregar tiendas chilenas al contexto de vendor (Falabella, Líder, Jumbo, Copec, ENAP, Sodimac, etc.)
- Agregar URLs de búsqueda de productos chilenos (.cl)
- Mencionar SII + IVA cuando `country === 'CL'`
- Cambiar moneda default de CAD a CLP cuando corresponda
- Adaptar las reglas de deducción al contexto SII vs CRA

**Cambio 4 — useUnifiedChaosInbox**: Reemplazar todos los `'CAD'` hardcodeados con la moneda del contexto del usuario

**Cambio 5 — VoiceParsers.ts**: Agregar keywords chilenos (boleta, cotización, patente, AFP, isapre, etc.)

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/data/useUnifiedChaosInbox.ts` | Inyectar country + currency dinámica |
| `src/hooks/data/useReceiptProcessor.ts` | Enviar country al backend |
| `supabase/functions/classify-document/index.ts` | Recibir country, adaptar prompt + defaults |
| `supabase/functions/process-receipt/index.ts` | Recibir country, agregar contexto CL, adaptar vendor/URLs/reglas |
| `src/components/chat/voice/VoiceParsers.ts` | Agregar keywords chilenos |

