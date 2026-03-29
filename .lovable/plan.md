

# Clarificar Puntos de Entrada de Datos + Descripciones en la App

## El Problema
La app tiene **6+ formas de ingresar información financiera** que se solapan y confunden al usuario:

| Herramienta | Ruta/Ubicación | Qué hace | Confusión |
|-------------|---------------|----------|-----------|
| **Bandeja del Caos** | `/chaos` | Sube archivos (fotos, PDFs) → IA extrae datos → Revisión manual → Crea gastos/ingresos | ¿Es lo mismo que "Captura Rápida"? |
| **Captura Rápida (Foto)** | Dialog global (barra lateral + FAB) | Toma foto de recibo → IA extrae → Va a Bandeja del Caos para revisión | ¿Cuál es la diferencia con subir foto en Bandeja? |
| **Captura Rápida (Texto)** | Dialog global | Texto libre "pagué $50 de luz" → IA clasifica → Crea gasto directo | ¿Por qué no usar el asistente Phoenix? |
| **Centro de Captura** | Budget page | Agrupa Foto + Texto + Banco en un hub visual | ¿Es otra cosa diferente? |
| **Importar Banco** | Dialog (desde Banking, CaptureHub, etc.) | CSV/PDF/foto de extracto → Transacciones bancarias | ¿Los gastos bancarios se sincronizan con gastos? |
| **Agregar Gasto Manual** | `/expenses` + dialog | Formulario manual campo por campo | ¿Cuándo usar esto vs captura? |
| **Pagos Fijos** | `/bills` | Crear obligación recurrente manual | ¿Se detectan automáticamente? |
| **Asistente Phoenix** | Chat global | Voz/texto para crear gastos, ingresos, bills | ¿Es redundante con Captura de Texto? |

## Plan de Implementación

### 1. Agregar `crossReferences` al sistema `PAGE_GUIDES` existente

Extender la interfaz de `PageContextGuide` para incluir una nueva sección **"También puedes desde..."** con links a herramientas relacionadas y explicación de la diferencia.

**En `PageContextGuide.tsx`:**
- Agregar prop opcional `crossReferences: { path, title, relationship }[]` donde `relationship` explica la diferencia/relación
- Renderizar una nueva sección colapsable "Herramientas relacionadas" debajo de los tips

### 2. Actualizar cada `PAGE_GUIDES` con cross-references

**`chaos-inbox`**: Agregar referencia a Gastos ("los recibos aprobados aquí se convierten en gastos en /expenses") y a Captura Rápida ("la captura rápida envía las fotos aquí para revisión").

**`expenses`**: Agregar referencia a Bandeja del Caos ("también puedes capturar gastos desde foto/archivo en la Bandeja del Caos"), a Banco ("las transacciones bancarias importadas se concilian con estos gastos"), y a Pagos Fijos ("los gastos recurrentes se detectan automáticamente y aparecen en Pagos Fijos").

**`banking`**: Agregar referencia a Conciliación ("las transacciones importadas aquí se emparejan con gastos en Conciliación") y a Suscripciones ("los pagos recurrentes detectados aquí aparecen en Suscripciones").

**`bills`**: Agregar referencia a Gastos/Banco ("los pagos fijos también se detectan automáticamente al registrar gastos o importar extractos"), a Suscripciones ("las suscripciones detectadas pueden convertirse en pagos fijos").

**`income`**: Agregar referencia a Bandeja del Caos ("también puedes registrar ingresos subiendo facturas en la Bandeja del Caos").

**`reconciliation`**: Agregar referencia a Banking ("primero importa estados de cuenta en Análisis Bancario") y Gastos ("los gastos se emparejan automáticamente con transacciones bancarias").

### 3. Mejorar descripciones del CaptureHub

En `CaptureHub.tsx`, agregar texto aclaratorio debajo de cada botón que explique a dónde van los datos:
- **Foto**: "La foto se procesa en la Bandeja del Caos donde puedes revisar y aprobar"
- **Texto**: "Se crea un gasto directamente con los datos que la IA extrae de tu texto"
- **Banco**: "Las transacciones se importan al Análisis Bancario para detección de patrones"

### 4. Mejorar PageContextGuide del `chaos-inbox`

Actualizar la descripción para diferenciar claramente: "Esta es tu bandeja de entrada de documentos. Las fotos de la Captura Rápida y los archivos subidos llegan aquí para revisión. Una vez aprobados, se crean como gastos o ingresos automáticamente."

## Archivos a modificar (3)

1. **`src/components/guidance/PageContextGuide.tsx`** — Agregar prop `crossReferences` y sección UI "Herramientas relacionadas"
2. **`src/components/guidance/PageContextGuide.tsx`** (PAGE_GUIDES) — Agregar cross-references a los 7 guides existentes (expenses, income, chaos-inbox, banking, reconciliation, bills, contracts)
3. **`src/components/budget/CaptureHub.tsx`** — Agregar subtexto aclaratorio en cada botón indicando destino de los datos

