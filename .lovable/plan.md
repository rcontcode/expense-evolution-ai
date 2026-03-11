

## Análisis del Problema

**Lo que Universmind envía:**
```json
{
  "name": "...", "email": "...", "phone": "...", "source": "universmind_quiz",
  "score": 72, "level": "Intermedio", "comments": "texto libre paso 16",
  "metadata": {
    "situacion": "3-6 meses",
    "objetivo": "Estimular desarrollo cognitivo",
    "obstaculo": "Falta de tiempo",
    "tiempo_disponible": "Más de 1 hora",
    "conocimiento_previo": "Soy experta",
    "producto_recomendado": "Colección Completa",
    "precio_producto": 247,
    "respuestas_best_practices": { "habla_con_bebe": true, "contacto_visual": false, ... }
  }
}
```

**Lo que pasa hoy:** El `webhook-leads` ya extrae los campos de `metadata` y los mapea correctamente a las columnas de la DB (`situation`, `goal`, `obstacle`, `time_spent`, `failed_questions`). Los campos extra (`producto_recomendado`, `precio_producto`, `conocimiento_previo`, `respuestas_best_practices`) se concatenan como texto plano en el campo `comments`, mezclados con el comentario libre del usuario.

**Problemas concretos:**
1. **Metadata valiosa aplastada en `comments`** — producto recomendado, precio, conocimiento previo, y detalle de best practices se pierden como texto estructurado. Se vuelven un bloque JSON dentro de un string, inutilizable para filtros, analytics o scoring.
2. **No hay columna `metadata` en `quiz_leads`** — la tabla no tiene donde almacenar datos app-específicos de forma estructurada.
3. **El CRM no muestra la metadata** — `LeadEnrichmentPanel` y `LeadDetail` no renderizan producto recomendado, precio, conocimiento previo ni el detalle de best practices.
4. **El scoring ignora datos valiosos** — `conocimiento_previo` y `producto_recomendado` no influyen en el lead score ni en la probabilidad de conversión.

---

## Plan de Implementación

### 1. Agregar columna `metadata` (JSONB) a `quiz_leads`
- Migración SQL: `ALTER TABLE quiz_leads ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;`
- Almacena todo dato app-específico sin perder estructura.

### 2. Actualizar `webhook-leads` Edge Function
- Guardar el objeto `metadata` completo (o los campos extra construidos) en la nueva columna `metadata` en vez de aplastarlos en `comments`.
- El campo `comments` queda limpio: solo el comentario libre del usuario.
- Enriquecer el scoring con `conocimiento_previo` (principiante = más puntos) y `precio_producto` (mayor precio = mayor valor del lead).

### 3. Actualizar `send-quiz-lead` Edge Function
- Agregar soporte para un campo `metadata` opcional para consistencia futura (cuando EvoFinz o Fokuspark envíen datos extra).

### 4. Actualizar el tipo `QuizLead` en el frontend
- Agregar `metadata?: Record<string, unknown>` al interface `QuizLead` en `useLeadsManagement.ts`.
- Incluir `metadata` en la query de Supabase.

### 5. Mostrar metadata en el CRM
- **`LeadEnrichmentPanel`**: Nuevo bloque "Datos de la App" que renderiza visualmente los campos de metadata (producto recomendado con badge, precio, nivel de conocimiento, detalle de best practices con checks/crosses).
- **`LeadDetail`**: Mostrar producto recomendado y precio como badges destacados en el header si existen.

### 6. Mejorar scoring con metadata
- En `useLeadIntelligence.ts` (`calculateConversionProbability`): usar `metadata.producto_recomendado` y `metadata.precio_producto` como factores de conversión (lead que ya tiene producto recomendado de alto valor = mayor probabilidad).
- En `useLeadScoring.ts`: bonus si `conocimiento_previo` es bajo (más necesidad).

---

## Impacto por App

| App | Hoy | Después |
|---|---|---|
| **EvoFinz** (`send-quiz-lead`) | Todos los campos directos, sin metadata | Sin cambio inmediato, preparado para futuro |
| **Universmind** (`webhook-leads`) | Metadata aplastada en comments | Metadata estructurada en columna JSONB, comments limpio |
| **Fokuspark** (futuro) | Pendiente de integración | Usará el mismo patrón de metadata |
| **Lead Magnets** (`webhook-leads`) | Solo name/email/source + guide en metadata | `guide` se guarda en metadata JSONB |

