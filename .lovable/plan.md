
# Plan: Mejoras Integrales de UX - Onboarding, Busqueda Global, Dashboard Movil y Nudges

## Resumen Ejecutivo

Implementaremos 4 sistemas complementarios que transformaran la experiencia de usuario:

| Sistema | Descripcion | Impacto |
|---------|------------|---------|
| Onboarding Progresivo | Guia paso a paso hasta completar primera tarea real | Alto |
| Busqueda Global (Cmd+K) | Encontrar gastos, clientes, proyectos desde cualquier lugar | Alto |
| Dashboard Movil Optimizado | Simplificar interfaz y priorizar acciones en pantallas pequenas | Medio |
| Sistema de Nudges | Recordatorios inteligentes para tareas pendientes | Medio |

---

## Sistema 1: Onboarding Progresivo

### Concepto
Transformar el tutorial actual (pasivo, solo informativo) en un flujo activo que guia al usuario hasta completar su primera tarea real.

### Arquitectura

```text
Flujo Actual (Pasivo)
---------------------
Tutorial -> Ver info -> Ver info -> ... -> Cerrar -> Usuario solo

Flujo Nuevo (Activo)
--------------------
Tutorial Interactivo -> Navegacion real -> Highlight botones -> 
Guiar llenado -> Celebrar logro -> Siguiente tarea
```

### Componentes

**1. ProgressiveOnboarding.tsx (Nuevo)**
- Detecta si usuario es nuevo (sin gastos, sin clientes, sin ingresos)
- Presenta 3 objetivos iniciales con progreso visual
- Cada objetivo usa el TutorialRunner existente
- Celebra cada logro con confetti

**2. Objetivos del Onboarding**
```typescript
const ONBOARDING_GOALS = [
  {
    id: 'first-expense',
    title: { es: 'Registra tu primer gasto', en: 'Record your first expense' },
    description: { es: 'Te guio paso a paso', en: "I'll guide you step by step" },
    checkComplete: async () => expenseCount > 0,
    tutorial: [
      { route: '/expenses', highlight: 'add-expense-button', narration: '...', autoClick: true },
      { highlight: 'expense-form-vendor', narration: '...' },
      { highlight: 'expense-form-amount', narration: '...' },
      { highlight: 'expense-submit', narration: '...' },
    ]
  },
  {
    id: 'first-client',
    title: { es: 'Agrega un cliente', en: 'Add a client' },
    // ...similar
  },
  {
    id: 'first-income',
    title: { es: 'Registra un ingreso', en: 'Record income' },
    // ...similar
  }
];
```

**3. Integracion con Dashboard**
- Mostrar widget de progreso en Dashboard si onboarding no completo
- Reemplazar InteractiveWelcome con ProgressiveOnboarding para usuarios nuevos

### Archivos a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/onboarding/ProgressiveOnboarding.tsx` | NUEVO - Widget de onboarding activo |
| `src/hooks/utils/useOnboardingProgress.ts` | NUEVO - Estado de progreso |
| `src/data/tutorials.ts` | Agregar tutoriales de onboarding |
| `src/pages/Dashboard.tsx` | Integrar ProgressiveOnboarding |

---

## Sistema 2: Busqueda Global (Cmd+K)

### Concepto
Barra de busqueda universal accesible desde cualquier lugar con Cmd+K (Mac) o Ctrl+K (Windows).

### Arquitectura

```text
Usuario presiona Cmd+K
        |
        v
+-------------------+
|  Global Search    |
|  Dialog (cmdk)    |
+-------------------+
        |
        v
+-------+-------+-------+
|       |       |       |
v       v       v       v
Gastos  Clientes  Proyectos  Navegacion
```

### Categorias de Busqueda

1. **Navegacion Rapida**: Dashboard, Gastos, Clientes, etc.
2. **Busqueda de Gastos**: Por vendor, monto, categoria
3. **Busqueda de Clientes**: Por nombre
4. **Busqueda de Proyectos**: Por nombre
5. **Acciones Rapidas**: Agregar gasto, Agregar cliente, Capturar recibo

### Componente Principal

```typescript
// GlobalSearch.tsx
const QUICK_ACTIONS = [
  { icon: Receipt, label: 'Agregar Gasto', action: () => navigate('/expenses'), shortcut: 'E' },
  { icon: Camera, label: 'Capturar Recibo', action: () => setQuickCaptureOpen(true), shortcut: 'C' },
  { icon: Users, label: 'Agregar Cliente', action: () => navigate('/clients'), shortcut: 'K' },
];

const NAVIGATION_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Receipt, label: 'Gastos', path: '/expenses' },
  // ...
];
```

