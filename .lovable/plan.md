
# Plan: Arreglar el Asistente de Voz Completamente

## Resumen Ejecutivo

Después de revisar todo el código, identifiqué 5 problemas críticos que causan que el asistente no navegue, no cree gastos, no abra clientes, y no haga tutorials con highlights:

| Problema | Causa Raíz | Impacto |
|----------|-----------|---------|
| Navegación falla | `executeAIAction` no maneja action `'open'` | Alto |
| Crear gasto falla | Se envía `user_id: ''` vacío a la BD | Alto |
| Abrir cliente falla | Conflicto entre procesamiento local y backend | Medio |
| Highlights no aparecen | No se activan con respuestas de acción | Medio |
| Tutorial no es interactivo | No hay "runner" que avance paso a paso | Bajo |

## Fase 1: Arreglar Navegación y Ejecución de Acciones

**Archivo:** `src/components/chat/ChatAssistant.tsx`

**Problema:** El switch de `executeAIAction` (líneas 917-975) solo maneja `navigate`, `query`, `highlight`. Falta manejar `open` para abrir items específicos (clientes, proyectos, etc.).

**Cambios:**
```typescript
// Agregar case 'open' después de case 'navigate'
case 'open':
  // Navegar primero a la sección
  const openRoute = action.route || (action.target ? ROUTE_MAP[action.target] : null);
  if (openRoute) {
    navigate(openRoute);
    toast.success(action.message);
    
    // Si hay un item específico, disparar evento para abrirlo
    if (action.data?.itemName) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('voice-command-action', {
            detail: { 
              action: 'open-item', 
              itemName: action.data.itemName,
              section: action.target 
            },
          })
        );
      }, 700);
    }
  }
  break;
```

## Fase 2: Arreglar Creación de Gastos por Voz

**Archivo:** `src/components/chat/ChatAssistant.tsx`

**Problema:** Línea 573 pasa `user_id: ''` que causa error en BD porque es requerido.

**Cambios:**
```typescript
// ANTES (línea 566-574)
createExpense.mutate({
  amount: result.data.amount,
  vendor: result.data.vendor,
  category: result.data.category,
  date: new Date().toISOString().split('T')[0],
  status: 'pending',
  reimbursement_type: 'pending_classification',
  user_id: '',  // ← ESTO CAUSA EL ERROR
}, { ... })

// DESPUÉS - Quitar user_id (el hook ya lo agrega automáticamente)
createExpense.mutate({
  amount: result.data.amount,
  vendor: result.data.vendor,
  category: result.data.category,
  date: new Date().toISOString().split('T')[0],
  status: 'pending',
  reimbursement_type: 'pending_classification',
  // user_id se agrega automáticamente en useCreateExpense
}, { ... })
```

## Fase 3: Mejorar Highlights Automáticos

**Archivo:** `src/components/chat/ChatAssistant.tsx`

**Problema:** Los highlights solo se activan cuando NO hay acción (`!aiAction`). Deben activarse también CON acciones de navegación.

**Cambios en `executeAIAction`:**
```typescript
case 'navigate':
  // ...código existente de navegación...
  
  // NUEVO: Detectar highlights en el mensaje de respuesta
  const messageHighlights = detectHighlightTargets(
    action.message, 
    language as 'es' | 'en'
  );
  if (messageHighlights.length > 0) {
    setTimeout(() => highlight(messageHighlights), 1200);
  }
  break;
```

**Archivo:** `src/lib/highlight-detection.ts`

**Agregar más keywords para mejor detección:**
```typescript
// Agregar patrones más específicos que el asistente usa
'add-expense-button': {
  es: [...existentes, 'botón agregar', 'haz clic en agregar', 'presiona agregar'],
  en: [...existentes, 'add button', 'click add', 'press add'],
},
```

## Fase 4: Mejorar Backend para Respuestas más Inteligentes

**Archivo:** `supabase/functions/app-assistant/index.ts`

**Problema:** El backend a veces no devuelve acciones estructuradas correctamente.

**Cambios en el prompt del AI:**
```typescript
// Agregar al prompt instrucciones más claras sobre cuándo usar cada acción
const enhancedPrompt = `
...prompt existente...

CUANDO EL USUARIO PIDE NAVEGAR:
- SIEMPRE devuelve action:"navigate" con target y route
- Ejemplo: "llévame a gastos" → {"action":"navigate","target":"expenses","route":"/expenses","message":"Te llevo a Gastos"}

CUANDO EL USUARIO PIDE ABRIR UN ITEM ESPECÍFICO:
- SIEMPRE devuelve action:"open" con target, route y data.itemName
- Ejemplo: "abre el cliente ACME" → {"action":"open","target":"clients","route":"/clients","message":"Abriendo cliente ACME","data":{"itemName":"ACME"}}

CUANDO EXPLICAS ALGO, MENCIONA LOS BOTONES ESPECÍFICOS:
- Incluye frases como "haz clic en el botón Agregar Gasto" para que el frontend active highlights
`;
```

## Fase 5: Crear Tutorial Interactivo con Highlights Progresivos

**Archivo nuevo:** `src/hooks/utils/useTutorialRunner.ts`

**Propósito:** Un hook que ejecuta tutoriales paso a paso, avanzando automáticamente por páginas y activando highlights en secuencia.

