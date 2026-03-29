

# Kilometraje: De CRA-Only a Control Personal Multi-País

## Diagnóstico

El sistema de kilometraje está **100% hardcodeado para CRA (Canadá)**:

| Componente | Problema |
|---|---|
| `useMileage.ts` | Solo tasas CRA, cálculo 5000km, HST/GST hardcodeado al 13% |
| `MileageSummaryCard.tsx` | Solo muestra CRA rates, link a canada.ca |
| `MileageDeductionMaximizer.tsx` | Solo CRA rates, tips mencionan CRA, umbral 5000km |
| `MileageForm.tsx` | Muestra deducción CRA inline |
| `MileageTable.tsx` | Calcula deducción con tasas CRA |

## Enfoque Propuesto

El kilometraje debería funcionar en **2 capas**:

```text
Capa 1: REGISTRO PERSONAL (siempre visible, todos los países)
  → Fecha, ruta, km, propósito, cliente
  → Resumen: total km, total viajes, promedio mensual

Capa 2: RENDICIÓN FISCAL (condicional según país del entity)
  → CA → CRA rates, umbral 5000km, ITC, HST/GST
  → CL → SII (km como gasto deducible a valor por km del mercado)
  → Sin entity → Solo muestra "Registra tu jurisdicción para ver deducciones"
```

## Cambios

### 1. `useMileage.ts` — Separar cálculo por país
- Mantener `calculateMileageDeduction` para CRA
- Agregar `calculateChileMileageDeduction(km)` con tarifa SII (estimación por km basada en tabla de gastos presuntos)
- Hacer que `useMileageSummary` detecte el país del entity y aplique la fórmula correspondiente
- Si no hay entity, devolver solo totales sin deducción fiscal

### 2. `MileageSummaryCard.tsx` — Adaptativo por país
- Card 1 (Total km) y Card 2 (Total viajes): siempre visibles
- Card 3 (Deducción fiscal): condicional
  - CA → CRA rates + ITC + progreso 5000km + link canada.ca
  - CL → Estimación deducible SII + nota sobre justificación
  - Sin país → Card con CTA "Configura tu jurisdicción"

### 3. `MileageDeductionMaximizer.tsx` — Condicional por país
- Sección "Km de negocio" y "Meses activos": siempre
- Sección "CRA rates" y umbral 5000km: solo CA
- Para CL: mostrar tips de SII (mantener registro, bitácora)
- Tips de "propósito faltante": universales

### 4. `MileageTable.tsx` — Columna deducción condicional
- Mostrar columna "Deducción" solo si el usuario tiene entity con país configurado
- Sin país → mostrar solo km, sin columna de tasa

### 5. `MileageForm.tsx` — Deducción preview condicional
- El badge de "Deducción estimada" solo se muestra si hay entity con país
- Agregar opción "Uso: personal / negocio / mixto" para que el usuario categorice sin forzar contexto fiscal

### 6. Página `Mileage.tsx` — Descripción actualizada
- Cambiar descripción de "CRA mileage tracking" a "Control de kilometraje personal y profesional"
- Agregar badge indicando el país activo y qué régimen fiscal aplica (si hay)

## Archivos a modificar (6)
1. `src/hooks/data/useMileage.ts` — Agregar cálculo Chile, hacer summary country-aware
2. `src/components/dashboard/MileageSummaryCard.tsx` — Renderizado condicional por país
3. `src/components/mileage/MileageDeductionMaximizer.tsx` — Tips y métricas por país
4. `src/components/tables/MileageTable.tsx` — Columna deducción condicional
5. `src/components/forms/MileageForm.tsx` — Preview deducción condicional
6. `src/pages/Mileage.tsx` — Descripción y badge de país

