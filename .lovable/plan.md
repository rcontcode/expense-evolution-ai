

## Auditoría: Documentos y Categorías para Declaración de Impuestos

### Lo que tu app maneja HOY

**Tipos de Documento (Bandeja del Caos — 8 tipos):**
`receipt`, `utility_bill`, `bank_statement`, `income_proof`, `contract`, `tax_document`, `invoice`, `unknown`

**Categorías de Gasto (17):**
meals, travel, fuel, equipment, software, mileage, home_office, professional_services, office_supplies, utilities, advertising, materials, hobbies, family_outings, gifts, scheduled_purchases, other

**Categorías de Pagos Fijos (22):**
housing, utilities, insurance, transportation, telecom, education, childcare, health, food, entertainment, subscriptions, debt_payments, investments, legal_financial, clothing, gifts, pharmacy, pets, hobbies, family_outings, scheduled_purchases, other

---

### Lo que piden los contadores — COMPLETO

#### CANADA (CRA) — Documentos requeridos por sección

| Documento | ¿Lo tenemos? | Cómo |
|-----------|:---:|------|
| Recibos de compra/gasto | ✅ | `receipt` + expenses |
| Facturas emitidas/recibidas | ✅ | `invoice` con dirección |
| Contratos | ✅ | `contract` |
| Extractos bancarios | ✅ | `bank_statement` |
| Boletas de servicios | ✅ | `utility_bill` |
| Comprobantes de ingreso | ✅ | `income_proof` |
| **T4 (Empleo)** | ❌ | No hay tipo específico |
| **T4A (Pensión/Otros ingresos)** | ❌ | No hay tipo |
| **T5 (Inversiones/Dividendos)** | ❌ | No hay tipo |
| **T2202 (Matrícula universidad)** | ❌ | No hay tipo |
| **T3 (Fondos mutuos)** | ❌ | No hay tipo |
| **T5007 (Beneficios sociales)** | ❌ | No hay tipo |
| **RRSP contribution receipts** | ❌ | No hay tipo |
| **Recibos de donaciones (caridad)** | ❌ | No hay categoría ni tipo |
| **Gastos médicos** | ❌ | No hay categoría de gasto |
| **Recibos de childcare** | ⚠️ | Solo en pagos fijos, no en gastos |
| **Registro de kilometraje (logbook)** | ⚠️ | Categoría existe pero no hay logbook estructurado |
| **Cálculo uso oficina en casa (m²)** | ⚠️ | Categoría existe pero sin calculadora de % |
| **Recibos de seguro** | ⚠️ | Solo en pagos fijos |
| **Licencias comerciales** | ❌ | No hay tipo |
| **Declaración GST/HST** | ⚠️ | Se calcula pero no se genera formulario |
| **Recibos de alquiler (BC renter credit)** | ❌ | No hay categoría ni tipo |
| **Gastos de mudanza** | ❌ | No hay categoría |
| **Intereses de préstamo estudiantil** | ❌ | No hay categoría |

#### CHILE (SII) — Documentos requeridos

| Documento | ¿Lo tenemos? | Cómo |
|-----------|:---:|------|
| Boletas de compra | ✅ | `receipt` |
| Facturas electrónicas | ✅ | `invoice` |
| Contratos de arriendo/trabajo | ✅ | `contract` |
| Cartolas bancarias | ✅ | `bank_statement` |
| **Boletas de honorarios** | ❌ | No hay tipo específico |
| **Certificados de AFP** | ❌ | No hay tipo |
| **Certificados de APV** | ❌ | No hay tipo |
| **Certificados de Isapre/Fonasa** | ❌ | No hay tipo |
| **Certificado de intereses hipotecarios** | ❌ | No hay tipo |
| **Certificado de dividendos hipotecarios** | ❌ | No hay tipo |
| **Certificados de inversiones (fondos mutuos)** | ❌ | No hay tipo |
| **Gastos médicos / salud** | ❌ | No hay categoría de gasto |
| **Donaciones con beneficio tributario** | ❌ | No hay categoría |
| **Certificado de educación (hijos)** | ❌ | No hay tipo |
| **Formulario 22 / 29 pre-llenado** | ⚠️ | Tenemos deadlines pero no docs |

