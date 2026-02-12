
# Soporte de Moneda Inteligente en el Asistente y TTS

## Problema

El sistema tiene 3 puntos ciegos respecto a la moneda:

1. **TTS siempre dice "dolares"**: La funcion `cleanTextForTTS` convierte `$` a "dolares" sin importar si el usuario opera en pesos chilenos (CLP), dolares canadienses (CAD), u otra moneda.

2. **El Edge Function no sabe la moneda**: `userContext` envia `country` y `province` pero NO la moneda activa (`currentCurrency`). Los mensajes de respuesta de las tools (`executeCreateIncomeTool`, `executeCreateExpenseTool`) hardcodean `$${amount}` sin contexto monetario.

3. **Multi-pais sin distincion**: Un usuario con entidades en Chile Y Canada no tiene forma de que el asistente distinga si "$10" son CLP, CAD o USD.

## Solucion

### Paso 1: Enviar moneda en el contexto al Edge Function

**Archivo: `src/components/chat/ChatAssistant.tsx`**

Agregar al objeto `userContext`:
- `currency`: moneda activa de la entidad actual (e.g., `"CAD"`, `"CLP"`)
- `entityName`: nombre de la entidad activa (para referencia)

Esto viene de `useEntity()` que ya provee `currentCurrency`.

### Paso 2: El Edge Function usa la moneda en sus respuestas

**Archivo: `supabase/functions/app-assistant/index.ts`**

- Recibir `currency` del `userContext`
- Crear un mapa de moneda a nombre hablado:
  - `CAD` -> "dolares canadienses" / "Canadian dollars"
  - `CLP` -> "pesos chilenos" / "Chilean pesos"  
  - `USD` -> "dolares" / "dollars"
  - `EUR` -> "euros"
- Modificar `executeCreateIncomeTool` y `executeCreateExpenseTool` para usar el nombre de moneda correcto en el mensaje (ej: "Ingreso de 10 dolares canadienses" en vez de "Ingreso de $10")
- Agregar instruccion al system prompt para que el modelo use la moneda correcta en respuestas libres
- Cuando el usuario es multi-pais y no especifica moneda, el asistente debe preguntar

### Paso 3: TTS inteligente segun moneda

**Archivo: `src/hooks/utils/useElevenLabsTTS.ts` y `src/hooks/utils/useVoiceAssistant.ts`**

- Actualizar `cleanTextForTTS` y `cleanTextForSpeech` para recibir la moneda activa como parametro
- Mapa de conversion:
  - Si moneda es `CLP`: `$` -> "pesos"
  - Si moneda es `CAD`: `$` -> "dolares canadienses"
  - Si moneda es `USD` o default: `$` -> "dolares"
  - Si moneda es `EUR`: `euro` -> "euros"
- El hook `useAssistantVoiceControl` ya tiene acceso al `EntityContext`, asi que puede pasar la moneda activa

### Paso 4: System prompt con contexto monetario

Agregar al system prompt una seccion que indique:
- La moneda principal del usuario
- Si es multi-pais, las monedas disponibles
- Instruccion: "Cuando el usuario diga un monto sin especificar moneda, asume {currency}. Si el usuario tiene multiples paises, pregunta en cual moneda si hay ambiguedad."

## Detalle Tecnico

### Archivos a modificar:
1. **`src/components/chat/ChatAssistant.tsx`** - Agregar `currency` y `entityName` al `userContext`
2. **`supabase/functions/app-assistant/index.ts`** - Usar moneda en tool responses y system prompt
3. **`src/hooks/utils/useElevenLabsTTS.ts`** - `cleanTextForTTS` recibe currency
4. **`src/hooks/utils/useVoiceAssistant.ts`** - `cleanTextForSpeech` recibe currency
5. **`src/hooks/utils/useAssistantVoiceControl.ts`** - Pasar currency del EntityContext a las funciones de TTS

### Mapa de monedas (constante compartida):

```text
CURRENCY_SPOKEN_NAMES = {
  CAD: { es: "dolares canadienses", en: "Canadian dollars" },
  CLP: { es: "pesos chilenos", en: "Chilean pesos" },
  USD: { es: "dolares", en: "dollars" },
  EUR: { es: "euros", en: "euros" },
  MXN: { es: "pesos mexicanos", en: "Mexican pesos" },
}
```

### Resultado esperado:
- Usuario chileno dice "agrega ingreso de 10" -> "Ingreso de 10 pesos chilenos registrado"
- Usuario canadiense dice "agrega gasto de 50" -> "Gasto de 50 dolares canadienses registrado"
- Usuario multi-pais dice "agrega 100" -> "Cual moneda: pesos chilenos o dolares canadienses?"
- TTS lee correctamente "50 dolares canadienses" en vez de "50 stfstfs"
