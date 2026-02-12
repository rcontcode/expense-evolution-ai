
# Reestructuracion Completa del Asistente Financiero Phoenix

## Problemas Identificados

Despues de revisar exhaustivamente los ~3500 lineas del sistema, identifique **7 problemas criticos**:

### 1. Duplicacion de Voz (El problema mas grave)
El sistema tiene **3 sistemas de audio independientes** que se pisan entre si:
- `useVoiceAssistant` (TTS nativo con sentence queue)
- `useElevenLabsTTS` (ElevenLabs premium)
- `useAudioPlayback` (reproductor estilo Spotify)

Cuando el usuario hace clic en "Escuchar" en un mensaje, `audioPlayback.play()` usa TTS nativo directamente, sin pasar por ElevenLabs. Pero si `autoSpeak` esta activo, `speak()` tambien se ejecuta. Resultado: **dos voces hablando a la vez**.

### 2. Stop no detiene todo
`stopAllVoiceActivity` llama a `elevenLabsTTS.stop()`, `audioPlayback.stop()` y `window.speechSynthesis.cancel()`, pero `audioPlayback` mantiene su propio `SpeechSynthesisUtterance` que no se cancela correctamente porque `audioPlayback.stop()` llama `window.speechSynthesis.cancel()` por separado - hay una race condition.

### 3. Karaoke Text no funciona con ElevenLabs
El componente `KaraokeText` depende de `currentSpeakingText` y `currentSentenceIndex` del hook `useVoiceAssistant`, pero cuando ElevenLabs habla, esos valores nunca se setean porque ElevenLabs tiene su propio flujo de audio. Resultado: cuando ElevenLabs habla, no hay feedback visual.

### 4. ChatAssistant.tsx es un monolito de 1906 lineas
Un solo componente maneja: UI, estado, voz, IA, navegacion, tutoriales, highlights, confirmaciones, clarificaciones, memoria de conversacion, etc. Esto hace que cada cambio tenga efectos secundarios impredecibles.

### 5. Voice Preview en Settings no comparte estado con el asistente
`VoiceSettingsPanel` tiene su propio `audioRef` para previews. Si el usuario previsualize una voz y luego habla con el asistente, ambos audios pueden sonar simultaneamente.

### 6. El autoSpeak causa loops
Cuando el chat se abre, `speak(welcome)` se ejecuta. Si la voz falla o el usuario interactua rapido, puede causar que se encolen multiples respuestas de bienvenida.

### 7. audioPlayback es redundante
`useAudioPlayback` reimplementa TTS nativo con controles de Spotify (play/pause/seek), pero `useVoiceAssistant` ya tiene pause/resume. Son dos sistemas paralelos haciendo lo mismo.

---

## Plan de Solucion

### Fase 1: Unificar Control de Audio (Critico)

**Archivo: `src/hooks/utils/useVoiceAssistant.ts`**

- Hacer que `speak()` siempre setee `currentSpeakingText` ANTES de intentar ElevenLabs, para que KaraokeText funcione siempre
- Agregar un flag `isAnyAudioActive` que cubra todos los estados
- Cuando ElevenLabs habla, actualizar `isSpeaking` del hook padre (no solo `elevenLabsTTS.isSpeaking`)

**Archivo: `src/components/chat/ChatAssistant.tsx`**

- Eliminar `useAudioPlayback` completamente - el boton "Escuchar" en mensajes debe usar `speak()` directamente (que ya maneja ElevenLabs con fallback)
- Simplificar `stopAllVoiceActivity` a una sola funcion limpia:
  ```
  1. window.speechSynthesis.cancel()
  2. elevenLabsTTS.stop()
  3. stopSpeaking() del hook
  ```
- Eliminar los controles Spotify (seek, progress bar) que son redundantes y confusos

### Fase 2: Corregir Estado del Preview de Voz

**Archivo: `src/components/chat/VoiceSettingsPanel.tsx`**

- Al abrir el Sheet de settings, detener cualquier audio activo del asistente
- Al cerrar el Sheet, limpiar cualquier audio de preview
- Compartir un `stopAllAudio` global que el panel pueda usar

### Fase 3: Corregir KaraokeText con ElevenLabs

**Archivo: `src/hooks/utils/useElevenLabsTTS.ts`**

- Agregar callbacks `onSpeakingTextChange` para que el componente padre pueda mostrar el texto que se esta hablando
- Exponer `currentText` como estado

**Archivo: `src/components/chat/ChatAssistant.tsx`**

- Pasar el texto actual al KaraokeText sin importar si es nativo o premium

### Fase 4: Simplificar el Flujo de Voz

**Archivo: `src/components/chat/ChatAssistant.tsx`**

- El boton de "Escuchar" en cada mensaje llama `speak(msg.content)` directamente
- Remover toda la logica de `audioPlayback.isPlaying`, `audioPlayback.isPaused`, etc.
- Simplificar el render: si `isAnySpeaking`, mostrar boton de Stop. Si no, mostrar Play.

### Fase 5: Extraer Logica del Monolito (Mejora de mantenibilidad)

Crear un hook `useAssistantVoiceControl` que encapsule:
- `speak`, `stop`, `isSpeaking` (unificados)
- Logica de preview/stop para el panel de settings
- KaraokeText state management

Esto reducira ChatAssistant.tsx en ~300 lineas.

---

## Detalle Tecnico de Cambios

### Archivos a Modificar:
1. **`src/hooks/utils/useVoiceAssistant.ts`** - Sincronizar estado con ElevenLabs, siempre setear `currentSpeakingText`
2. **`src/hooks/utils/useElevenLabsTTS.ts`** - Exponer `currentText`, agregar callback
3. **`src/components/chat/ChatAssistant.tsx`** - Eliminar `useAudioPlayback`, simplificar controles, crear `useAssistantVoiceControl`
4. **`src/components/chat/VoiceSettingsPanel.tsx`** - Cleanup de audio al abrir/cerrar
5. **`src/hooks/utils/useAudioPlayback.ts`** - Eliminar (ya no se usa)

### Archivos Nuevos:
1. **`src/hooks/utils/useAssistantVoiceControl.ts`** - Hook unificado de control de voz

### Resultado Esperado:
- Un solo boton de Stop que SIEMPRE detiene todo
- Sin voces duplicadas nunca
- Preview de voz funcional en settings
- KaraokeText visible con cualquier motor de voz
- Codigo ~400 lineas mas corto y mantenible
