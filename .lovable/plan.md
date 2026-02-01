

# 🎯 Plan: Sistema de Voz Premium con ElevenLabs - Modelo Rentable y Escalable

## Resumen Ejecutivo

Después de un análisis exhaustivo de patrones de uso, costos de ElevenLabs, y estrategias de pricing del mercado, he desarrollado un **modelo híbrido basado en créditos de voz** que maximiza el valor para el usuario mientras protege la rentabilidad del negocio.

---

## Análisis de Uso Real y Proyectado

### Estado Actual de la Base de Datos
- La columna `voice_requests_count` **no existe aún** en `usage_tracking`
- Solo hay 1 usuario activo (plan free) con actividad mínima
- No hay datos históricos de uso de voz para analizar

### Proyección de Uso Basada en Investigación

Según datos de ChatGPT (10% de la población adulta mundial lo usa):

| Tipo de Usuario | Sesiones/Mes | Interacciones/Sesión | Total/Mes |
|-----------------|--------------|----------------------|-----------|
| Casual | 3-5 días | 2-3 | 10-15 |
| Regular | 10-15 días | 3-5 | 40-75 |
| Power User | 20+ días | 5-10 | 150-200 |
| Heavy (fanático) | Diario | 10+ | 300-500+ |

**Conclusión clave:** 50 interacciones/mes es extremadamente restrictivo. Un usuario que realmente adopte el asistente de voz usará fácilmente **100-300 interacciones/mes**.

---

## Costos Reales de ElevenLabs (2025)

### Sistema de Créditos

| Plan | Precio/Mes | Créditos | Costo por 1K Créditos |
|------|------------|----------|----------------------|
| Starter | $5 | 30,000 | $0.167 |
| Creator | $22 | 100,000 | $0.22 |
| Pro | $99 | 500,000 | $0.198 |
| Scale | $330 | 2,000,000 | $0.165 |

### Cálculo Real por Respuesta de Voz

- Respuesta promedio: ~150 palabras = ~600 caracteres
- **Modelo Turbo (recomendado):** 0.5 créditos/carácter = **300 créditos/respuesta**
- **Modelo Multilingual v2:** 1 crédito/carácter = **600 créditos/respuesta**

| Uso/Mes | Créditos (Turbo) | Costo en Plan Starter ($5) |
|---------|------------------|---------------------------|
| 50 | 15,000 | $0.83 |
| 100 | 30,000 | $1.67 |
| 200 | 60,000 | $3.33 |
| 300 | 90,000 | $5.00 |
| 500 | 150,000 | $8.33 |

**Revelación importante:** Con el modelo Turbo (0.5 créditos/char), ¡el costo es **LA MITAD** de lo que calculé antes!

---

## Modelo de Pricing Propuesto: Sistema de Créditos de Voz

### Concepto: "Minutos de Voz Premium"

En lugar de contar respuestas (confuso), usamos **minutos de voz premium** como métrica:
- 1 minuto de voz ≈ 150 palabras ≈ 600 caracteres ≈ **300 créditos (Turbo)**
- Más intuitivo para el usuario: "Tienes 20 minutos de voz premium este mes"

### Nueva Diferenciación por Plan

| Plan | Precio | Minutos Voz Premium/Mes | Respuestas Aprox. | Costo ElevenLabs | Margen |
|------|--------|------------------------|-------------------|------------------|--------|
| **Free** | $0 | 3 min (demo) | ~3 | $0.15 | N/A |
| **Premium** | $6.99 | 30 min | ~30 | $1.50 | 79% ✅ |
| **Pro** | $14.99 | 120 min | ~120 | $6.00 | 60% ✅ |
| **Pro+ (nuevo)** | $24.99 | Ilimitado* | ~500 cap | $15.00 | 40% ⚠️ |

*Ilimitado con fair-use cap de 500/mes para proteger contra abuso.

---

## Estrategia Anti-Abuso y Protección de Márgenes

