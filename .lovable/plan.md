

## Diagnóstico

El item **"Análisis"** (`/analytics`) en la sección **📊 Análisis** del sidebar actualmente **no tiene submenús**. Sin embargo, la página de Analytics es muy rica — incluye:

- Reporte Mensual Inteligente
- Gráfico Ingresos vs Gastos  
- Predicciones de Gastos
- Proyección Cash Flow
- Análisis de Rentabilidad
- Simulador de Escenarios

Tiene todo el sentido agregarle submenús para acceso directo a cada herramienta, igual que Presupuesto, Inversiones, etc.

## Plan

### 1. Agregar submenús al item "Análisis" en el sidebar

En `Layout.tsx`, expandir el item de Análisis (línea ~243) con children que apunten a secciones de la página Analytics:

```
children: [
  { label: '📊 Ingresos vs Gastos', path: '/analytics#income-vs-expenses' },
  { label: '🔮 Predicciones', path: '/analytics#predictions' },
  { label: '💰 Cash Flow', path: '/analytics#cashflow' },
  { label: '📈 Rentabilidad', path: '/analytics#profitability' },
  { label: '🎛️ Simulador', path: '/analytics#simulator' },
]
```

### 2. Agregar anchors (`id`) en la página Analytics

En `Analytics.tsx`, asignar `id` a cada sección lazy-loaded para que los links con `#hash` funcionen como scroll-to-section.

### Detalle técnico
- Se usa el mismo patrón de `children` ya implementado en Presupuesto, Inversiones, Kilometraje, etc.
- Los links usan hash fragments (`#section`) para scroll directo
- No se crean rutas nuevas — solo navegación intra-página

