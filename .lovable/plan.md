

# Auditoria de Nombres: Estandarizar a "EvoFinz"

## Hallazgos

### VISIBLE al usuario - DEBE cambiarse (7 ubicaciones)

| Donde | Nombre actual | Cambiar a |
|-------|--------------|-----------|
| AssistantHeader.tsx | "Asistente Financiero" / "Financial Assistant" | "EvoFinz" |
| ChatAssistant.tsx | "Asistente Financiero" / "Financial Assistant" | "EvoFinz" |
| OnboardingTutorial.tsx | "Welcome to Your Financial Assistant!" | "Welcome to EvoFinz!" |
| ProgressiveOnboarding.tsx | "dominar tu asistente financiero" | "dominar EvoFinz" |
| VoicePreferencesCard.tsx | "soy tu asistente financiero" (voz de prueba) | "soy EvoFinz" |
| useSmartGuidance.ts | "Soy tu asistente financiero" | "Soy EvoFinz" |
| Legal.tsx | 'Asistente financiero conversacional ("Phoenix")' | 'Asistente financiero conversacional de EvoFinz' |
| System prompt (edge function) | "Eres Phoenix, un asistente financiero..." | "Eres EvoFinz, el asistente financiero..." |

### NO visible / NO cambiar

| Donde | Por que dejarlo |
|-------|----------------|
| `PhoenixLogo` (componente) | Nombre interno de codigo, el usuario nunca lo ve |
| `phoenix-logo.tsx` (archivo) | Nombre de archivo interno |
| `phoenix-clean-logo.png` (asset) | Nombre de asset interno |
| `expense-evolution-ai.lovable.app` (URL) | URL de Lovable, no se puede cambiar desde aqui |
| CategoryTrendsChart "Expense evolution by category" | Describe la evolucion de gastos como concepto, no es el nombre de la app |
| Sonidos "phoenix" style en VoiceSettingsPanel | Es un estilo de sonido interno, no se muestra como nombre de app |

---

## Plan de cambios

### Archivo 1: `src/components/chat/AssistantHeader.tsx`
- Linea 79: `'Asistente Financiero'` a `'EvoFinz'`
- Linea 79: `'Financial Assistant'` a `'EvoFinz'`

### Archivo 2: `src/components/chat/ChatAssistant.tsx`
- Linea 1330: mismo cambio que AssistantHeader

### Archivo 3: `src/components/guidance/OnboardingTutorial.tsx`
- Titulo: "Welcome to Your Financial Assistant!" a "Welcome to EvoFinz!"
- Titulo ES: "Bienvenido a Tu Asistente Financiero!" a "Bienvenido a EvoFinz!"

### Archivo 4: `src/components/onboarding/ProgressiveOnboarding.tsx`
- "dominar tu asistente financiero" a "dominar EvoFinz"
- "master your financial assistant" a "master EvoFinz"

### Archivo 5: `src/components/settings/VoicePreferencesCard.tsx`
- Texto de prueba de voz: "soy tu asistente financiero" a "soy EvoFinz"
- EN: "I am your financial assistant" a "I am EvoFinz"

### Archivo 6: `src/hooks/utils/useSmartGuidance.ts`
- "Soy tu asistente financiero" a "Soy EvoFinz, tu asistente"
- "I'm your financial assistant" a "I'm EvoFinz, your assistant"

### Archivo 7: `src/pages/Legal.tsx`
- Quitar '("Phoenix")' y reemplazar con "de EvoFinz"

### Archivo 8: `supabase/functions/app-assistant/index.ts`
- System prompt: "Eres Phoenix, un asistente financiero" a "Eres EvoFinz, el asistente financiero inteligente de esta aplicacion"
- Mantener toda la personalidad y conocimiento igual, solo cambiar el nombre

**Total: 8 archivos, cambios menores de texto. Sin migraciones SQL. Sin componentes nuevos.**

