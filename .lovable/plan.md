

## Situacion actual

**EvoFinz** tiene un sistema completo de quiz con:
- Quiz de 10 preguntas con scoring (0-100%)
- Captura de leads (nombre, email, telefono, pais, situacion, meta, obstaculo)
- Tabla `quiz_leads` en la DB compartida
- Lead scoring automatico (hot/warm/cool/cold)
- CRM admin completo (/admin/leads) con filtros, exportacion, follow-ups, timeline de interacciones
- Edge function `send-quiz-lead` que guarda + envia a GHL
- Persistencia de progreso en localStorage

**Fokuspark** tiene un quiz basico (`PlanQuiz.tsx`) embebido en el landing que:
- Solo tiene 5 preguntas de opcion multiple
- NO captura datos del usuario (ni nombre, ni email, nada)
- NO guarda nada en la DB
- Solo recomienda un plan de suscripcion al final
- Es puramente client-side, sin backend

## Respuesta directa

**No se puede implementar desde aqui.** Los componentes UI (formularios, paginas, modales) deben crearse en el proyecto Fokuspark. Lo que SI comparten es la misma base de datos, asi que la tabla `quiz_leads` ya existe y el CRM admin de EvoFinz ya podria mostrar leads de ambas apps si Fokuspark los guarda ahi.

## Opciones

### Opcion A: Reusar el CRM de EvoFinz para ambas apps
Fokuspark envia leads a la misma tabla `quiz_leads` con un campo extra (`source: 'fokuspark'`). El admin de EvoFinz los ve todos. Solo se necesita:
1. Agregar columna `source` a `quiz_leads` (migracion aqui)
2. Crear el quiz + formulario de captura en Fokuspark (prompt para alla)
3. Crear edge function `send-quiz-lead` en Fokuspark (o reusar la existente)

### Opcion B: Quiz independiente en Fokuspark
Quiz diferente con preguntas de productividad, tabla separada, CRM separado. Mas trabajo, sistemas duplicados.

## Recomendacion

**Opcion A** es la correcta. Puedo:
1. Agregar la columna `source` a `quiz_leads` desde aqui (migracion DB)
2. Actualizar el CRM admin de EvoFinz para mostrar filtro por `source`
3. Darte el prompt completo para Fokuspark con todo el quiz adaptado a productividad

### Paso 1 (aqui en EvoFinz)
- Migracion: `ALTER TABLE quiz_leads ADD COLUMN source TEXT DEFAULT 'evofinz'`
- Actualizar `LeadFilters` para incluir filtro por source
- Actualizar `LeadsTable` para mostrar badge de source
- Actualizar `LeadsExport` para incluir source
- Actualizar edge function `send-quiz-lead` para aceptar source

### Paso 2 (prompt para Fokuspark)
- Generar el texto completo para copiar y pegar en Fokuspark con:
  - Quiz de productividad/enfoque (10 preguntas con scoring)
  - Formulario de captura de datos
  - Edge function que guarda en `quiz_leads` con `source: 'fokuspark'`
  - Pagina dedicada `/quiz` con hero + modal + resultados

