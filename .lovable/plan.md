
# Plan: Sistema Avanzado de Calificación y Seguimiento de Leads

## Resumen Ejecutivo
Transformaremos el panel de leads en un **CRM inteligente** con:
- **Lead Scoring automático** (0-100 puntos) basado en múltiples factores
- **Indicadores visuales de prioridad** (colores, badges, iconos)
- **Acciones rápidas de contacto** (WhatsApp, Email directo)
- **Sistema de seguimiento** con tareas y recordatorios
- **Historial de interacciones** por lead

---

## 1. Lead Scoring Inteligente (Calificación Automática)

### Fórmula de Puntuación (0-100 puntos)

| Factor | Puntos | Lógica |
|--------|--------|--------|
| **Quiz Score bajo** | +30 | Score 0-25% = máxima necesidad de ayuda |
| **Comentario personal** | +25 | Escribió algo = señal de interés alto |
| **Nivel "principiante"** | +15 | Mayor urgencia de solución |
| **Obstáculo crítico** | +10 | "No sé por dónde empezar" o "Gastos descontrolados" |
| **Meta ambiciosa** | +10 | "Jubilación anticipada" o "Crecer patrimonio" |
| **Situación "Dueño de negocio"** | +5 | Mayor poder adquisitivo |
| **Tiene teléfono** | +5 | Más fácil de contactar |
| **Tiempo invertido alto** | +5 | "1-3 horas" o "Más de 3 horas" = compromiso |

### Clasificación Visual

```text
🔥 HOT (80-100)    → Borde rojo, fondo rojo suave, etiqueta "PRIORIDAD"
🟠 WARM (50-79)    → Borde naranja, etiqueta "INTERESADO"  
🔵 COOL (25-49)    → Borde azul, etiqueta "POTENCIAL"
⚪ COLD (0-24)     → Sin destacar, etiqueta "NUEVO"
```

---

## 2. Acciones Rápidas de Contacto

### Desde la tabla (dropdown mejorado):
- 📲 **Enviar WhatsApp** → Abre `wa.me/{phone}` con mensaje pre-armado
- 📧 **Enviar Email** → Abre cliente de email con asunto/cuerpo pre-armado
- 📞 **Llamar** → `tel:{phone}`
- 📝 **Agregar nota** → Modal rápido para registro

### Mensaje predeterminado WhatsApp:
```text
¡Hola {nombre}! 👋

Soy de EvoFinz. Vi que completaste nuestro quiz financiero y 
mencionaste que tu meta es "{goal}" pero tu obstáculo es "{obstacle}".

¿Te gustaría que te ayudemos a crear un plan personalizado? 🎯
```

### Mensaje predeterminado Email:
```text
Asunto: {nombre}, tu plan financiero personalizado está listo

Hola {nombre},

Completaste nuestro Financial Phoenix Quiz con un score de {score}%.
Tu nivel actual es "{level}" y notamos que tu principal obstáculo es "{obstacle}".

Tenemos recomendaciones específicas para ayudarte a alcanzar tu meta de "{goal}".
¿Te gustaría agendar una llamada de 15 minutos para revisarlas?
```

---

## 3. Sistema de Seguimiento (Follow-up Tasks)

### Nueva tabla: `lead_follow_ups`
```sql
- id (uuid)
- lead_id (references quiz_leads)
- task_type: 'call' | 'email' | 'whatsapp' | 'note'
- scheduled_at (timestamp)
- completed_at (timestamp, nullable)
- notes (text)
- created_by (user_id)
```

### UI en LeadDetail:
- Sección "📋 Próximos seguimientos" con lista de tareas pendientes
- Botón "➕ Agendar seguimiento" → Modal con:
  - Tipo (llamada, email, WhatsApp)
  - Fecha/hora
  - Nota

### Vista general:
- Nueva tarjeta en dashboard: "Seguimientos pendientes hoy"
- Filtro en tabla: "Con seguimiento pendiente"

---

## 4. Historial de Interacciones

### Nueva tabla: `lead_interactions`
```sql
- id (uuid)
- lead_id (references quiz_leads)
- interaction_type: 'call' | 'email' | 'whatsapp' | 'note' | 'meeting'
- direction: 'inbound' | 'outbound'
- notes (text)
- outcome: 'positive' | 'neutral' | 'negative' | 'no_answer'
- created_at
- created_by
```

### Timeline en LeadDetail:
- Línea de tiempo visual con todas las interacciones
- Cada entrada muestra: fecha, tipo, notas, resultado
- Fácil agregar nueva interacción después de contactar

---

## 5. Mejoras Visuales en Tabla

### Columnas actualizadas:
| Columna | Nuevo contenido |
|---------|-----------------|
| **Nombre** | + Badge de comentario (ya existe) + Badge de prioridad |
| **Score** | Barra de progreso visual + número |
| **Estado** | Tags de seguimiento pendiente |
| **Prioridad** | NUEVA columna con score y color |

