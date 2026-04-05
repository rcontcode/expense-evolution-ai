

# Plan: Resumen Narrativo Financiero Personalizado

## Qué es

Un nuevo componente **"Tu Panorama Financiero"** que genera un resumen en lenguaje natural — como una carta personalizada — describiendo todo lo que el sistema sabe del usuario: quién es, qué ingresos tiene, qué gasta, sus pagos recurrentes, clientes, y de dónde viene esa información. Se muestra en el Dashboard principal (vista "Resumen") justo debajo del Timeline.

## Ejemplo de resultado

> **Hola Carlos 👋 — Tu Panorama Financiero**
>
> Eres **persona natural**, trabajas como **empleado** y **contratista independiente**.
>
> 📥 **Ingresos** — $2.850.000/mes
> • Como empleado: sueldo de $1.800.000 (día 30 de cada mes)
> • Como contratista: 2 clientes activos
>   - **Acme Corp**: $650.000/mes (día 15)
>   - **Beta Ltd**: $400.000/mes (día 5)
>
> 📤 **Gastos fijos** — $1.200.000/mes
> • Arriendo: $450.000 • Electricidad: $35.000 • Internet: $29.990 ...
>
> 💳 **Transacciones bancarias**: 342 registradas (Banco Estado)
> Último import: 2 abr 2026 — 89 clasificadas, 12 pendientes
>
> 📊 **Balance**: +$1.650.000/mes · Tasa de ahorro: 58%
>
> 📁 **Fuentes**: 4 extractos bancarios, 23 boletas, 2 contratos procesados.
> Si algo no cuadra, revisa en [Centro de Revisión] o [Bandeja del Caos].

## Fuentes de datos (hooks existentes)

| Dato | Fuente |
|------|--------|
| Nombre, work_types, país | `useProfile()` |
| Clientes | `supabase.from('clients')` |
| Ingresos por tipo/fuente | `useIncome()` + `useIncomeSummary()` |
| Gastos recurrentes | `useRecurringBills()` |
| Transacciones bancarias | `useBankTransactions()` |
| Historial de importaciones | `bank_import_sessions` query |
| Documentos procesados | `supabase.from('documents')` count |
| Gastos del mes | `useDashboardStats()` |

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/data/useFinancialNarrative.ts` | **Crear** — hook que agrega todos los datos y genera la estructura narrativa |
| `src/components/dashboard/FinancialNarrativeCard.tsx` | **Crear** — componente visual con secciones colapsables |
| `src/pages/Dashboard.tsx` | **Modificar** — agregar el componente después del Banking Summary |

## Diseño técnico

### Hook `useFinancialNarrative`

Consume los hooks existentes (no queries nuevas) y retorna un objeto estructurado:

```typescript
interface FinancialNarrative {
  userName: string;
  workProfile: { types: string[]; country: string };
  incomeStreams: { source: string; type: string; amount: number; dayOfMonth?: number }[];
  totalMonthlyIncome: number;
  clients: { name: string; totalIncome: number }[];
  fixedExpenses: { name: string; amount: number; category: string }[];
  totalFixedExpenses: number;
  bankingSummary: { total: number; matched: number; pending: number; banks: string[]; lastImport?: string };
  documentSources: { receipts: number; contracts: number; bankStatements: number };
  balance: number;
  savingsRate: number;
  isLoading: boolean;
}
```

Agrega datos de `useProfile`, `useIncome`, `useRecurringBills`, `useBankTransactions`, y queries ligeras de conteo para documentos e importaciones. Detecta patrones de recurrencia (día del mes más frecuente por fuente de ingreso) analizando las fechas de los registros existentes.

### Componente `FinancialNarrativeCard`

- Card con gradiente sutil y título "Tu Panorama Financiero" / "Your Financial Overview"
- Secciones: Perfil → Ingresos → Gastos Fijos → Banca → Balance → Fuentes
- Cada sección colapsable con chevron
- Links internos: "Centro de Revisión", "Bandeja del Caos", "Pagos Fijos"
- Bilingüe (es/en) usando `useLanguage()`
- Estado vacío: si no hay datos suficientes, muestra guía de qué cargar primero

### Dashboard integration

Lazy-load del componente, insertado entre Banking Summary y Ecosystem:

```tsx
const FinancialNarrativeCard = lazy(() => import('@/components/dashboard/FinancialNarrativeCard'));

{/* After banking summary */}
<Suspense fallback={<Skeleton className="h-[300px]" />}>
  <FinancialNarrativeCard />
</Suspense>
```

## Alcance

- Sin IA ni edge functions — pura lógica client-side con datos existentes
- Sin tablas nuevas ni migraciones
- Sin nuevas dependencias

