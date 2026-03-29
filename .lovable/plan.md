

# Diagrama de Arquitectura: Evaluación Honesta y Propuesta Mejorada

## ¿Conviene o no?

**Lo que NO conviene del plan original:**
- Una página `/architecture` dedicada es para desarrolladores, no para usuarios finales — nadie va a buscar "arquitectura" en un app de finanzas
- Cargar Mermaid desde CDN agrega peso y fragilidad (dependencia externa)
- Un diagrama técnico tipo "system architecture" confunde más que ayuda al usuario promedio

**Lo que SÍ conviene:**
- Mejorar la sección "Interconexiones" del Manual que ya existe pero es solo texto plano con flechas
- Mostrar visualmente cómo fluyen los datos, pero desde la perspectiva del USUARIO, no del desarrollador

## Propuesta Mejorada: Mapa Visual de Flujos (sin Mermaid)

En vez de un diagrama técnico, crear un **mapa interactivo con React puro** integrado en el Manual de Usuario. Sin dependencias externas.

### Componente: `DataFlowMap.tsx`

Un componente visual con nodos clickeables organizados por categoría:

```text
┌─────────────────────────────────────────────────┐
│              ¿Cómo fluye tu información?         │
│                                                   │
│  [ENTRADA]          [PROCESO]        [RESULTADO]  │
│  ┌──────┐          ┌──────┐         ┌──────┐     │
│  │📸Foto│───────→  │🤖 IA │──────→  │🧾Gasto│    │
│  │🎤Voz │───────→  │Clasif.│──────→  │💰Ingr.│   │
│  │🏦Bank│───────→  │Concil.│──────→  │📊Stats│   │
│  │✍️Man.│─────────────────────────→  │🧾Gasto│   │
│  └──────┘          └──────┘         └──────┘     │
│                                                   │
│  Click en cualquier nodo → te lleva a esa sección │
└─────────────────────────────────────────────────┘
```

**Características:**
- Nodos con el mismo estilo 3D candy de la app (gradientes, sombras, hover)
- 3 columnas: Entrada → Procesamiento → Resultado/Análisis
- Líneas SVG simples conectando nodos (sin librería externa)
- Click en nodo = navega a esa página
- Responsive: en mobile se apila verticalmente
- Bilingüe con `useLanguage()`
- Dark/light mode compatible

### Integración

1. **En el Manual de Usuario** — Reemplaza el bloque actual de cards de texto (líneas 360-382) por el mapa visual
2. **NO crear página separada** — No agrega valor, el diagrama vive donde el usuario lo necesita
3. **NO agregar al sidebar** — Ya está accesible desde el Manual

### Nodos del mapa (basados en flujos reales existentes)

| Columna | Nodos | Link |
|---------|-------|------|
| Entrada | Captura Foto, Phoenix Voz, Texto Manual, Import Banco, Chaos Inbox | /capture, /phoenix, /expenses, /banking, /chaos |
| Proceso | IA Clasificación, Conciliación, Detección Anomalías | (sin link, decorativo) |
| Salida | Gastos, Ingresos, Dashboard, Presupuesto, Análisis, Reporte Fiscal | /expenses, /income, /dashboard, /budget, /analytics, /tax-report-flow |

## Archivos a modificar/crear (2)

1. **`src/components/diagrams/DataFlowMap.tsx`** — Nuevo componente: mapa visual con nodos SVG + click navigation, sin dependencias externas
2. **`src/pages/UserGuide.tsx`** — Reemplazar bloque "Connections Diagram" (líneas 360-382) con `<DataFlowMap />`

