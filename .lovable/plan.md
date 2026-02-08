
# Plan: Integrar Voz Completa en Onboarding Conversacional

## Problema Detectado

El onboarding actual tiene varias fallas de voz:

1. **Sin entrada de voz**: No hay micrófono - el usuario no puede hablar
2. **Duplicación de audio**: Se llama a ElevenLabs y native TTS sin coordinación
3. **Voz no arranca sola**: El trigger automático tiene condiciones de carrera
4. **Selector de voz oculto**: Difícil de encontrar y usar

## Solución: Usar la Arquitectura del ChatAssistant

El asistente financiero (ChatAssistant) tiene un sistema de voz robusto. Vamos a replicar esa arquitectura:

```text
┌─────────────────────────────────────────────────────────────┐
│               ARQUITECTURA DE VOZ ACTUAL                     │
│                    (ChatAssistant)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  useVoiceAssistant ──┬── Speech Recognition (entrada)       │
│                      │                                       │
│                      └── speak() ────┬── premiumSpeak()     │
│                                      │   (ElevenLabs)        │
│                                      │                       │
│                                      └── Native TTS         │
│                                          (fallback)          │
│                                                              │
│  Coordinación:                                               │
│  - Mutex previene doble-speak                               │
│  - isOutputtingAudioRef bloquea transcripción propia        │
│  - TTS_COOLDOWN_MS después de hablar                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Cambios Técnicos

### 1. Integrar useVoiceAssistant con Premium TTS

Reemplazar el sistema actual de voz por `useVoiceAssistant` pasando `premiumSpeak`:

```typescript
const voiceAssistant = useVoiceAssistant({
  speechSpeed: voicePrefs.speechSpeed,
  volume: voicePrefs.volume,
  pitch: voicePrefs.pitch,
  voiceGender: voicePrefs.voiceGender,
  selectedVoiceName: voicePrefs.selectedVoiceName,
  // CLAVE: Conectar ElevenLabs como premium speak
  premiumSpeak: elevenLabsTTS.speak,
  isPremiumSpeaking: elevenLabsTTS.isSpeaking,
  onTranscript: handleVoiceResponse,
  onInterimTranscript: (text) => setInterimText(text),
});
```

### 2. Agregar Entrada de Voz (Micrófono)

Permitir que el usuario responda con voz:

```typescript
const handleVoiceResponse = (transcript: string) => {
  // Detectar si el usuario dijo una opción
  const matchedOption = findMatchingOption(transcript, currentQuestion.options);
  
  if (matchedOption) {
    handleOptionClick(matchedOption);
  } else {
    // Feedback de que no entendió
    voiceAssistant.speak(lang === 'es' 
      ? 'No entendí tu respuesta. Por favor elige una opción.'
      : 'I didn\'t understand. Please choose an option.');
  }
};
```

### 3. UI Mejorada

- Botón de micrófono visible y prominente
- Indicador de "Escuchando..." cuando graba
- Transcripción en vivo visible
- Selector de voz en panel accesible
- Colores consistentes con el tema de la app

### 4. Control de Flujo de Voz

```text
┌─────────────────────────────────────────────────────────────┐
│                 FLUJO DE ONBOARDING CON VOZ                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Paso cambia → Phoenix habla pregunta (auto)             │
│     ↓                                                        │
│  2. Usuario puede:                                           │
│     a) Click en opción → Phoenix confirma → Siguiente       │
│     b) Click micrófono → Escucha → Procesa → Ejecuta        │
│     ↓                                                        │
│  3. Mientras Phoenix habla:                                  │
│     - Micrófono bloqueado (previene auto-transcripción)     │
│     - Opciones deshabilitadas                               │
│     ↓                                                        │
│  4. Al terminar de hablar:                                   │
│     - Cooldown de 1.5s                                       │
│     - Habilita interacción                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/onboarding/ConversationalOnboarding.tsx` | Reescritura mayor: integrar useVoiceAssistant, agregar UI de micrófono, manejar transcripciones |

## Funcionalidades Nuevas

1. **Botón de Micrófono**: Visible junto a las opciones para responder con voz
2. **Transcripción en Vivo**: Muestra lo que el usuario está diciendo
3. **Detección de Opciones**: Reconoce si el usuario dice "deudas", "ahorro", etc.
4. **Feedback de Voz**: Phoenix confirma la opción detectada
5. **Auto-arranque**: La voz comienza automáticamente al cargar
6. **Panel de Voz Accesible**: Botón visible para configurar voz

## Resultado Esperado

El onboarding funcionará igual que el asistente financiero:
- Phoenix habla automáticamente las preguntas
- El usuario puede responder con voz O click
- Sin duplicación de audio
- Voz premium (ElevenLabs) cuando esté disponible
- Selector de voz fácil de usar