### 1. Límite Duro con Fallback Elegante
```text
┌────────────────────────────────────────────────────────────────────────┐
│                  FLUJO DE VOZ CON PROTECCIÓN                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Usuario pide respuesta de voz]                                       │
│           │                                                            │
│           ▼                                                            │
│  ┌─────────────────────┐                                               │
│  │ ¿Minutos restantes? │                                               │
│  └──────────┬──────────┘                                               │
│             │                                                          │
│     ┌───────┴───────┐                                                  │
│     │               │                                                  │
│     ▼ Sí            ▼ No                                               │
│  ┌──────────────┐  ┌────────────────────────────────────┐              │
│  │ ElevenLabs   │  │ Web Speech API (gratis)            │              │
│  │ TTS Premium  │  │ + Badge "Voz básica"               │              │
│  │ + Badge      │  │ + CTA sutil "Recupera voz premium" │              │
│  │ "Premium"    │  └────────────────────────────────────┘              │
│  └──────────────┘                                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Compra de Minutos Adicionales (Upsell)
- $2.99 por 30 minutos adicionales
- Solo disponible para usuarios de pago
- Genera ingreso extra sin subir precio base

### 3. Notificaciones de Uso
| % Usado | Acción |
|---------|--------|
| 50% | Notificación informativa discreta |
| 80% | Alerta visual + sugerencia de upgrade |
| 100% | Fallback a voz nativa + modal de upgrade |

---

## Comparación con Competencia y Viabilidad

### Apps con Voice AI Similar

| App | Modelo | Límites | Precio |
|-----|--------|---------|--------|
| Notion AI | Por "AI blocks" | 100 free, luego $10/mes ilimitado | $10+/mes |
| Otter.ai | Por minutos | 300 min/mes free, 1200 min Pro | $16.99/mes |
| Descript | Por horas | 1hr/mes free, 30hrs Pro | $24/mes |
| ChatGPT Plus | Ilimitado | Sin límite de mensajes | $20/mes |

**Insight:** Apps con voice/audio usan modelo de tiempo (minutos/horas), no conteo de mensajes. Esto valida nuestro enfoque de "minutos de voz".

### Márgenes del Mercado SaaS

| Tipo | Margen Bruto Típico |
|------|---------------------|
| SaaS General | 70-85% |
| SaaS con AI | 50-70% |
| SaaS con Voice AI | 40-60% |

**Nuestros márgenes propuestos (60-79%) están DENTRO del rango saludable.**

---

## Implementación Técnica

### Fase 1: Infraestructura de Base de Datos

Agregar columna y función para tracking:

```sql
-- Columna para tracking de minutos de voz
ALTER TABLE usage_tracking 
ADD COLUMN IF NOT EXISTS voice_minutes_used DECIMAL(10,2) DEFAULT 0;

-- Función para incrementar uso de voz
CREATE OR REPLACE FUNCTION increment_voice_usage(
  p_user_id UUID,
  p_minutes DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, period_start, voice_minutes_used)
  VALUES (
    p_user_id, 
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_minutes
  )
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET 
    voice_minutes_used = usage_tracking.voice_minutes_used + p_minutes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Fase 2: Edge Function de ElevenLabs TTS

Ubicación: `supabase/functions/elevenlabs-tts/index.ts`

Flujo:
1. Autenticar usuario
2. Verificar minutos restantes
3. Si disponible → Llamar ElevenLabs API (modelo Turbo)
4. Calcular minutos usados (chars / 600)
5. Incrementar contador
6. Retornar audio MP3

Configuración:
- Modelo: `eleven_turbo_v2_5` (más rápido, más barato)
- Voz default: Roger (CwhRBWXzGAHq8TQ4Fs17)
- Format: `mp3_22050_32` (balance calidad/tamaño)

### Fase 3: Hook de React

Crear `src/hooks/utils/useElevenLabsTTS.ts`:

```typescript
// Pseudocódigo del flujo
const useElevenLabsTTS = () => {
  const { remainingMinutes, incrementUsage } = usePlanLimits();
  
  const speak = async (text: string) => {
    if (remainingMinutes <= 0) {
      // Fallback a Web Speech API
      return voiceSynthesisManager.speak(text);
    }
    
    // Llamar edge function
    const audio = await fetchElevenLabsAudio(text);
    
    // Calcular minutos usados
    const minutesUsed = text.length / 600;
    await incrementUsage('voice', minutesUsed);
    
    // Reproducir audio
    playAudio(audio);
  };
  
  return { speak, remainingMinutes };
};
```

