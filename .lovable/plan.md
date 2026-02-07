
# Plan: Configurar Secreto GHL_WEBHOOK_URL

## Resumen
Solicitar el secreto `GHL_WEBHOOK_URL` de forma segura para habilitar la integración con GoHighLevel.

## Pasos a Ejecutar

### 1. Solicitar el Secreto
Usaré el sistema seguro de secretos de Lovable Cloud para solicitar la URL del webhook. Esto:
- Abrirá un campo de entrada encriptado
- La URL nunca quedará expuesta en el chat
- Se almacenará de forma segura en el backend

### 2. Verificar la Integración
Una vez configurado el secreto:
- La Edge Function `send-quiz-lead` detectará automáticamente la variable `GHL_WEBHOOK_URL`
- Cada nuevo lead del quiz se enviará a GoHighLevel
- Los campos que se enviarán son:
  - `first_name`, `last_name`, `email`, `phone`
  - `country`, `situation`, `goal`, `obstacle`
  - `quiz_score`, `quiz_level`, `failed_questions`

### 3. Probar con un Lead Real
Después de configurar:
1. Completar el Financial Phoenix Quiz
2. Ver en GHL que llegue la solicitud de muestra
3. Mapear los campos en GHL
4. Guardar y publicar el workflow

## Notas Técnicas
- El código ya está listo en `supabase/functions/send-quiz-lead/index.ts`
- Si GHL falla, el lead igual se guarda en la base de datos (no se pierde)
- Puedes ver todos los leads en `/admin/leads`
