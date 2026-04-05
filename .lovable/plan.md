

# Plan: Límite de Transacciones, Ingreso Incorrecto y Eliminación por Secciones

## Problemas Identificados

### 1. Límite de 5000 transacciones bancarias
El hook `useBankTransactions` tiene `.limit(5000)`. Si el usuario tiene más, las últimas se pierden silenciosamente. No hay aviso. El `BankingSummaryCard` y el `FinancialNarrativeCard` muestran datos parciales sin indicar que hay más.

### 2. BUG — Cálculo incorrecto de ingresos mensuales en el Panorama
En `useFinancialNarrative.ts` línea 120, la fórmula de promedio es:
```
sum / Math.max(amounts.length / divisor, 1)
```
Esto es matemáticamente incorrecto. Con 6 registros en 3 meses, calcula `sum / 2` en vez de `sum / 3`. La fórmula correcta es simplemente `sum / divisor`. Esto infla los promedios y explica el $29,024,000.

Además, el `totalMonthlyIncome` usa `stats?.monthlyIncome` que es solo del mes actual (no promedio del periodo seleccionado). Hay incoherencia entre los streams y el total.

### 3. No existe forma de eliminar datos por secciones
Solo hay: (a) papelera individual, (b) vaciar toda la papelera, (c) eliminar cuenta completa. No hay opción de "borrar todos mis gastos" o "borrar todas mis transacciones bancarias" sin tocar ingresos, clientes, etc.

## Solución

### Fix 1: Transacciones — aviso de límite + paginación futura
- En `useBankTransactions`, si `data.length === 5000`, el hook retorna un flag `hasMore: true`.
- En `BankingSummaryCard`, si `hasMore`, mostrar badge de advertencia: "Mostrando las últimas 5000 transacciones. Puede haber más."
- En `FinancialNarrativeCard`, usar count real via query `head: true` para el resumen bancario en vez del `.length` del array.

### Fix 2: Corregir fórmula de ingreso mensual
Cambiar línea 120 de:
```typescript
const avg = g.amounts.reduce((a, b) => a + b, 0) / Math.max(g.amounts.length / divisor, 1);
```
A:
```typescript
const total = g.amounts.reduce((a, b) => a + b, 0);
const avg = Math.round(total / divisor);
```
Y reemplazar `totalMonthlyIncome` para que use la suma de los streams calculados (coherente con el periodo) en vez del `stats?.monthlyIncome` del mes actual.

### Fix 3: Gestión de datos por secciones (nueva funcionalidad)
Crear un panel "Gestión de Datos" en Settings (junto a DataPrivacyCard) con opciones para eliminar por sección:
- Gastos
- Ingresos
- Transacciones bancarias
- Contratos
- Kilometraje
- Clientes y Proyectos
- Documentos/Archivos

Cada sección muestra el conteo actual y un botón "Eliminar todo". Requiere confirmación con texto "ELIMINAR" y ejecuta hard delete (no soft delete). Incluye audit log.

## Archivos a Crear/Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/data/useFinancialNarrative.ts` | Fix fórmula de promedio, usar suma de streams como total |
| `src/hooks/data/useBankTransactions.ts` | Retornar flag `hasMore` cuando llega al límite |
| `src/components/banking/BankingSummaryCard.tsx` | Mostrar aviso si `hasMore` |
| `src/components/settings/DataManagementCard.tsx` | **Crear** — panel de eliminación por secciones |
| `src/pages/Settings.tsx` | Agregar DataManagementCard |

## Detalle Técnico

**DataManagementCard**: Cada sección usa un query `{ count: 'exact', head: true }` para mostrar el conteo. Al confirmar eliminación:
1. Elimina relaciones dependientes primero (expense_tags, documents.expense_id)
2. Hard delete de la tabla principal con `.eq('user_id', user.id)`
3. Para transacciones bancarias: también limpia `bank_import_sessions`
4. Invalida caches relevantes
5. Muestra toast con conteo eliminado

Confirmación: el usuario debe escribir "ELIMINAR" (o "DELETE" en inglés) para activar el botón. Cada sección tiene su propio diálogo independiente.

**Flujo de corrección de datos para el usuario**: El panel incluirá un texto explicativo: "Si ves datos incorrectos, puedes: (1) Ir a la sección correspondiente y editar/eliminar registros individuales, (2) Usar la Papelera para recuperar eliminaciones recientes, (3) Eliminar toda una sección aquí si necesitas empezar de cero."

