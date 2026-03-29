

# Corregir "consejos financieros" → "educación financiera" en toda la app

## Problema Legal

Decir "consejos financieros" implica que EvoFinz da asesoría financiera, lo cual contradice los disclaimers legales. Debe ser **educación financiera** o **tips de finanzas personales**.

## 7 correcciones en 5 archivos

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `QuizModal.tsx` | "consejos financieros y novedades" → "educación financiera y novedades" |
| 2 | `QuizModal.tsx` | "financial tips and updates" → "financial education and updates" |
| 3 | `VipReferralLanding.tsx` | "consejos financieros, tips y novedades" → "educación financiera, tips y novedades" |
| 4 | `VipReferralLanding.tsx` | "financial tips, advice and updates" → "financial education and updates" |
| 5 | `NotificationPreferences.tsx` | label: "Consejos Financieros" → "Tips Financieros", desc: "Consejos y oportunidades" → "Tips y oportunidades" |
| 6 | `ProfileExtenderDialog.tsx` | "consejos financieros" → "experiencia financiera" / "financial advice" → "financial experience" |
| 7 | `app-assistant/index.ts` | "Cuando des consejos financieros" → "Cuando compartas educación financiera" |

## Sin cambios (ya correcto)

- `FinancialLibrary.tsx` — podcast externo
- `Landing.tsx`, `Terms.tsx`, `legal-disclaimer.tsx` — ya dicen "NO constituye asesoría"
- Edge functions de optimización — ya usan "fines educativos"