### Busqueda en Tiempo Real
- Debounce de 300ms
- Buscar en Supabase con queries optimizadas
- Mostrar resultados agrupados por tipo
- Preview del item seleccionado

### Archivos a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/search/GlobalSearch.tsx` | NUEVO - Dialogo de busqueda |
| `src/components/search/SearchResults.tsx` | NUEVO - Resultados agrupados |
| `src/hooks/utils/useGlobalSearch.ts` | NUEVO - Logica de busqueda |
| `src/components/Layout.tsx` | Agregar keyboard listener y trigger |
| `src/App.tsx` | Agregar GlobalSearch al nivel de app |

### Integracion con Voz
- El asistente de voz puede abrir la busqueda con "buscar" o "search"
- Los resultados de busqueda pueden ser leidos en voz alta

---

## Sistema 3: Dashboard Movil Optimizado

### Problemas Actuales
1. Control Center con 10+ tabs es abrumador en movil
2. InteractiveWelcome ocupa mucho espacio
3. Navegacion inferior tiene items fijos, no adaptativos

### Solucion: Dashboard Movil Simplificado

**1. Header Compacto con Stats Clave**
```typescript
// MobileDashboardHeader.tsx
<div className="flex items-center justify-between p-3">
  <div className="text-center">
    <span className="text-2xl font-bold">${monthlyTotal}</span>
    <span className="text-xs text-muted-foreground">Este mes</span>
  </div>
  <Separator orientation="vertical" />
  <div className="text-center">
    <span className="text-2xl font-bold text-green-600">+${income}</span>
    <span className="text-xs text-muted-foreground">Ingresos</span>
  </div>
  <Separator orientation="vertical" />
  <div className="text-center">
    <span className="text-2xl font-bold text-red-600">-${expenses}</span>
    <span className="text-xs text-muted-foreground">Gastos</span>
  </div>
</div>
```

**2. Acciones Rapidas Flotantes**
- FAB (Floating Action Button) con acciones mas frecuentes
- Se expande con opciones: Agregar Gasto, Capturar, Agregar Ingreso

**3. Timeline Simplificado**
- Mostrar solo ultimos 3 meses en grafico simplificado
- Swipe horizontal para ver mas meses

**4. Control Center Colapsado por Defecto**
- Solo mostrar 3 herramientas principales
- "Ver mas" para acceder al resto

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Dashboard.tsx` | Condicional para vista movil |
| `src/components/dashboard/MobileDashboard.tsx` | NUEVO - Vista optimizada |
| `src/components/dashboard/MobileQuickActions.tsx` | NUEVO - FAB con acciones |
| `src/components/dashboard/MobileTimeline.tsx` | NUEVO - Timeline simplificado |

---

## Sistema 4: Sistema de Nudges Inteligentes

### Concepto
Recordatorios contextuales y no intrusivos que guian al usuario a completar tareas pendientes.

### Tipos de Nudges

1. **Tareas Pendientes**
   - Documentos sin clasificar
   - Gastos incompletos
   - Gastos sin asignar a cliente

2. **Habitos Financieros**
   - "Hace 3 dias que no registras gastos"
   - "Tienes ingresos sin categorizar"

3. **Oportunidades**
   - "Detectamos suscripciones que podrias revisar"
   - "Tienes gastos deducibles sin clasificar"

4. **Celebraciones**
   - "Registraste todos tus gastos esta semana"
   - "Tu balance es positivo este mes"

### Arquitectura

```typescript
// useNudgeSystem.ts
interface Nudge {
  id: string;
  type: 'task' | 'habit' | 'opportunity' | 'celebration';
  priority: 'high' | 'medium' | 'low';
  title: { es: string; en: string };
  message: { es: string; en: string };
  action?: { label: { es: string; en: string }; path: string };
  condition: () => Promise<boolean>;
  cooldown: number; // horas antes de mostrar de nuevo
}
```

### Componente NudgeBanner

```typescript
// NudgeBanner.tsx
- Muestra el nudge de mayor prioridad
- Animacion sutil de entrada
- Boton de accion y dismiss
- Cooldown de 24h por nudge
- Maximo 1 nudge visible a la vez
```

### Integracion con NextActionBanner Existente
- Expandir `NextActionBanner.tsx` para incluir nudges
- Priorizar: Tareas pendientes > Habitos > Oportunidades > Celebraciones

### Archivos a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/utils/useNudgeSystem.ts` | NUEVO - Logica de nudges |
| `src/components/nudges/NudgeBanner.tsx` | NUEVO - Componente de nudge |
| `src/components/nudges/nudge-definitions.ts` | NUEVO - Definiciones de nudges |
| `src/pages/Dashboard.tsx` | Integrar NudgeBanner |

