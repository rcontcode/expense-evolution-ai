

# Agregar PageHeader al Centro de Reportes

## Problema
La página `/reports` usa un header manual (`h1` + `p`) en vez del componente `PageHeader` que usan todas las demás páginas. No tiene breadcrumbs ni botón de volver.

## Cambios

### 1. `src/components/PageHeader.tsx` — Agregar ruta `/reports` al ROUTE_CONFIG
```typescript
'/reports': { labelEs: 'Reportes', labelEn: 'Reports', parent: '/dashboard' },
```

### 2. `src/pages/Reports.tsx` — Reemplazar header manual con `<PageHeader>`
- Importar `PageHeader` de `@/components/PageHeader`
- Reemplazar el bloque de líneas 482-501 (el `div` con `h1`, `p` y `Select`) por:
  ```
  <PageHeader 
    title={l ? 'Centro de Reportes' : 'Reports Center'} 
    description={l ? 'Genera y descarga reportes profesionales' : 'Generate professional reports'}
  >
    <Select ... año ... />
  </PageHeader>
  ```
- El selector de año pasa como `children` del PageHeader para que quede alineado a la derecha

## Archivos a modificar (2)
1. `src/components/PageHeader.tsx` — 1 línea nueva en ROUTE_CONFIG
2. `src/pages/Reports.tsx` — Reemplazar header manual con PageHeader

