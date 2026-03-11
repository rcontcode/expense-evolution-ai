

## Análisis: Qué dice Fokuspark y qué necesitamos hacer

Fokuspark quiere enviar un campo nuevo `quiz_answers` con las 10 preguntas completas y sus respuestas. Actualmente solo envía `failed_questions`. La estructura propuesta:

```json
{
  "name": "...", "email": "...", "phone": "...",
  "country": "...", "source": "fokuspark",
  "situation": "Estudiante",
  "goal": "Eliminar procrastinación",
  "obstacle": "Me distraigo",
  "comments": "texto libre",
  "score": 45, "level": "Novato",
  "failed_questions": [1, 4, 7],
  "time_spent": "120",
  "quiz_answers": [
    { "question": "¿Con qué frecuencia completas tus tareas...?", "answer_value": 10, "answer_label": "Siempre" },
    ...
  ]
}
```

### Lo que necesitamos hacer en EvoFinz

**1. Actualizar `webhook-leads` para capturar `quiz_answers`**
- Aceptar `quiz_answers` como campo directo del payload
- Almacenarlo en la columna `metadata` JSONB (ya existe) bajo la llave `quiz_answers`
- No requiere cambio de schema — `metadata` JSONB ya lo soporta

**2. Actualizar scoring para niveles de Fokuspark**
- El `calculatePriority` en el webhook solo reconoce niveles de EvoFinz (`principiante`, `emergente`, `evolucionando`)
- Agregar los niveles de Fokuspark: `novato` → +15, `aprendiz` → +10, `enfocado` → +5
- Agregar obstáculos de Fokuspark: `me distraigo`, `procrastino` como obstáculos críticos

**3. Actualizar scoring del frontend (`useLeadScoring.ts`)**
- Mismos ajustes: reconocer niveles y obstáculos de Fokuspark
- Leer `metadata.quiz_answers` para analytics más ricos

**4. Mostrar `quiz_answers` en el CRM**
- En `LeadEnrichmentPanel.tsx`: si `metadata.quiz_answers` existe, renderizar tabla con pregunta, respuesta y score por pregunta
- Diferente del bloque de "best practices" de Universmind — es una lista de preguntas con valores numéricos

**5. Mensaje para Fokuspark**
- Decirles el formato exacto que aceptamos y que envíen todo como campos de primer nivel + `quiz_answers` como array

### Mensaje sugerido para enviarle a Fokuspark

> "El CRM acepta los campos de primer nivel tal cual los tienes (name, email, phone, country, situation, goal, obstacle, comments, score, level, failed_questions, time_spent, source). Agrega `quiz_answers` como array de objetos `{ question, answer_value, answer_label }` directamente en el payload (primer nivel, no dentro de metadata). Todo se almacena automáticamente. No necesitas anidar nada en metadata."

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/webhook-leads/index.ts` | Capturar `quiz_answers` → guardar en `metadata.quiz_answers` + agregar niveles/obstáculos Fokuspark al scoring |
| `src/hooks/admin/useLeadScoring.ts` | Agregar niveles Fokuspark (`novato`, `aprendiz`, `enfocado`) y obstáculos (`me distraigo`, `procrastino`) |
| `src/components/admin/LeadEnrichmentPanel.tsx` | Renderizar tabla de quiz_answers si existe en metadata |

