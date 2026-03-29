

# Revisión Legal Completa: Disclaimers en toda la app

## Diagnóstico

Revisé toda la app. Ya hay buen uso de `LegalDisclaimer` y `ProjectionDisclaimer` en muchos componentes, pero hay **2 problemas**:

### Problema 1: Textos del disclaimer NO mencionan consultar un profesional específico

Los textos `compact` (que son los más visibles) dicen cosas como "Solo fines educativos" pero **no dicen "consulte a un profesional"** — excepto el de `tax`. Hay que agregar la recomendación de consultar al especialista correspondiente en CADA variante.

| Variante | Texto compact actual | Texto compact mejorado |
|----------|---------------------|----------------------|
| `general` ES | "Solo con fines educativos. No es asesoría profesional." | "Solo con fines educativos. No es asesoría profesional. Consulte a un especialista calificado." |
| `general` EN | "For educational purposes only. Not professional advice." | "For educational purposes only. Not professional advice. Consult a qualified specialist." |
| `investment` ES | "Proyecciones hipotéticas. Rendimientos pasados no garantizan resultados futuros." | + "Consulte a un asesor de inversiones certificado." |
| `investment` EN | "Hypothetical projections. Past performance does not guarantee future results." | + "Consult a certified investment advisor." |
| `education` ES | "Inspirado en expertos. No afiliado. Solo fines educativos." | + "Consulte a un profesional financiero." |
| `education` EN | "Inspired by experts. Not affiliated. Educational purposes only." | + "Consult a financial professional." |
| `tax` | Ya dice "Consulte un CPA" | Sin cambio |

### Problema 2: Componentes/páginas sin disclaimer

| # | Archivo | Tipo contenido | Disclaimer a agregar |
|---|---------|---------------|---------------------|
| 1 | `ApvOptimizerCard.tsx` | Optimización fiscal APV Chile | `LegalDisclaimer variant="tax" size="compact"` |
| 2 | `FinancialAutopilot.tsx` | Insights IA financieros | `LegalDisclaimer variant="general" size="compact"` |
| 3 | `BillSmartInsights.tsx` | Tips de negociación/ahorro | `LegalDisclaimer variant="general" size="compact"` |
| 4 | `InvestmentRiskProfiler.tsx` | Perfil de riesgo inversión | `LegalDisclaimer variant="investment" size="compact"` |
| 5 | `NetWorth.tsx` (página) | Patrimonio neto | `LegalDisclaimer variant="investment" size="compact"` al final |
| 6 | `Investments.tsx` (página) | Inversiones & FIRE | `LegalDisclaimer variant="investment" size="compact"` al final |
| 7 | `TaxOptimizer.tsx` (página) | Optimizador fiscal | `LegalDisclaimer variant="tax" size="compact"` al final |

## Archivos a modificar (8)

1. **`src/components/ui/legal-disclaimer.tsx`** — Mejorar textos compact de 3 variantes para incluir "consulte a un profesional"
2. **`src/components/tax/ApvOptimizerCard.tsx`** — Agregar `LegalDisclaimer tax`
3. **`src/components/dashboard/FinancialAutopilot.tsx`** — Agregar `LegalDisclaimer general`
4. **`src/components/bills/BillSmartInsights.tsx`** — Agregar `LegalDisclaimer general`
5. **`src/components/investments/InvestmentRiskProfiler.tsx`** — Agregar `LegalDisclaimer investment`
6. **`src/pages/NetWorth.tsx`** — Agregar `LegalDisclaimer investment` al final
7. **`src/pages/Investments.tsx`** — Agregar `LegalDisclaimer investment` al final
8. **`src/pages/TaxOptimizer.tsx`** — Agregar `LegalDisclaimer tax` al final

