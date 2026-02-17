
# Flujo de Suscripciones Detectadas: Diagnostico y Correccion

## Como funciona hoy

El flujo de deteccion de suscripciones desde extractos bancarios tiene **3 etapas**, pero hay una desconexion entre Banking y el resto del sistema:

```text
EXTRACTO BANCARIO (CSV/foto/PDF)
        |
        v
  [Edge Function: analyze-bank-statement]
        |
        v
  Tabla: bank_transactions (persistido)
        |
        +---> useBankInsights() --> recurringPayments (en memoria, NO se guarda)
        |         |
        |         v
        |    Banking/SubscriptionTracker (INFERIOR)
        |    - Solo muestra lista
        |    - NO puede convertir a gasto fijo
        |    - NO se conecta con Presupuesto
        |
        +---> useSubscriptionDetector() --> DetectedSubscription[] (en memoria)
                  |
                  v
             Subscriptions/SubscriptionTracker (SUPERIOR)
             - Analiza expenses + bank_transactions
             - PUEDE convertir a recurring_bills (tabla real)
             - Se usa en Dashboard, Budget, FamiliaArea
             - Pero NO se usa en Banking!
```

## El problema

1. **Banking usa el tracker INFERIOR**: El modulo de Banking (`/banking`) importa su propio `SubscriptionTracker` local que solo lee pagos recurrentes en memoria y no permite hacer nada con ellos.

2. **Las suscripciones detectadas nunca se guardan automaticamente**: Son calculadas en memoria cada vez. Solo se persisten cuando el usuario manualmente hace clic en "Convertir en gasto fijo" desde el tracker SUPERIOR (que no esta disponible en Banking).

3. **Resultado**: Si importas un extracto bancario en `/banking`, ves las suscripciones detectadas pero no puedes hacer nada con ellas. Tienes que ir a `/budget` o `/dashboard` para convertirlas en gastos fijos.

## Plan de correccion

### 1. Eliminar el SubscriptionTracker duplicado de Banking

Borrar el archivo `src/components/banking/SubscriptionTracker.tsx` (222 lineas) que es la version inferior.

### 2. Actualizar BankAnalysisDashboard para usar el tracker superior

En `src/components/banking/BankAnalysisDashboard.tsx`, cambiar el import de:
```
import { SubscriptionTracker } from './SubscriptionTracker';
```
a:
```
import { SubscriptionTracker } from '@/components/subscriptions/SubscriptionTracker';
```

Esto le da al usuario en Banking la misma capacidad que ya tiene en Dashboard y Budget: ver suscripciones detectadas con score de confianza y boton "Convertir en gasto fijo".

### 3. Actualizar el barrel export de Banking

En `src/components/banking/index.ts`, eliminar la linea:
```
export { SubscriptionTracker } from './SubscriptionTracker';
```

### Resultado

- El usuario importa su extracto bancario en `/banking`
- Ve las suscripciones detectadas (igual que antes)
- Ahora puede hacer clic en "Convertir en gasto fijo" directamente desde Banking
- Eso inserta en la tabla `recurring_bills`
- El gasto fijo aparece en Presupuesto > Pagos, con fecha de proximo cobro y alertas

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/banking/SubscriptionTracker.tsx` | ELIMINAR |
| `src/components/banking/BankAnalysisDashboard.tsx` | Cambiar import a `@/components/subscriptions/SubscriptionTracker` |
| `src/components/banking/index.ts` | Quitar export del tracker eliminado |

Solo 3 archivos. Sin cambios de logica ni base de datos. El tracker superior ya existe y funciona perfectamente.
