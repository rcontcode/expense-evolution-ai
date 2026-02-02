
Objetivo
- Corregir por qué te aparece “se acabaron los minutos” aunque eres el creador/admin.
- Evitar que el sistema se “congele / relentece” cuando ocurre un 429.
- Mejorar la experiencia de configuración: previsualización de voces confiable, cambio de voz que sí se aplique, y feedback claro de guardado (sin necesidad de botón “Guardar” si se guarda automático).

Diagnóstico (causa raíz)
1) Tu cuenta sí es admin en la base de datos, pero el backend de voz premium no te está reconociendo como admin:
   - En frontend, usePlanLimits() usa la tabla public.user_roles para decidir “modo dios” (admin).
   - En el backend function supabase/functions/elevenlabs-tts/index.ts se consulta una tabla “roles” (public.roles) que NO existe en tu base de datos, entonces isAdmin queda false y te aplica el límite (3 min).
   - Resultado: el frontend cree que eres ilimitado, pero el backend te corta con 429 voice_limit_exceeded.

2) Además, los previews y pruebas iniciales consumieron casi todo el cupo (2.96/3). Esto es normal con el cálculo actual (caracteres/600) si se prueba varias veces, pero en tu caso no debería cobrarse por ser admin/creador.

3) El “freeze / blank screen” ocurre porque algunas rutas/UI no están manejando de forma robusta el 429 (y/o el estado de speaking/listening) y se quedan en un estado bloqueado.

Qué vamos a cambiar (enfoque)
A) Backend (función elevenlabs-tts): reconocer admin correctamente y no cobrar minutos a admin
1. Cambiar el chequeo de admin:
   - Reemplazar la consulta a “roles” por “user_roles” (misma fuente que usa el frontend).
   - Manejar el error de tabla inexistente de forma segura (si falla la consulta, asumir no-admin sin romper el flujo).

2. Bypass real de límites para admin:
   - Si isAdmin=true:
     - monthlyLimit = Infinity
     - NO ejecutar increment_voice_usage (para que no se sumen minutos ni se “gasten” pruebas).
   - Esto hace que, como creador/admin, nunca veas 429 por minutos.

3. Robustez de respuestas:
   - Mantener 429 + { error: "voice_limit_exceeded", useFallback: true } para usuarios no-admin cuando aplique.
   - Asegurar Content-Type consistente en errores (application/json), para que el cliente siempre pueda parsear errorData sin fallar.

B) Base de datos (opcional pero recomendado): “descontaminar” tu uso actual
- Resetear tu voice_minutes_used del periodo actual a 0 (solo para tu usuario admin) para que no te quede “sucio” el panel/estado local.
- Esto es opcional porque con el bypass ya no te afectará, pero mejora la claridad.
- Lo haríamos con una migración SQL puntual (UPDATE sobre usage_tracking para tu user_id y period_start actual) o con una función segura “reset_my_voice_usage()” limitada a admin.

C) Frontend: fallback correcto y sin duplicación cuando hay 429 (para usuarios normales)
1. Ajustar la lógica de fallback en voz:
   - Hoy useVoiceAssistant solo hace fallback nativo cuando premiumSpeak retorna error === 'not_eligible'.
   - Cambiaremos para que también haga fallback cuando el error sea 'voice_limit_exceeded' (o mapearemos ese error a 'not_eligible' dentro de useElevenLabsTTS).
   - Resultado: cuando un usuario llega al límite, no se “traba”: habla con voz nativa y se mantiene la UX.

2. Evitar congelamientos:
   - Asegurar que cuando premium falle (429 u otro), se liberen siempre:
     - isPausedForSpeakingRef
     - estados de “isSpeaking / isListening”
   - Revisar el flujo stop/cancel para que no quede speechSynthesis en pending y provoque loops.

D) Configuración de voces: que el cambio se aplique y se entienda
1. Preview de voces premium:
   - Ya existe botón Play por voz. Lo haremos más claro y consistente:
     - Mostrar “Esto consume minutos premium” solo a no-admin.
     - Si admin: mostrar “Ilimitado” en vez de Math.round(Infinity) (que hoy se vería raro).
     - Throttle: impedir múltiples clicks rápidos que lancen varias solicitudes.
     - (Opcional) Cache local por voiceId+lang del preview para no repetir consumo (usuarios no-admin).

2. Guardado:
   - Actualmente se guarda automáticamente en localStorage (useVoicePreferences).
   - Añadiremos una etiqueta visible tipo “Guardado automáticamente” y/o un toast “Preferencia actualizada” cuando selecciones voz premium, para que se sienta “guardado” sin botón.
   - Si prefieres un botón “Guardar”, lo podemos agregar, pero mi recomendación es mantener auto-guardado y solo dar feedback.

3. Defaults correctos (acentos):
   - Asegurar que, si idioma = español y no hay premiumVoiceId elegido, el default sea el primer set “es.female” (Matilda) o “es.male” según género.
   - Si el usuario tiene guardado un voiceId que no corresponde al idioma (ej. un voiceId inglés pero UI en español), lo normalizaremos (reset a null o al default del idioma) para evitar “acento agringado hablando español”.

Archivos involucrados (técnico)
- Backend function:
  - supabase/functions/elevenlabs-tts/index.ts
- Frontend:
  - src/hooks/utils/useElevenLabsTTS.ts (mapear 429/voice_limit_exceeded, mejorar errores)
  - src/hooks/utils/useVoiceAssistant.ts (fallback también para voice_limit_exceeded + limpieza de estado)
  - src/components/settings/VoicePreferencesCard.tsx (mostrar ilimitado para admin, feedback de guardado, throttle/cache preview)
  - (Opcional) src/hooks/utils/useVoicePreferences.ts (normalización de premiumVoiceId por idioma)

Plan de implementación (secuenciado)
1) Confirmación en backend de tu rol admin (ya verificado en public.user_roles).
2) Cambiar elevenlabs-tts:
   - Admin check con user_roles
   - No incrementar uso si admin
   - Hardening del manejo de errores
3) (Opcional) Reset de tu usage_tracking.voice_minutes_used del mes actual para tu usuario.
4) Frontend:
   - Fallback nativo cuando error sea voice_limit_exceeded
   - Garantizar limpieza de estados para evitar “congelado”
5) UX Settings:
   - “Ilimitado” para admin
   - Feedback claro de guardado
   - Throttle/caching de previews
   - Normalización de voiceId por idioma
6) Pruebas end-to-end
   - Como admin: reproducir previews, hablar en chat, confirmar que nunca aparece 429 y que el acento en español es latino neutral.
   - Como usuario no-admin (cuenta de prueba): forzar agotamiento y confirmar fallback nativo sin duplicación ni freeze.
   - Probar en móvil y desktop (por los estados de speechSynthesis/recognition).

Criterios de éxito
- Tu cuenta (admin/creador) no vuelve a ver “voice_limit_exceeded”.
- El chat no se congela cuando hay errores o límites.
- Cambiar una voz premium en configuración se nota inmediatamente en la voz del asistente.
- Preview de voces funciona y explica claramente si consume minutos (solo no-admin).
