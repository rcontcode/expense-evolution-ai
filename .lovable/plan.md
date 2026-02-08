
# Plan: Mejorar el Asistente Phoenix y Crear Onboarding Conversacional

---

## Resumen Ejecutivo

Tu sistema tiene tres áreas a mejorar:

1. **El asistente NO está usando el perfil financiero del usuario** - Existe la tabla `user_financial_profile` con datos valiosos (pasiones, talentos, tolerancia al riesgo, metas) pero NUNCA se envía al asistente IA.

2. **El onboarding actual es básico** - Solo pregunta provincia, tipo de trabajo, y si tiene clientes. No recopila información profunda sobre la situación financiera del usuario.

3. **No hay opción conversacional** - Excelente idea. Podemos ofrecer un "onboarding guiado por Phoenix" donde el asistente hace preguntas naturales y llena el perfil automáticamente.

---

## Fase 1: Enriquecer el Contexto del Asistente con el Perfil del Usuario

### Problema Actual

El asistente recibe:
- Ruta actual
- Gastos/Ingresos del mes
- Clientes y proyectos

El asistente NO recibe:
- Perfil financiero (metas, tolerancia al riesgo, experiencia)
- Tipo de trabajo del usuario
- País/provincia
- Nivel educativo financiero

### Cambios a Implementar

**Archivo: `src/components/chat/ChatAssistant.tsx`**

Agregar hook para obtener perfil financiero:
```typescript
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';

// Dentro del componente:
const { data: financialProfile } = useFinancialProfile();
```

Enriquecer el `userContext` enviado al backend:
```typescript
const userContext = {
  // Existentes...
  userName,
  currentRoute: location.pathname,
  // ...

  // NUEVOS - Perfil del usuario
  workTypes: profile?.work_types || [],
  country: profile?.country || 'Canada',
  province: profile?.province,
  
  // NUEVOS - Perfil financiero
  financialProfile: financialProfile ? {
    experienceLevel: financialProfile.financial_education_level,
    riskTolerance: financialProfile.risk_tolerance,
    goals: financialProfile.passions,        // Metas del usuario
    interests: financialProfile.interests,    // Tipos de inversión
    talents: financialProfile.talents,
    availableCapital: financialProfile.available_capital,
    monthlyInvestmentCapacity: financialProfile.monthly_investment_capacity,
    preferredIncomeType: financialProfile.preferred_income_type,
    timeAvailability: financialProfile.time_availability,
  } : null,
};
```

**Archivo: `supabase/functions/app-assistant/index.ts`**

Expandir la sección de contexto para incluir personalización:
```typescript
// En la construcción del contextSection (línea ~944)
if (userContext.financialProfile) {
  contextSection += `
## PERFIL FINANCIERO DEL USUARIO (PERSONALIZA TUS RESPUESTAS A ESTO)
- Nivel de experiencia: ${userContext.financialProfile.experienceLevel || 'principiante'}
- Tolerancia al riesgo: ${userContext.financialProfile.riskTolerance || 'moderada'}
- Metas financieras: ${userContext.financialProfile.goals?.join(', ') || 'no definidas'}
- Tipos de inversión preferidos: ${userContext.financialProfile.interests?.join(', ') || 'no definidos'}
- Capital disponible: $${userContext.financialProfile.availableCapital || 0}
- Capacidad mensual de inversión: $${userContext.financialProfile.monthlyInvestmentCapacity || 0}
- Tipo de ingreso preferido: ${userContext.financialProfile.preferredIncomeType || 'mixto'}
- Tiempo disponible: ${userContext.financialProfile.timeAvailability || 'parcial'}

**IMPORTANTE**: Usa esta información para:
1. Ajustar la complejidad de tus explicaciones (principiante vs avanzado)
2. Dar ejemplos relevantes a sus metas
3. Sugerir herramientas de la app alineadas a sus intereses
4. Ser empático con su nivel de riesgo
`;
}
```

---

## Fase 2: Mejorar el System Prompt con Ejemplos Personalizados

### Agregar sección de personalización al SYSTEM_PROMPT

