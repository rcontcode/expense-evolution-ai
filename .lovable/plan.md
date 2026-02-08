

# Plan: Agregar Lead Score y Priority al Webhook de GHL

## Resumen
Vamos a modificar la Edge Function `send-quiz-lead` para calcular el **lead_score** (0-100) y la **priority** (hot/warm/cool/cold) al momento de capturar el lead, guardarlos en la base de datos, y enviarlos a GHL para segmentación automática.

---

## Cambios a Realizar

### 1. Actualizar Edge Function `send-quiz-lead`

**Agregar la lógica de scoring directamente en la función:**
- Replicar la fórmula de `calculateLeadScore` del frontend
- Calcular la prioridad basada en el score
- Guardar `lead_score` y `priority` en la base de datos
- Incluir ambos campos en el payload que se envía a GHL

**Nuevos campos en el payload de GHL:**
```javascript
{
  // ...campos existentes...
  lead_score: 85,           // Puntuación 0-100
  lead_priority: "hot",     // hot | warm | cool | cold
  lead_priority_label: "PRIORIDAD", // Etiqueta en español
  is_high_priority: true,   // Boolean para triggers fáciles
}
```

---

## Beneficios para GHL

Con estos campos, podrás crear en GHL:

1. **Workflows por temperatura:**
   - Si `lead_priority = "hot"` → Notificación inmediata al equipo de ventas
   - Si `lead_priority = "warm"` → Secuencia de nurturing acelerada
   - Si `lead_priority = "cool"` → Secuencia estándar

2. **Tags automáticos:**
   - Crear tag `🔥 HOT LEAD` cuando `is_high_priority = true`
   - Usar `lead_priority_label` como tag visible

3. **Filtros y segmentos:**
   - Filtrar contactos por `lead_score >= 80` para campañas especiales
   - Segmentar listas por `lead_priority`

---

## Sección Técnica

### Archivo a modificar:
```text
supabase/functions/send-quiz-lead/index.ts
```

### Lógica de scoring (a agregar en Edge Function):

```typescript
function calculateLeadScore(payload: QuizLeadPayload): number {
  let score = 0;

  // Quiz score bajo = más necesidad de ayuda (max +30)
  if (payload.quiz_score <= 25) score += 30;
  else if (payload.quiz_score <= 40) score += 25;
  else if (payload.quiz_score <= 50) score += 20;
  else if (payload.quiz_score <= 60) score += 10;

  // Comentario personal = interés alto (max +30)
  if (payload.comments && payload.comments.trim().length > 0) {
    score += 25;
    if (payload.comments.length > 50) score += 5;
  }

  // Nivel principiante = urgencia (max +15)
  const level = payload.quiz_level?.toLowerCase();
  if (level === 'principiante') score += 15;
  else if (level === 'emergente') score += 10;
  else if (level === 'evolucionando') score += 5;

  // Obstáculos críticos (max +10)
  const criticalObstacles = ['no sé por dónde empezar', 'gastos descontrolados', 
                             'falta de conocimiento', 'deudas abrumadoras'];
  if (criticalObstacles.some(obs => payload.obstacle.toLowerCase().includes(obs))) {
    score += 10;
  }

  // Metas ambiciosas (max +10)
  const ambitiousGoals = ['jubilación anticipada', 'fire', 'crecer patrimonio', 
                          'independencia financiera', 'libertad financiera'];
  if (ambitiousGoals.some(goal => payload.goal.toLowerCase().includes(goal))) {
    score += 10;
  }

  // Dueño de negocio (max +5)
  const businessSituations = ['dueño de negocio', 'empresario', 'emprendedor'];
  if (businessSituations.some(sit => payload.situation.toLowerCase().includes(sit))) {
    score += 5;
  }

  // Tiene teléfono (max +5)
  if (payload.phone && payload.phone.trim().length > 0) {
    score += 5;
  }

  // Tiempo invertido alto (max +5)
  const highEngagement = ['1 - 3 horas', 'más de 3 horas', '1-3 horas'];
  if (highEngagement.some(time => payload.time_spent?.toLowerCase().includes(time))) {
    score += 5;
  }

  // Muchas preguntas fallidas (max +5)
  if (payload.failed_questions && payload.failed_questions.length >= 5) {
    score += 5;
  }

  return Math.min(100, score);
}

function getLeadPriority(score: number): string {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 25) return 'cool';
  return 'cold';
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'hot': return 'PRIORIDAD';
    case 'warm': return 'INTERESADO';
    case 'cool': return 'POTENCIAL';
    default: return 'NUEVO';
  }
}
```

### Payload actualizado para GHL:

```typescript
const leadScore = calculateLeadScore(payload);
const leadPriority = getLeadPriority(leadScore);

const ghlPayload = {
  // Campos existentes...
  first_name, last_name, email, phone,
  country, situation, goal, obstacle,
  time_spent, quiz_score, quiz_level,
  failed_questions, comments, source, lead_id,
  
  // NUEVOS campos de scoring
  lead_score: leadScore,
  lead_priority: leadPriority,
  lead_priority_label: getPriorityLabel(leadPriority),
  is_high_priority: leadScore >= 80,
  is_warm_or_higher: leadScore >= 50,
};
```

### Insert en base de datos actualizado:

```typescript
const { data: savedLead } = await supabase
  .from("quiz_leads")
  .insert({
    // ...campos existentes...
    lead_score: leadScore,      // Nuevo
    priority: leadPriority,     // Nuevo
  })
```

---

## Resultado Final

Después de implementar:

1. **En la base de datos:** Cada lead tendrá su score y prioridad calculados automáticamente al crearse
2. **En GHL:** Recibirás los campos:
   - `lead_score`: 0-100
   - `lead_priority`: hot/warm/cool/cold
   - `lead_priority_label`: PRIORIDAD/INTERESADO/POTENCIAL/NUEVO
   - `is_high_priority`: true/false (para triggers simples)
3. **En tu panel admin:** Ya estaba calculando esto en el frontend, pero ahora estará sincronizado con GHL

---

## Configuración en GHL (Pasos Manuales)

Una vez implementado, en GHL deberás:

1. **Mapear los campos custom:**
   - Crear campo "Lead Score" (número)
   - Crear campo "Lead Priority" (dropdown: hot/warm/cool/cold)
   
2. **Crear workflow de notificación:**
   - Trigger: Nuevo contacto donde `is_high_priority = true`
   - Acción: Notificación push/email al equipo de ventas

3. **Segmentar automáticamente:**
   - Crear segmento "Leads HOT" con filtro `lead_priority = "hot"`

