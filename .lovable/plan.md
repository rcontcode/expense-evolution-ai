

# Clarificar Puntos de Entrada de Datos: Implementación a Fondo

## Estado Actual

**Ya implementado:**
- `PageContextGuide` ya tiene `crossReferences` prop y UI funcional
- 5 de 7 PAGE_GUIDES ya tienen cross-references (expenses, income, chaos-inbox, banking, reconciliation, bills)
- `CaptureHub` ya tiene texto de destino en cada botón
- El manual de usuario (`user-guide-content.ts`) tiene una sección "Interconexiones" con 11 flujos simples (from → to → to2)

**Falta:**
- Los PAGE_GUIDES que NO tienen cross-references: `clients`, `mileage`, `net-worth`, `tags`, `contracts`
- El manual no tiene una sección dedicada a "Puntos de Entrada de Datos" que explique las diferencias entre las 8 formas de ingresar info
- No existe un diagrama visual (mermaid) del mapa completo de flujos
- Las FAQ globales no incluyen "¿Cuál es la diferencia entre Bandeja del Caos y Captura Rápida?"
- El `CaptureHub` tiene destinos pero no explica la DIFERENCIA entre cada opción
- No hay diagrama visual interactivo en la página del manual

## Plan

### 1. Generar diagrama Mermaid de flujos de datos
Crear un diagrama visual descargable y embebido en el manual que muestre:
- Los 8 puntos de entrada (Bandeja del Caos, Captura Foto, Captura Texto, Centro de Captura, Importar Banco, Gasto Manual, Pagos Fijos, Phoenix)
- A dónde va cada dato después de ingresar
- Las vinculaciones entre secciones

### 2. Agregar sección "Puntos de Entrada" al manual (`user-guide-content.ts`)
Nueva `GuideSection` dedicada con id `data-entry-points`:
- Tabla comparativa de los 8 puntos de entrada con: nombre, qué hace, a dónde van los datos, cuándo usarlo
- FAQ: "¿Cuál es la diferencia entre X y Y?" para las 4 confusiones más comunes
- Tips de cuándo usar cada uno

### 3. Agregar FAQ globales sobre diferencias
3 nuevas FAQ globales:
- "¿Cuál es la diferencia entre Bandeja del Caos y Captura Rápida?"
- "¿Debo usar Captura de Texto o el Asistente Phoenix?"
- "¿Los datos del banco se sincronizan con mis gastos?"

### 4. Completar cross-references en PAGE_GUIDES faltantes
Agregar `crossReferences` a: `clients`, `mileage`, `net-worth`, `tags`, `contracts`

### 5. Mejorar `CaptureHub` con aclaraciones de diferencias
Agregar un bloque colapsable "¿Cuál uso?" debajo de los 3 botones que explique la diferencia entre Foto vs Texto vs Banco con una mini-tabla comparativa

### 6. Renderizar diagrama Mermaid en UserGuide.tsx
En la sección "Interconexiones" del manual, mostrar el diagrama mermaid como imagen embebida además de los flujos de texto existentes

## Archivos a modificar (4) + 1 diagrama

1. **`src/data/user-guide-content.ts`** — Nueva sección `data-entry-points`, 3 FAQ globales nuevas, ampliar `connectionsDiagram`
2. **`src/components/guidance/PageContextGuide.tsx`** — Agregar cross-references a `clients`, `mileage`, `net-worth`, `tags`, `contracts`
3. **`src/components/budget/CaptureHub.tsx`** — Agregar bloque colapsable "¿Cuál uso?" con mini-tabla comparativa
4. **`src/pages/UserGuide.tsx`** — Renderizar diagrama mermaid en sección interconexiones
5. **Diagrama Mermaid** — Generar `.mmd` con mapa completo de puntos de entrada y flujos de datos