```typescript
## PERSONALIZACIÓN SEGÚN PERFIL DEL USUARIO

### Si el usuario es PRINCIPIANTE:
- Usa analogías simples ("es como una cuenta de ahorro, pero...")
- Evita jerga técnica o explícala inmediatamente
- Da más contexto y tranquilidad
- Ejemplo: "Las acciones son como comprar pedacitos de empresas. Si la empresa crece, tu pedacito vale más."

### Si el usuario es INTERMEDIO:
- Puedes usar términos como "ETF", "diversificación", "rendimiento anualizado"
- Da datos más específicos
- Ejemplo: "Un ETF como VOO replica el S&P 500, con un expense ratio de 0.03%."

### Si el usuario es AVANZADO:
- Puedes discutir estrategias como DCA, rebalanceo, tax-loss harvesting
- Asume familiaridad con conceptos
- Ejemplo: "Podrías considerar hacer tax-loss harvesting antes de fin de año para compensar ganancias."

### Según su tolerancia al riesgo:
- **Conservador**: Enfócate en seguridad, bonos, fondos indexados, cuentas de ahorro
- **Moderado**: Balance entre crecimiento y seguridad, portafolio diversificado
- **Agresivo**: Puedes mencionar acciones individuales, crypto, real estate

### Según sus metas:
- **FIRE/Retiro temprano**: Calcula su número FIRE, sugiere la calculadora
- **Ingresos pasivos**: Enfócate en dividendos, real estate, royalties
- **Fondo de emergencia**: 3-6 meses de gastos, sugiere la meta en la app
```

---

## Fase 3: Onboarding Conversacional (Nueva Funcionalidad)

### Concepto

Crear un flujo donde Phoenix hace preguntas naturales para conocer al usuario:

```
Phoenix: "¡Hola María! 👋 Soy Phoenix, tu asistente financiero.
Para ayudarte mejor, me gustaría conocerte un poco. 
¿Cuál es tu principal preocupación financiera ahora mismo?"

[Chips de respuesta rápida]:
- "Salir de deudas"
- "Ahorrar para el retiro"
- "Aumentar mis ingresos"
- "Organizar mejor mis gastos"
- "Otra cosa..."
```

### Archivos Nuevos a Crear

**1. `src/components/onboarding/ConversationalOnboarding.tsx`**

Componente que implementa el flujo conversacional usando el asistente existente.

**2. `src/hooks/utils/useConversationalOnboarding.ts`**

Hook que maneja el estado del onboarding:
- Preguntas pendientes
- Respuestas recopiladas
- Progreso
- Guardado automático en `user_financial_profile`

### Flujo de Preguntas

| Paso | Pregunta Phoenix | Objetivo | Campo DB |
|------|------------------|----------|----------|
| 1 | "¿Cuál es tu principal meta financiera?" | Entender motivación | `passions` |
| 2 | "¿Cómo describirías tu experiencia con dinero e inversiones?" | Calibrar explicaciones | `financial_education_level` |
| 3 | "¿Qué te incomoda más: perder dinero o perder oportunidades?" | Determinar riesgo | `risk_tolerance` |
| 4 | "¿Cuánto tiempo puedes dedicar a tus finanzas cada semana?" | Planificar acciones | `time_availability` |
| 5 | "¿Tienes algún ahorro o capital disponible para invertir?" | Contextualizar consejos | `available_capital` |
| 6 | "¿Cuánto podrías apartar mensualmente para tus metas?" | Calcular proyecciones | `monthly_investment_capacity` |

### Integración con Onboarding Existente

Modificar `src/pages/Onboarding.tsx` para ofrecer dos opciones:

```jsx
<Card>
  <CardHeader>
    <CardTitle>¿Cómo prefieres configurar tu perfil?</CardTitle>
  </CardHeader>
  <CardContent className="grid grid-cols-2 gap-4">
    <Button onClick={() => setMode('traditional')}>
      <FileText className="mr-2" />
      Formulario rápido
      <span className="text-xs">~2 minutos</span>
    </Button>
    <Button onClick={() => setMode('conversational')} variant="outline">
      <MessageCircle className="mr-2" />
      Conversar con Phoenix
      <span className="text-xs">~5 minutos, más personalizado</span>
    </Button>
  </CardContent>
</Card>
```

---

## Fase 4: Nuevos Tutoriales para el Asistente

Agregar tutoriales faltantes al `VOICE_TUTORIALS`:

