

# Mejorar Submenú de Clientes en Sidebar

## Problema
El submenú de "Clientes" muestra solo "📊 Gráficos Negocio" que no tiene relación directa con clientes. Es confuso — el usuario esperaría ver herramientas relacionadas con la gestión de clientes, no gráficos generales del negocio.

## Solución

Reemplazar el submenú actual con items relevantes a clientes:

```
Clientes
├── 📊 Rentabilidad por Cliente  → /analytics#profitability (ClientProfitability)
├── 📁 Proyectos               → /projects
└── 📄 Contratos               → /contracts
```

Estos son los módulos que realmente se relacionan con clientes: ver qué tan rentable es cada uno, los proyectos asignados, y los contratos asociados.

## Cambio

**`src/components/Layout.tsx` (líneas 213-217)**

De:
```tsx
children: [
  { label: '📊 Gráficos Negocio', path: '/dashboard?area=negocio&atab=charts' },
],
```

A:
```tsx
children: [
  { label: '📊 Rentabilidad Clientes' / 'Client Profitability', path: '/analytics#profitability' },
  { label: '📁 Proyectos' / 'Projects', path: '/projects' },
  { label: '📄 Contratos' / 'Contracts', path: '/contracts' },
],
```

## Archivo a modificar
1. `src/components/Layout.tsx` — líneas 214-216, actualizar children de Clientes

