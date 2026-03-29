

# Reportes: Agregar Kilometraje + Preview en Cards

## Problemas detectados

1. **Falta reporte de Kilometraje** — No existe en `REPORT_CARDS` ni existe función de exportación de mileage a PDF/Excel en ningún lugar del proyecto
2. **No hay preview** — Las cards solo muestran descripción y botones, sin mostrar cuántos registros/montos tiene el usuario para ese reporte

## Cambios

### 1. `src/pages/Reports.tsx` — Agregar preview con datos reales en cada card

Cada card mostrará un mini-resumen contextual debajo de la descripción:
- **P&L**: "12 ingresos · 45 gastos · Margen: 32%"
- **Gastos**: "45 gastos · $12,500 total"
- **Presupuesto**: "Disponible: $1,200 · Ahorro: 18%"
- **Pagos Fijos**: "8 activos · $2,100/mes"
- **Fiscal**: "23 deducibles · $8,400"
- **Ingresos**: "12 registros · $45,000"
- **Kilometraje**: "34 viajes · 2,450 km · $1,200 deducción"

Se agregará una función `getPreview(cardId)` que usa los datos ya cargados (expenses, incomes, bills, plan, mileageSummary) para generar estos strings.

### 2. `src/pages/Reports.tsx` — Agregar card de Kilometraje

Nueva entrada en `REPORT_CARDS`:
- id: `mileage`
- Título: "Reporte de Kilometraje" / "Mileage Report"  
- Descripción: viajes de negocio, km, deducciones CRA/SII
- Formatos: PDF + Excel

### 3. `src/pages/Reports.tsx` — Importar `useMileage` y `useMileageSummary`

Para alimentar tanto el preview como la exportación de kilometraje.

### 4. `src/pages/Reports.tsx` — Funciones de exportación mileage

- `exportMileagePDF()` — tabla con fecha, ruta, km, cliente, propósito, deducción por viaje
- `exportMileageExcel()` — hoja con todos los campos + hoja resumen con totales y tasa CRA/SII

### 5. `src/pages/Reports.tsx` — Agregar caso `mileage` en `handleExport`

Switch case que llama a las nuevas funciones de exportación.

## Archivos a modificar (1)

1. **`src/pages/Reports.tsx`** — Agregar hook de mileage, card de kilometraje, preview en todas las cards, funciones de exportación mileage

