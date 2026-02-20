

# Plan: Sistema Completo de Gestion Masiva de Gastos

## Resumen

Agregar seleccion multiple con checkbox, acciones en masa (borrar, editar, clasificar), deteccion inteligente de problemas (duplicados, sin recibo), y explicaciones contextuales claras en toda la seccion de gastos.

---

## Cambios Principales

### 1. Checkboxes de seleccion en la tabla de gastos

**Archivo: `src/components/tables/ExpensesTable.tsx`**

- Agregar columna de checkbox al inicio de cada fila (desktop) y en cada card (mobile)
- Estado `selectedIds: Set<string>` manejado en el componente principal
- Checkbox "Seleccionar todo" en el header de la tabla
- Al seleccionar, aparece una barra flotante con acciones disponibles

### 2. Barra de acciones masivas para gastos

**Archivo nuevo: `src/components/expenses/ExpenseBulkActions.tsx`**

Barra fija que aparece cuando hay gastos seleccionados, con:
- Contador de seleccionados y monto total
- **Eliminar seleccionados** (con confirmacion mostrando detalle)
- **Clasificar seleccionados** (abre wizard de clasificacion rapida solo para los seleccionados)
- **Asignar cliente/contrato** a todos los seleccionados
- **Deseleccionar todo**
- Animacion de entrada/salida con framer-motion

### 3. Panel de Problemas Detectados (Smart Health Panel)

**Archivo nuevo: `src/components/expenses/ExpenseHealthPanel.tsx`**

Panel visible arriba de la tabla que reemplaza los warnings simples actuales. Muestra:

- **Gastos sin recibo** (X gastos) con opciones:
  - "Subir recibo ahora" (abre file picker)
  - "Vincular documento existente" (muestra documentos huerfanos)
  - "Ignorar / No tengo recibo"
  - "Eliminar estos gastos"
  
- **Posibles duplicados** detectados automaticamente:
  - Muestra pares de gastos con mismo monto+fecha+vendor similar
  - Opciones: "Mantener ambos", "Eliminar duplicado", "Fusionar"
  
- **Gastos sin clasificar** con boton directo al wizard

- **Gastos sin categoria** con sugerencia de categoria por IA

Cada seccion es colapsable, con contadores y colores (rojo/naranja/amarillo segun urgencia).

### 4. Dialogo de vinculacion de recibo

**Archivo nuevo: `src/components/dialogs/LinkReceiptDialog.tsx`**

Cuando el usuario elige "Vincular documento existente":
- Lista documentos huerfanos (`expense_id IS NULL`) con preview de imagen
- Muestra datos extraidos (vendor, monto) para facilitar el match
- Boton "Vincular" actualiza `expenses.document_id` y `documents.expense_id`
- Opcion "Subir nuevo" si no encuentra match

### 5. Deteccion de duplicados en la tabla

**Archivo: `src/hooks/data/useExpenseDuplicates.ts` (nuevo)**

Hook que analiza la lista de gastos y detecta:
- Mismo monto + misma fecha + vendor similar (fuzzy)
- Retorna grupos de duplicados con IDs

### 6. Mejoras a ExpenseCard (mobile)

**Archivo: `src/components/tables/ExpenseCard.tsx`**

- Agregar checkbox de seleccion (prop `selectable`, `selected`, `onSelect`)
- Indicador visual de "Sin recibo" con icono de camara tachada + pulsacion naranja
- Tooltip con explicacion de que hacer: "Sube un recibo o vincula uno existente"

### 7. Mejoras a ExpenseRowComponent (desktop)

**Archivo: `src/components/tables/ExpensesTable.tsx`**

- Agregar columna checkbox al inicio
- Indicador de "Sin recibo" en la columna de recibo (actualmente solo muestra el icono gris)
- Al hacer hover sobre un gasto incompleto, mostrar tooltip con pasos a seguir

### 8. Explicaciones y consejos contextuales

**Integrado en los componentes anteriores:**

- En el Health Panel: explicaciones como "Los gastos sin recibo no son validos para CRA. Puedes subir una foto del recibo o marcarlos como personal."
- En el wizard de clasificacion: "Tip: Los gastos de gasolina y comida suelen ser deducibles si son para trabajo."
- En la barra de acciones masivas: "Selecciona gastos similares para clasificarlos todos de una vez."
- Warning antes de borrar en masa: "Se moveran X gastos a la papelera. Podras restaurarlos desde la seccion Papelera."

### 9. Integracion en Expenses.tsx

**Archivo: `src/pages/Expenses.tsx`**

- Pasar `selectedIds` y `onSelectionChange` a `ExpensesTable`
- Renderizar `ExpenseBulkActions` cuando hay seleccion
- Renderizar `ExpenseHealthPanel` arriba de la tabla con datos de gastos
- Agregar event listeners para abrir `LinkReceiptDialog`

---

## Detalle Tecnico

### Flujo de Seleccion Multiple

```text
ExpensesTable
  +-- selectedIds: Set<string> (lifted to Expenses.tsx)
  +-- Checkbox header: toggle all
  +-- Each row/card: individual checkbox
  +-- ExpenseBulkActions (floating bar)
        +-- Delete selected -> AlertDialog con lista
        +-- Classify selected -> QuickClassifyDialog con subset
        +-- Assign client -> Select inline
```

### Flujo de Vinculacion de Recibo

```text
ExpenseHealthPanel
  +-- "X gastos sin recibo" section
  +-- Click "Vincular" -> LinkReceiptDialog
        +-- Fetch documents where expense_id IS NULL
        +-- Show previews + extracted data
        +-- "Vincular" button:
              UPDATE expenses SET document_id = ? WHERE id = ?
              UPDATE documents SET expense_id = ? WHERE id = ?
  +-- Click "Subir" -> File input -> upload to storage -> create document -> link
```

### Flujo de Duplicados

```text
useExpenseDuplicates(expenses)
  +-- Returns: { groups: [{original, duplicate, similarity}], count }
  
ExpenseHealthPanel
  +-- "X posibles duplicados" section
  +-- Each pair shown side by side
  +-- Actions: "Mantener ambos" | "Eliminar duplicado" | "Eliminar ambos"
```

### Archivos a crear

| Archivo | Proposito |
|---------|-----------|
| `src/components/expenses/ExpenseBulkActions.tsx` | Barra de acciones masivas |
| `src/components/expenses/ExpenseHealthPanel.tsx` | Panel de problemas detectados |
| `src/components/dialogs/LinkReceiptDialog.tsx` | Vincular recibos a gastos |
| `src/hooks/data/useExpenseDuplicates.ts` | Deteccion de duplicados |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Expenses.tsx` | Estado de seleccion, render Health Panel y Bulk Actions |
| `src/components/tables/ExpensesTable.tsx` | Checkboxes, prop selectedIds/onSelect |
| `src/components/tables/ExpenseCard.tsx` | Checkbox, indicador sin recibo mejorado |
| `src/components/dialogs/QuickClassifyDialog.tsx` | Aceptar subset filtrado de gastos |

### Patron visual

- Health Panel: Gradientes suaves (rojo para critico, naranja para advertencia, amarillo para info)
- Bulk Actions bar: Fondo `primary/10` con animacion slide-up via framer-motion
- Checkboxes: Estilo Radix existente con animacion de check
- Indicador sin recibo: Icono `Camera` con slash diagonal + efecto pulse naranja
- Tooltips explicativos en cada estado incompleto con pasos numerados

