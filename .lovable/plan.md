

## Alinear Campos del Webhook con Fokuspark y Agregar Pregunta Abierta

### Problema

Fokuspark envía `quiz_score` y `quiz_level` (no `score`/`level`). El webhook actual solo reconoce `score`/`level`. Además, necesitan confirmación sobre agregar una pregunta abierta para enriquecer `comments` que el generador de mensajes de IA usa para personalizar seguimientos.

### Cambios Necesarios

**1. Webhook: Soportar ambos formatos de campos (`score`/`level` y `quiz_score`/`quiz_level`)**
- Actualizar `ExternalLeadPayload` interface para incluir `quiz_score` y `quiz_level` como alternativas
- Modificar lógica de extracción para probar `quiz_score` → `score` y `quiz_level` → `level` si los directos no existen
- Garantizar que el payload a GHL use los nombres que espera (manteniendo compatibilidad)

**2. Lead Scoring: Actualizar lógica de detección de nivel**
- El scoring ya reconoce niveles de Fokuspark (`novato`, `aprendiz`, `enfocado`) - no requiere cambios
- Confirmar que `quiz_level` mapea correctamente al scoring existente

**3. Recomendación para Fokuspark: Campo `comments` enriquecido**
- SÍ agregar pregunta abierta: "¿Qué has intentado antes para mejorar tu productividad?"
- Placeholder sugerido: "Cuéntanos qué métodos, apps o hábitos has probado y qué resultados obtuviste..."
- Esto da +25 puntos en lead scoring y enriquece los emails de seguimiento generados por IA

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/webhook-leads/index.ts` | Agregar `quiz_score`/`quiz_level` como aliases de `score`/`level` en interface y lógica de extracción |
| `src/hooks/admin/useLeadScoring.ts` | Verificar compatibilidad (ya soporta niveles Fokuspark) |

### Mensaje para Fokuspark

"Todo listo. El webhook ahora acepta tanto `score`/`level` como `quiz_score`/`quiz_level`. Recomendación fuerte: agrega una pregunta abierta tipo '¿Qué has intentado antes para mejorar tu productividad?' — enriquece el campo `comments` que usamos para personalizar emails de seguimiento con IA y da +25 puntos extra en el lead scoring."