### Row styling por prioridad:
- HOT leads: fondo `bg-red-50 dark:bg-red-900/10`, borde izquierdo rojo
- WARM leads: fondo `bg-orange-50 dark:bg-orange-900/10`
- Leads con seguimiento HOY: ícono de campana pulsando

---

## 6. Tarjetas de Dashboard Mejoradas

### Nuevas métricas:
1. **Leads HOT sin contactar** (urgente, en rojo)
2. **Seguimientos pendientes hoy** (con contador)
3. **Tasa de respuesta** (contactados que respondieron)
4. **Tiempo promedio de respuesta** (días desde creación hasta contacto)

### Gráfico de embudo:
```text
Total Leads → Contactados → Respondieron → Convertidos
    100          60            35             12
```

---

## 7. Filtros Avanzados

Nuevos filtros:
- **Por prioridad**: HOT, WARM, COOL, COLD
- **Por situación laboral**: Empleado, Freelancer, Dueño de negocio...
- **Por meta**: Ahorrar, Reducir deudas, FIRE...
- **Por obstáculo**: Falta de tiempo, No sé empezar...
- **Con seguimiento pendiente**: Sí/No/Hoy
- **Tiempo sin contacto**: Más de 3 días, 7 días, 30 días

---

## Sección Técnica

### Archivos a crear:
```text
src/hooks/admin/useLeadScoring.ts      → Lógica de calificación
src/components/admin/LeadScoreBadge.tsx → Badge visual de prioridad
src/components/admin/QuickContact.tsx   → Botones WhatsApp/Email/Llamar
src/components/admin/FollowUpModal.tsx  → Modal para agendar seguimiento
src/components/admin/InteractionTimeline.tsx → Historial de interacciones
src/components/admin/LeadFunnel.tsx     → Gráfico de embudo
```

### Archivos a modificar:
```text
src/hooks/admin/useLeadsManagement.ts  → Agregar cálculo de score, nuevos filtros
src/components/admin/LeadsTable.tsx    → Columna prioridad, row styling, acciones
src/components/admin/LeadDetail.tsx    → Secciones de seguimiento/historial
src/components/admin/LeadFilters.tsx   → Nuevos filtros
src/pages/admin/LeadsManagement.tsx    → Nuevas tarjetas dashboard
```

### Migraciones de base de datos:
```sql
-- 1. Agregar campos de scoring
ALTER TABLE quiz_leads ADD COLUMN lead_score INTEGER DEFAULT 0;
ALTER TABLE quiz_leads ADD COLUMN priority TEXT DEFAULT 'new';

-- 2. Tabla de seguimientos
CREATE TABLE lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES quiz_leads(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de interacciones
CREATE TABLE lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES quiz_leads(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound',
  notes TEXT,
  outcome TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Función de scoring (en hook):
```typescript
function calculateLeadScore(lead: QuizLead): number {
  let score = 0;
  
  // Quiz score bajo = más necesidad
  if (lead.quiz_score <= 25) score += 30;
  else if (lead.quiz_score <= 50) score += 20;
  
  // Comentario personal = interés alto
  if (lead.comments) score += 25;
  
  // Nivel principiante = urgencia
  if (lead.quiz_level === 'principiante') score += 15;
  else if (lead.quiz_level === 'emergente') score += 10;
  
  // Obstáculos críticos
  const criticalObstacles = ['No sé por dónde empezar', 'Gastos descontrolados'];
  if (criticalObstacles.includes(lead.obstacle)) score += 10;
  
  // Metas ambiciosas
  const ambitiousGoals = ['Jubilación anticipada (FIRE)', 'Crecer patrimonio'];
  if (ambitiousGoals.includes(lead.goal)) score += 10;
  
  // Dueño de negocio
  if (lead.situation === 'Dueño de negocio') score += 5;
  
  // Tiene teléfono
  if (lead.phone) score += 5;
  
  // Invirtió tiempo significativo
  const highEngagement = ['1 - 3 horas', 'Más de 3 horas'];
  if (highEngagement.includes(lead.time_spent || '')) score += 5;
  
  return Math.min(100, score);
}
```

---

## Resultado Final

Después de implementar, tendrás:

1. ✅ **Lead Scoring automático** que prioriza leads "calientes"
2. ✅ **Colores y badges** para identificar prioridades de un vistazo
3. ✅ **Botones de WhatsApp/Email** con mensajes personalizados
4. ✅ **Sistema de seguimiento** con recordatorios
5. ✅ **Historial completo** de cada interacción
6. ✅ **Dashboard mejorado** con métricas de conversión
7. ✅ **Filtros avanzados** para segmentar leads

Esto te permitirá **contactar primero a los leads con mayor probabilidad de conversión** y **nunca perder un seguimiento**.
