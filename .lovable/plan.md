# Demo Studio v3 — Catálogo completo de escenarios

## Alcance aprobado

Implementar **6 escenarios** ahora (2 showcase completos + mantener 3 existentes + 1 arquetipo nuevo). En una iteración posterior haremos un análisis profundo de buyer personas reales de EvoFinz para agregar/ajustar más perfiles estratégicos.

## Escenarios a implementar en esta fase

### SHOWCASE COMPLETOS (datos en TODAS las tablas — ideales para tour de venta)

**1. "Familia Rodríguez" — Padre de familia, Chile (CLP)**
Pedro (38, ingeniero asalariado) + Carmen (36, profesora media jornada) + 2 hijos.
- 6 meses: 80+ gastos, 12 ingresos (2 sueldos × 6 meses), 8 bills recurrentes
- 150+ transacciones bancarias en 2 cuentas (Banco Estado + BCI)
- 4 presupuestos por categoría (alimentación, educación, salud, transporte)
- 3 metas de ahorro (vacaciones $800k, fondo emergencia $3M, universidad $15M)
- 2 deudas activas (hipotecario, automotriz)
- 6 categorías personalizadas, 8 tags ("hijo1", "hijo2", "compartido", "personal-pedro")
- Recurrencias detectadas (Netflix, gym, mensualidad colegio)
- Entidad fiscal CL persona natural

**2. "EcoLavandería SpA" — PYME chilena con empleados (CLP)**
Sofía (42), dueña con 2 empleados.
- 6 meses: 100+ gastos B2B, 50+ ingresos (POS, transferencias, Mercado Pago)
- 200+ transacciones en 3 cuentas (corriente empresa + vista personal + Mercado Pago)
- 5 bills recurrentes B2B (arriendo local, ERP, internet, agua, luz)
- 3 presupuestos operacionales, 2 metas (maquinaria $5M, segundo local $20M)
- 1 deuda CORFO, 12 categorías custom, tags por cliente B2B
- Mileage tracking (visitas clientes corporativos)
- Entidad fiscal SpA, régimen Pro-PyME, RUT, giro

### ARQUETIPOS FOCALIZADOS

**3. "Carlos Caos" (mantener)** — duplicados y desorden bancario.
**4. "María Profesional Joven" (mantener)** — ingresos mixtos sueldo + freelance CL.
**5. "Lopez Construction Inc." (mantener)** — Canadá B2B, HST/GST, mileage, T2.
**6. "Pareja Millennial" — NUEVO** — Daniela + Joaquín, sin hijos, ahorrando para casa propia. Muestra tags compartidos, meta conjunta, multi-cuenta.

## Plan de ejecución

### Fase 1 — Validación de schema
Usar `security--get_table_schema` para confirmar columnas de las tablas nuevas que vamos a poblar: `budgets`, `savings_goals`, `debts`, `categories` (custom), `tags`, `expense_tags`, `bank_accounts`, `recurring_transactions`.

### Fase 2 — Edge Function (`supabase/functions/manage-demo-data/index.ts`)
- Agregar `buildScenarioFamiliaRodriguez(userId)` (showcase completo CL personal).
- Agregar `buildScenarioEcoLavanderia(userId)` (showcase completo CL PYME).
- Agregar `buildScenarioParejaMillennial(userId)` (focalizado).
- Extender `seedDemo()` para insertar en las 8 tablas nuevas.
- Extender `resetDemo()` con safe cleanup en orden correcto (relaciones → padres).
- Mantener prefijo `[DEMO]` en notes/description para limpieza segura.
- Idempotencia: re-cargar borra primero los `[DEMO]` previos del usuario.

### Fase 3 — UI (`src/pages/admin/DemoStudio.tsx`)
- Reorganizar selector en 2 secciones: **"Showcase Completo"** (recomendado para grabar) y **"Arquetipos Focalizados"**.
- Badge "COMPLETO" / "FOCALIZADO" + checklist de tablas/herramientas cubiertas por escenario.
- Contador estimado de registros antes de cargar.
- Embed scripts/guiones por escenario con botón "Copiar voiceover ES/EN".

### Fase 4 — Guiones de video integrados
Markdown copiable por escenario:
- **Familia Rodríguez**: tour 12 min (dashboard → gastos compartidos → presupuestos → metas → mentor educativo → reportes mes).
- **EcoLavandería**: tour 15 min (multi-cuenta → mileage → reportes tributarios CL → bills B2B → flujo caja).
- **Pareja Millennial**: 4 min (tags compartidos + meta conjunta).
- **Carlos**: 3 min (duplicados).
- **María**: 3 min (ingresos mixtos).
- **Lopez Construction**: 5 min (Canadá HST/mileage).

## Próxima iteración (post-implementación)

Después de probar estos 6 escenarios, abriremos un análisis dedicado de buyer personas:
- Revisar landing actual de EvoFinz (CL + CA), pricing tiers, features destacados.
- Identificar 2-4 buyer personas faltantes (ej: contador independiente que gestiona varios clientes, expat con ingresos multi-país, jubilado con renta de inversión, etc.).
- Agregar/refinar escenarios para cubrir esos perfiles estratégicos.

## Confirmación

¿Apruebo y procedo con la implementación de los 6 escenarios + UI + guiones?
