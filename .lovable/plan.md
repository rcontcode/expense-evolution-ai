

# Actualizar Tasas CRA a 2026 (y soporte multi-año)

## El Problema

Estamos en **marzo 2026** y la app usa tasas CRA de **2024**:
- App actual: $0.70 / $0.64 per km
- **2025 real**: $0.72 / $0.66 per km  
- **2026 real**: $0.73 / $0.67 per km

Esto significa que los usuarios están calculando deducciones **$0.03/km menos** de lo que les corresponde.

## Tasas oficiales CRA confirmadas

| Año | Primeros 5,000 km | Después de 5,000 km | Territorios |
|-----|-------------------|---------------------|-------------|
| 2024 | $0.70 | $0.64 | +$0.04 |
| 2025 | $0.72 | $0.66 | +$0.04 |
| 2026 | $0.73 | $0.67 | +$0.04 |

## Plan: Tasas por año (no solo la más reciente)

En lugar de hardcodear una sola tasa, crear un mapa de tasas por año para que cuando el usuario seleccione año 2024, 2025 o 2026 en la página de Mileage, se usen las tasas correctas de ese año.

### Cambios

**1. `src/hooks/data/useMileage.ts`** — Reemplazar constante única por mapa de tasas por año:
```typescript
export const CRA_MILEAGE_RATES_BY_YEAR: Record<number, { first5000: number; after5000: number; territoryBonus: number }> = {
  2024: { first5000: 0.70, after5000: 0.64, territoryBonus: 0.04 },
  2025: { first5000: 0.72, after5000: 0.66, territoryBonus: 0.04 },
  2026: { first5000: 0.73, after5000: 0.67, territoryBonus: 0.04 },
};
export const CRA_MILEAGE_RATES = CRA_MILEAGE_RATES_BY_YEAR[2026]; // default
export function getCRAMileageRates(year: number) { return CRA_MILEAGE_RATES_BY_YEAR[year] || CRA_MILEAGE_RATES; }
```
- Actualizar `calculateMileageDeduction` para aceptar `year` opcional

**2. `src/components/mileage/MileageDeductionMaximizer.tsx`** — Usar tasas 2026 por defecto, actualizar labels "2026 Rates"

**3. `src/components/dashboard/MileageTabContent.tsx`** — Usar `getCRAMileageRates(year)` 

**4. `src/components/dashboard/MileageSummaryCard.tsx`** — Idem

**5. `src/components/forms/MileageForm.tsx`** — Usar tasa del año seleccionado

**6. `src/components/mileage/MileageCard.tsx`** — Pasar año para cálculo correcto

**7. `src/lib/constants/country-tax-config.ts`** — Actualizar `TAX_INFO_VERSIONS.CA` a `taxYear: 2026`, `lastUpdated: '2026-03-29'`

**8. Textos UI** — Actualizar todas las referencias "2024 Rates" → "2026 Rates" en `ControlCenterTour.tsx`, `onboarding-guide.tsx`, `Mileage.tsx`

## Archivos a modificar (8)
1. `src/hooks/data/useMileage.ts`
2. `src/components/mileage/MileageDeductionMaximizer.tsx`
3. `src/components/dashboard/MileageTabContent.tsx`
4. `src/components/dashboard/MileageSummaryCard.tsx`
5. `src/components/forms/MileageForm.tsx`
6. `src/components/mileage/MileageCard.tsx`
7. `src/lib/constants/country-tax-config.ts`
8. `src/components/guidance/ControlCenterTour.tsx` + `src/components/ui/onboarding-guide.tsx` + `src/pages/Mileage.tsx` (texto)

