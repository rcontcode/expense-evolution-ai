

# Mejorar Empty States con Guía Accionable

## Problema
Cuando el usuario ve "No se detectaron suscripciones" o estados vacíos similares, no hay botones claros para ir a registrar gastos, importar extractos, o crear pagos fijos. Solo texto descriptivo sin acción directa.

## Componentes a mejorar

### 1. `SubscriptionTracker.tsx` — Empty state (líneas 565-593)
**Ahora**: Solo texto + íconos decorativos (Gastos + Extractos = Detección)
**Mejora**: Convertir los pills en **botones con links reales**:
- "Gastos" → navega a `/expenses`
- "Extractos" → abre diálogo de importación bancaria o navega a `/banking`
- "Pagos Fijos" → navega a `/bills`
- Agregar texto explicativo: "El sistema analiza automáticamente tus gastos y extractos bancarios para detectar cobros recurrentes"

### 2. `BillsManager.tsx` — Empty state (líneas 112-123)
**Ahora**: Tiene botón "Agregar primero" ✅ pero falta contexto
**Mejora**: Agregar tips debajo: "También puedes: registrar gastos recurrentes → se detectan automáticamente | Importar extracto bancario | Usar captura inteligente (voz/texto/foto)"

### 3. `BankAnalysisDashboard.tsx` — Recurring payments empty (línea 483)
**Ahora**: Solo texto "No se detectaron pagos recurrentes. Importa más transacciones..."
**Mejora**: Agregar botón "Importar Estado de Cuenta" que llame a `onImportClick`

### 4. `SpendingVelocityMonitor.tsx` — Sin empty state visible
### 5. `WeeklySpendingDigest.tsx` — Sin empty state visible  
### 6. `MerchantIntelligence.tsx` — Sin empty state visible

Para los 3 de banking, verificar si muestran algo útil cuando no hay datos o si se quedan en blanco.

## Archivos a modificar (3 principales)
1. `src/components/subscriptions/SubscriptionTracker.tsx` — Convertir pills en botones navegables + agregar botón "Ir a Pagos Fijos"
2. `src/components/bills/BillsManager.tsx` — Agregar tips de otras formas de registrar
3. `src/components/banking/BankAnalysisDashboard.tsx` — Agregar botón accionable en empty state de recurrentes