```typescript
// Nuevos tutoriales
{
  id: 'bank-reconciliation',
  name: { es: 'Reconciliación bancaria', en: 'Bank reconciliation' },
  triggers: ['reconciliar', 'reconcile', 'cruzar transacciones', 'match transactions'],
  steps: [...]
},
{
  id: 'beta-feedback',
  name: { es: 'Enviar feedback', en: 'Send feedback' },
  triggers: ['feedback', 'reportar', 'sugerir', 'bug', 'problema'],
  steps: [...]
},
{
  id: 'financial-journal',
  name: { es: 'Diario financiero', en: 'Financial journal' },
  triggers: ['diario', 'journal', 'reflexión', 'reflection'],
  steps: [...]
},
{
  id: 'habit-tracker',
  name: { es: 'Hábitos financieros', en: 'Financial habits' },
  triggers: ['hábitos', 'habits', 'racha', 'streak'],
  steps: [...]
},
```

---

## Resumen de Archivos a Modificar

| Archivo | Acción | Impacto |
|---------|--------|---------|
| `src/components/chat/ChatAssistant.tsx` | Agregar `useFinancialProfile`, enriquecer contexto | +30 líneas |
| `supabase/functions/app-assistant/index.ts` | Expandir contexto con perfil, mejorar system prompt | +100 líneas |
| `src/pages/Onboarding.tsx` | Agregar opción de modo conversacional | +50 líneas |
| `src/components/onboarding/ConversationalOnboarding.tsx` | **NUEVO**: Flujo conversacional | ~400 líneas |
| `src/hooks/utils/useConversationalOnboarding.ts` | **NUEVO**: Estado del onboarding | ~200 líneas |
| `src/hooks/utils/useSmartGuidance.ts` | Agregar tutoriales nuevos | +60 líneas |

---

## Beneficios Esperados

| Mejora | Impacto |
|--------|---------|
| **Respuestas personalizadas** | El asistente ajusta complejidad y ejemplos al nivel del usuario |
| **Ejemplos relevantes** | Usa las metas del usuario para dar consejos alineados |
| **Onboarding natural** | Los usuarios que prefieren conversar obtienen mejor experiencia |
| **Mayor engagement** | La app conoce mejor al usuario desde el inicio |
| **Mejores recomendaciones** | Las sugerencias de herramientas son más acertadas |

---

## Sección Técnica

### Estructura del Contexto Enriquecido

```typescript
interface EnrichedUserContext {
  // Básico
  userName: string;
  currentRoute: string;
  
  // Datos financieros
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  
  // Perfil de usuario
  workTypes: ('employee' | 'contractor' | 'corporation')[];
  country: string;
  province: string | null;
  
  // Perfil financiero (NUEVO)
  financialProfile: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    goals: string[];
    interests: string[];
    talents: string[];
    availableCapital: number;
    monthlyInvestmentCapacity: number;
    preferredIncomeType: 'active' | 'passive' | 'mixed';
    timeAvailability: 'minimal' | 'part_time' | 'full_time';
  } | null;
}
```

### Flujo del Onboarding Conversacional

```text
Usuario selecciona "Conversar con Phoenix"
              │
              ▼
┌──────────────────────────────────┐
│    Pregunta 1: Meta principal    │
│    (chips de respuesta rápida)   │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│    Pregunta 2: Experiencia       │
│    (3 opciones visuales)         │
└──────────────────────────────────┘
              │
              ▼
         ... (6 preguntas)
              │
              ▼
┌──────────────────────────────────┐
│    Resumen personalizado         │
│    "Basado en tus respuestas..." │
│    Recomendaciones inmediatas    │
└──────────────────────────────────┘
              │
              ▼
       Guardar en DB
       Ir al Dashboard
```

### Ejemplo de Respuesta Personalizada

**Sin perfil (actual):**
> "Para invertir, puedes usar la sección de Patrimonio Neto."

**Con perfil (mejorado):**
> "María, ya que tu meta es retirarte temprano y tienes tolerancia moderada al riesgo, te sugiero:
> 
> 1. Primero, ve a la **Calculadora FIRE** para ver tu número objetivo
> 2. Luego registra tus inversiones actuales en **Patrimonio Neto**
> 3. Con tus $1,500/mes de capacidad de inversión, podrías alcanzar tu meta en ~15 años
> 
> ¿Empezamos por calcular tu número FIRE?"

---

## Próximos Pasos

1. Implementar la integración del perfil financiero al contexto del asistente
2. Mejorar el System Prompt con personalización
3. Crear el componente de onboarding conversacional
4. Agregar los tutoriales faltantes
5. Probar el flujo completo con diferentes perfiles de usuario