---

## Seccion Tecnica Detallada

### Global Search - Queries Optimizadas

```typescript
// useGlobalSearch.ts
const searchExpenses = async (query: string) => {
  const { data } = await supabase
    .from('expenses')
    .select('id, vendor, amount, date, category')
    .eq('user_id', user.id)
    .or(`vendor.ilike.%${query}%, notes.ilike.%${query}%`)
    .order('date', { ascending: false })
    .limit(5);
  return data;
};

const searchClients = async (query: string) => {
  const { data } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('user_id', user.id)
    .ilike('name', `%${query}%`)
    .limit(5);
  return data;
};
```

### Keyboard Listener para Cmd+K

```typescript
// useGlobalSearchShortcut.ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Onboarding Progress Tracking

```typescript
// useOnboardingProgress.ts
const STORAGE_KEY = 'evofinz_onboarding_progress';

interface OnboardingProgress {
  firstExpenseCompleted: boolean;
  firstClientCompleted: boolean;
  firstIncomeCompleted: boolean;
  completedAt?: string;
}

// Verificar en Supabase, no solo localStorage
const checkProgress = async () => {
  const [expenses, clients, income] = await Promise.all([
    supabase.from('expenses').select('id').eq('user_id', user.id).limit(1),
    supabase.from('clients').select('id').eq('user_id', user.id).limit(1),
    supabase.from('income').select('id').eq('user_id', user.id).limit(1),
  ]);
  
  return {
    firstExpenseCompleted: (expenses.data?.length || 0) > 0,
    firstClientCompleted: (clients.data?.length || 0) > 0,
    firstIncomeCompleted: (income.data?.length || 0) > 0,
  };
};
```

---

## Orden de Implementacion

### Fase 1: Busqueda Global (Alta Prioridad)
1. Crear `GlobalSearch.tsx` usando cmdk existente
2. Implementar `useGlobalSearch.ts`
3. Agregar keyboard listener en Layout
4. Integrar con sistema de voz

### Fase 2: Onboarding Progresivo
1. Crear `useOnboardingProgress.ts`
2. Crear `ProgressiveOnboarding.tsx`
3. Agregar tutoriales de onboarding
4. Integrar en Dashboard

### Fase 3: Dashboard Movil
1. Crear `MobileDashboard.tsx`
2. Crear `MobileQuickActions.tsx`
3. Simplificar Timeline para movil
4. Modificar Dashboard.tsx para usar version movil

### Fase 4: Sistema de Nudges
1. Crear `useNudgeSystem.ts`
2. Definir nudges en `nudge-definitions.ts`
3. Crear `NudgeBanner.tsx`
4. Integrar en Dashboard

---

## Resumen de Archivos

### Nuevos (12 archivos)
- `src/components/search/GlobalSearch.tsx`
- `src/components/search/SearchResults.tsx`
- `src/hooks/utils/useGlobalSearch.ts`
- `src/hooks/utils/useGlobalSearchShortcut.ts`
- `src/components/onboarding/ProgressiveOnboarding.tsx`
- `src/hooks/utils/useOnboardingProgress.ts`
- `src/components/dashboard/MobileDashboard.tsx`
- `src/components/dashboard/MobileQuickActions.tsx`
- `src/components/dashboard/MobileTimeline.tsx`
- `src/hooks/utils/useNudgeSystem.ts`
- `src/components/nudges/NudgeBanner.tsx`
- `src/components/nudges/nudge-definitions.ts`

### Modificados (4 archivos)
- `src/components/Layout.tsx`
- `src/pages/Dashboard.tsx`
- `src/data/tutorials.ts`
- `src/App.tsx`

---

## Tiempo Estimado
- Fase 1 (Busqueda Global): 1 sesion
- Fase 2 (Onboarding): 1 sesion
- Fase 3 (Dashboard Movil): 1 sesion
- Fase 4 (Nudges): 1 sesion

Total: 4 sesiones para implementacion completa