```typescript
interface TutorialStep {
  route?: string;        // Navegar a esta ruta primero
  highlight: string;     // Selector del elemento a resaltar
  narration: string;     // Texto que el asistente dice
  waitForClick?: boolean; // Esperar a que el usuario haga clic
  delay?: number;        // Delay antes del siguiente paso
}

export function useTutorialRunner() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const runTutorial = (steps: TutorialStep[]) => {
    setIsRunning(true);
    executeStep(0, steps);
  };
  
  const executeStep = (index: number, steps: TutorialStep[]) => {
    if (index >= steps.length) {
      setIsRunning(false);
      return;
    }
    
    const step = steps[index];
    
    // Navegar si es necesario
    if (step.route) {
      navigate(step.route);
    }
    
    // Esperar a que la página cargue, luego highlight
    setTimeout(() => {
      highlight([{ selector: step.highlight, label: step.narration }]);
      speak(step.narration);
      
      // Avanzar al siguiente paso
      setTimeout(() => {
        executeStep(index + 1, steps);
      }, step.delay || 4000);
    }, step.route ? 800 : 200);
  };
  
  return { runTutorial, currentStep, isRunning };
}
```

**Integración en ChatAssistant:**
```typescript
// Cuando el usuario pide un tutorial como "enséñame a agregar un gasto"
case 'tutorial':
  const expenseTutorialSteps: TutorialStep[] = [
    { 
      route: '/expenses', 
      highlight: 'add-expense-button', 
      narration: 'Primero, ve a la sección de Gastos y haz clic en el botón Agregar Gasto.' 
    },
    { 
      highlight: 'expense-form-vendor', 
      narration: 'Aquí escribes el nombre del comercio o proveedor.' 
    },
    { 
      highlight: 'expense-form-amount', 
      narration: 'Ingresa el monto del gasto.' 
    },
    // ...más pasos
  ];
  tutorialRunner.runTutorial(expenseTutorialSteps);
  break;
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/chat/ChatAssistant.tsx` | Agregar case `'open'`, quitar `user_id: ''`, mejorar highlights |
| `src/lib/highlight-detection.ts` | Agregar más keywords de detección |
| `supabase/functions/app-assistant/index.ts` | Mejorar prompt para respuestas estructuradas |
| `src/hooks/utils/useTutorialRunner.ts` | **NUEVO** - Hook para tutoriales interactivos |

## Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/utils/useTutorialRunner.ts` | Runner de tutoriales paso a paso |
| `src/data/tutorials.ts` | Definiciones de tutoriales con pasos |

## Orden de Implementación

1. **Fase 1 + 2** (Crítico): Arreglar navegación y creación de gastos
2. **Fase 3** (Alto): Mejorar highlights automáticos
3. **Fase 4** (Medio): Mejorar backend
4. **Fase 5** (Mejora): Tutorial interactivo

## Tiempo Estimado
- Fases 1-3: 1 sesión
- Fase 4: 1 sesión
- Fase 5: 1-2 sesiones

---

## Sección Técnica Detallada

### Problema 1: user_id vacío

El hook `useCreateExpense` en `src/hooks/data/useExpenses.ts` probablemente ya agrega el `user_id` automáticamente desde el contexto de autenticación. Verificar este hook para confirmar y eliminar el campo `user_id: ''` del mutate call.

### Problema 2: Flujo de acciones

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                        FLUJO ACTUAL (ROTO)                                │
├───────────────────────────────────────────────────────────────────────────┤
│  Usuario dice: "abre el cliente ACME"                                     │
│       ↓                                                                   │
│  VoiceCommandProcessor: Intenta match local                              │
│       ↓                                                                   │
│  Si NO match local → ai-fallback → Backend                               │
│       ↓                                                                   │
│  Backend responde: {action: "open", target: "clients", ...}              │
│       ↓                                                                   │
│  executeAIAction: switch(action.action)                                   │
│       ↓                                                                   │
│  case 'open': ← NO EXISTE! → No hace nada                                │
└───────────────────────────────────────────────────────────────────────────┘
```

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                        FLUJO CORREGIDO                                    │
├───────────────────────────────────────────────────────────────────────────┤
│  Usuario dice: "abre el cliente ACME"                                     │
│       ↓                                                                   │
│  VoiceCommandProcessor: Match local con parseOpenClientCommand           │
│       ↓                                                                   │
│  Resultado: {type: 'open-client', clientId, clientName}                  │
│       ↓                                                                   │
│  ChatAssistant: navigate('/clients') + dispatch event                    │
│       ↓                                                                   │
│  Clients.tsx: Escucha evento → Abre modal del cliente                    │
│       ↓                                                                   │
│  ✓ FUNCIONA                                                              │
└───────────────────────────────────────────────────────────────────────────┘
```

### Problema 3: Highlights no se activan

El código actual (línea 1225-1232) solo detecta highlights cuando `!aiAction`:

```typescript
// Detect and trigger highlights based on response content (for text responses)
if (!aiAction && isHighlightEnabled) {
  const detectedHighlights = detectHighlightTargets(responseText, language as 'es' | 'en');
  ...
}
```

Esto significa que cuando el backend devuelve una acción estructurada (navigate, query, etc.), los highlights nunca se activan, aunque el mensaje podría mencionar botones específicos.