### Fase 4: Actualizar usePlanLimits

Cambiar estructura de límites:

```typescript
export const PLAN_LIMITS = {
  free: {
    voice_minutes_per_month: 3,  // Demo
    // ...
  },
  premium: {
    voice_minutes_per_month: 30,
    // ...
  },
  pro: {
    voice_minutes_per_month: 120,
    // ...
  },
};
```

### Fase 5: UI de Uso de Voz

Componentes a crear:
- `VoiceMinutesIndicator`: Barra de progreso con minutos usados
- `VoiceUpgradePrompt`: Modal cuando se agotan minutos
- `PremiumVoiceBadge`: Indicador visual de voz premium activa

---

## Proyección Financiera

### Escenario: 1,000 usuarios de pago

| Plan | Usuarios | Revenue/Mes | Costo ElevenLabs (50% uso) | Margen Bruto |
|------|----------|-------------|---------------------------|--------------|
| Premium | 700 | $4,893 | $525 | $4,368 (89%) |
| Pro | 250 | $3,748 | $750 | $2,998 (80%) |
| Pro+ | 50 | $1,250 | $375 | $875 (70%) |
| **Total** | 1,000 | **$9,891** | **$1,650** | **$8,241 (83%)** |

**Margen bruto proyectado: 83%** (excelente para SaaS con AI)

### Costo Mensual de ElevenLabs para tu App

| Usuarios Activos | Plan ElevenLabs Necesario | Costo |
|------------------|---------------------------|-------|
| 1-100 | Starter ($5) | $5/mes |
| 100-500 | Creator ($22) | $22/mes |
| 500-2,000 | Pro ($99) | $99/mes |
| 2,000+ | Scale ($330) | $330/mes |

---

## Archivos a Crear/Modificar

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `supabase/migrations/xxx_add_voice_minutes.sql` | Crear | Columna y función de voz |
| `supabase/functions/elevenlabs-tts/index.ts` | Crear | Edge function de TTS |
| `src/hooks/utils/useElevenLabsTTS.ts` | Crear | Hook de TTS premium |
| `src/hooks/data/usePlanLimits.ts` | Modificar | Límites de minutos de voz |
| `src/components/chat/VoiceMinutesIndicator.tsx` | Crear | UI de uso |
| `src/components/chat/VoiceUpgradePrompt.tsx` | Crear | Modal de upgrade |
| `src/components/chat/PremiumVoiceBadge.tsx` | Crear | Badge visual |
| `src/components/chat/ChatAssistant.tsx` | Modificar | Integrar TTS premium |

---

## Respuesta a tus Preguntas

### ¿50 respuestas es muy poco?
**Sí.** Basado en patrones de uso de ChatGPT, un usuario activo usará 100-300 interacciones/mes. Por eso propongo **minutos de voz** (30-120) que equivalen a más respuestas pero controlan el costo.

### ¿Cómo evitar que se pasen del límite?
1. **Límite duro** + fallback automático a voz nativa (gratis)
2. **Notificaciones progresivas** al 50%, 80%, 100%
3. **Opción de comprar más** ($2.99/30 min adicionales)

### ¿Hay que cambiar precios?
**No necesariamente.** Con el modelo Turbo de ElevenLabs (0.5 créditos/char), los márgenes son saludables (60-79%). Opcionalmente podrías agregar un tier "Pro+" a $24.99 para usuarios que quieran ilimitado.

### ¿Por qué este modelo es mejor?
1. **Intuitivo:** "Minutos de voz" es más fácil de entender que "respuestas"
2. **Justo:** Respuestas largas consumen más, respuestas cortas menos
3. **Escalable:** Puedes ajustar límites sin cambiar estructura
4. **Rentable:** Márgenes del 60-83% según uso