---

### Categorías de Gasto que FALTAN (deducibles por CRA/SII)

| Categoría faltante | CRA | SII | Prioridad |
|---------------------|:---:|:---:|:---------:|
| `medical` — Gastos Médicos | ✅ | ✅ | Alta |
| `insurance_business` — Seguros de Negocio | ✅ | ✅ | Alta |
| `education_training` — Educación/Capacitación | ✅ | ✅ | Alta |
| `donations` — Donaciones/Caridad | ✅ | ✅ | Alta |
| `rent` — Arriendo (deducible en negocio o crédito BC) | ✅ | ✅ | Alta |
| `bank_fees` — Comisiones Bancarias | ✅ | ✅ | Media |
| `maintenance_repairs` — Mantención/Reparaciones | ✅ | ✅ | Media |
| `moving` — Gastos de Mudanza | ✅ | ❌ | Media |
| `interest_loans` — Intereses de Préstamos | ✅ | ✅ | Media |
| `vehicle_maintenance` — Mantención Vehículo | ✅ | ✅ | Media |
| `parking_tolls` — Estacionamiento/Peajes | ✅ | ✅ | Baja |
| `telephone` — Teléfono (% negocio) | ✅ | ✅ | Baja |

### Tipos de Documento que FALTAN en la Bandeja del Caos

| Tipo faltante | Uso |
|---------------|-----|
| `tax_slip` — Formularios fiscales (T4, T5, T2202, Cert. AFP, APV) | CRA/SII |
| `medical_receipt` — Recibos médicos | Ambos |
| `donation_receipt` — Recibos de donación | Ambos |
| `insurance_policy` — Pólizas de seguro | Ambos |
| `rental_receipt` — Recibos de arriendo | CA (BC credit) / CL |
| `investment_statement` — Estado de inversiones | Ambos |
| `government_form` — Formularios gubernamentales | Ambos |

---

### Plan de Implementación

**Fase 1 — Expandir categorías de gasto (expense-categories.ts + tipos)**
- Agregar 12 categorías faltantes con traducciones es/en, iconos y colores
- Sincronizar con `expense.types.ts`, `expense.schema.ts`
- Agregar reglas de deducción correspondientes en `useTaxCalculations.ts` y `country-tax-config.ts`

**Fase 2 — Expandir tipos de documento (classify-document + chaos inbox)**
- Agregar 7 tipos nuevos al clasificador IA
- Actualizar `TYPE_LABELS` en `useUnifiedChaosInbox.ts`
- Actualizar prompt del Edge Function para reconocer los nuevos tipos
- Agregar rutas de procesamiento para cada tipo nuevo

**Fase 3 — Checklist de Preparación Fiscal**
- Crear componente `TaxDocumentChecklist` que muestre qué documentos tiene el usuario y cuáles le faltan, basado en su perfil (país, tipo de trabajo, situación familiar)
- Integrar en la página TaxOptimizer como nueva sección
- Los documentos faltantes llevan al usuario a subirlos directamente

| Archivo | Cambio |
|---------|--------|
| `src/lib/constants/expense-categories.ts` | +12 categorías |
| `src/types/expense.types.ts` | Sincronizar tipo union |
| `src/lib/validations/expense.schema.ts` | Sincronizar Zod |
| `src/hooks/data/useTaxCalculations.ts` | Reglas deducción nuevas categorías |
| `src/lib/constants/country-tax-config.ts` | Reglas deducción por país |
| `supabase/functions/classify-document/index.ts` | +7 tipos documento en prompt IA |
| `src/hooks/data/useUnifiedChaosInbox.ts` | +7 TYPE_LABELS + rutas |
| `src/components/tax/TaxDocumentChecklist.tsx` | Nuevo componente checklist |
| `src/pages/TaxOptimizer.tsx` | Integrar checklist |

