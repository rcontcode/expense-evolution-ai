
# Plan: Sistema de Sonidos Avanzado y Configurable

## Resumen Ejecutivo

Crearemos un sistema de audio completo que transforme la experiencia de la app con sonidos temáticos del "Phoenix" - celebraciones, feedback de acciones, notificaciones y ambiente. Todo será **completamente configurable** por el usuario.

---

## Análisis del Sistema Actual

### Lo que ya existe:
1. **`useCelebrationSound.ts`** - 3 melodías generadas con Web Audio API (éxito, celebración, full)
2. **`useVoicePreferences.ts`** - Toggle `enableSoundEffects` + 5 sonidos básicos (success, error, confirm, notification, listening)
3. **`use-haptic.ts`** - Feedback táctil para móvil (7 patrones)
4. **Lugares donde se usan sonidos:**
   - Level up / achievements (confetti + full celebration)
   - Goal milestones
   - Reconciliation wizard
   - Mobile capture
   - Some atomic habits interactions

### Lo que falta:
- Sonidos NO están siendo usados en la mayoría de acciones CRUD
- Los sonidos actuales son simples "beeps" monotonos
- No hay variedad temática (Phoenix)
- No hay configuración granular por tipo de sonido
- No hay opción de usar ElevenLabs para SFX premium

---

## Solución Propuesta

### 1. Nuevo Hook Centralizado: `useAppSounds`

Un hook unificado que proporcione todos los sonidos de la app con configuración granular:

```text
Categorías de Sonidos:
├── 🎯 Actions (CRUD)
│   ├── create - Al crear gasto/ingreso/cliente
│   ├── update - Al editar
│   ├── delete - Al eliminar
│   └── save - Al guardar cambios
├── 🎉 Celebrations  
│   ├── goalReached - Meta alcanzada
│   ├── levelUp - Subir de nivel
│   ├── achievement - Logro desbloqueado
│   └── streakMilestone - Racha de días
├── 📱 Navigation
│   ├── pageTransition - Cambio de página
│   ├── tabSwitch - Cambio de tab
│   └── menuOpen - Abrir menú/drawer
├── ⚠️ Feedback
│   ├── success - Operación exitosa
│   ├── error - Error
│   ├── warning - Advertencia
│   └── notification - Nueva notificación
└── 🎵 Ambient (opcional)
    ├── focusMode - Sonido de fondo sutil
    └── timerComplete - Timer completado
```

### 2. Mejora de Melodías con Tema Phoenix

Reemplazar los sonidos básicos con melodías musicales temáticas:

| Sonido | Descripción Musical |
|--------|---------------------|
| **create** | Ascenso C-E-G con shimmer (renacimiento) |
| **delete** | Descenso suave G-E-C (cenizas) |
| **success** | Fanfarria corta C-E-G-C6 |
| **levelUp** | Épico con armonías y flourish |
| **error** | Dos notas descendentes en menor |
| **notification** | Campanita amigable (triangle wave) |

### 3. Panel de Configuración Expandido

Agregar sección en Configuración y en el asistente:

```text
🔊 Sonidos de la App
├── [Toggle] Sonidos activados
├── [Slider] Volumen general: 0-100%
├── Categorías:
│   ├── [Toggle] Acciones (crear, editar, eliminar)
│   ├── [Toggle] Celebraciones (logros, metas)
│   ├── [Toggle] Navegación
│   └── [Toggle] Notificaciones
├── [Select] Estilo de sonidos:
│   ├── 🔥 Phoenix (defecto) - Temático con fuego/renacimiento
│   ├── 🎹 Minimal - Tonos simples y sutiles
│   └── 🎮 Arcade - Retro 8-bit
└── [Toggle] Vibración táctil (móvil)
```

### 4. Integración Automática en Hooks de Datos

Modificar los hooks de mutación para incluir sonidos automáticamente:

**Archivos a modificar:**
- `useExpenses.ts` - create/update/delete expenses
- `useIncome.ts` - create/update/delete income
- `useClients.ts` - CRUD clientes
- `useProjects.ts` - CRUD proyectos
- `useMileageEntries.ts` - CRUD kilometraje
- `useAssets.ts` / `useLiabilities.ts` - patrimonio
- Y otros hooks de datos principales

---

## Cambios Técnicos Detallados

### Archivos a Crear:

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/utils/useAppSounds.ts` | Hook central con todas las melodías y lógica de reproducción |
| `src/components/settings/SoundPreferencesPanel.tsx` | UI de configuración completa de sonidos |

### Archivos a Modificar:

| Archivo | Cambio |
|---------|--------|
| `src/hooks/utils/useVoicePreferences.ts` | Expandir preferencias con categorías granulares |
| `src/hooks/utils/useCelebrationSound.ts` | Mejorar melodías existentes, agregar nuevas |
| `src/components/chat/VoiceSettingsPanel.tsx` | Agregar acceso rápido a configuración de sonidos |
| `src/components/settings/VoicePreferencesCard.tsx` | Integrar nuevo panel de sonidos |
| Múltiples hooks de datos | Agregar llamadas a sonidos en callbacks de mutación |

---

## Ejemplo de Nuevas Melodías

```text
CREATE SOUND (Phoenix Birth):
  ┌─────────────────────────────────┐
  │ E5 ─┐                           │
  │     └─ G5 ─┐                    │
  │            └─ C6 (shimmer)      │
  │ Tiempo: 0.35s | Tipo: sine+tri  │
  └─────────────────────────────────┘

DELETE SOUND (Ashes Fall):
  ┌─────────────────────────────────┐
  │ G5 ─┐                           │
  │     └─ E5 ─┐                    │
  │            └─ C5 (fade)         │
  │ Tiempo: 0.3s | Tipo: sine       │
  └─────────────────────────────────┘

LEVEL UP (Epic Fanfare):
  ┌─────────────────────────────────┐
  │ G4→C5→E5→G5  [Rising arpeggio]  │
  │ C6+G5+E5     [Triumph chord]    │
  │ D6→E6+C6     [Final flourish]   │
  │ Tiempo: 1.2s | Harmonics + echo │
  └─────────────────────────────────┘
```

---

## Resumen de Entregables

1. **Hook `useAppSounds`** - Sistema centralizado con 15+ sonidos temáticos Phoenix
2. **Configuración granular** - Toggle por categoría + estilos + volumen
3. **Panel en Configuración** - UI completa para personalizar
4. **Panel en Asistente** - Acceso rápido desde el chat
5. **Integración automática** - Sonidos en todas las acciones CRUD principales
6. **Melodías mejoradas** - Musicales, temáticas y satisfactorias
7. **Sincronización con haptics** - Vibración + sonido coordinados en móvil

