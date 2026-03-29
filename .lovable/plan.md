

# Mejorar la Experiencia de Captura Rápida

## Estado Actual
La pantalla de captura tiene dos pestañas (Texto Libre y Foto/Voz) pero carece de:
- Descripciones de qué tipo de documentos meter en cada modo
- Ejemplos claros para el usuario
- Indicación de a dónde van los datos después
- Tips de mejores prácticas

La interfaz de captura por foto muestra solo "Tomar Foto" y "Subir Archivo" sin contexto. El área de texto libre tiene placeholder pero no explica qué tipos de transacciones soporta.

## Cambios Propuestos

### 1. Agregar descripciones bajo cada pestaña en `QuickCaptureDialog.tsx`
Debajo de cada `TabsContent`, antes del componente hijo, insertar un bloque descriptivo:

**Pestaña Texto Libre:**
- Título: "Describe cualquier transacción en lenguaje natural"
- Ejemplos: "pagué $50 de luz", "me pagaron $2000 de sueldo", "Netflix $15 mensual"
- Nota: "→ La IA detecta si es gasto, ingreso o pago fijo y lo crea directamente"

**Pestaña Foto/Voz:**
- Título: "Captura documentos financieros con foto o voz"
- Tipos soportados: Recibos, boletas, facturas, e-transfers, estados de cuenta
- Nota: "→ El documento va a la Bandeja del Caos para revisión antes de crear el gasto"

### 2. Mejorar el empty state de captura en `QuickCapture.tsx`
Agregar debajo del área de foto/archivo una sección de "tipos soportados" con badges visuales (Recibos, Facturas, E-transfers, Boletas de servicios) para que el usuario sepa qué puede subir.

### 3. Agregar tips de mejores prácticas en `SmartTextInput.tsx`
Debajo del textarea, mostrar un bloque colapsable con ejemplos categorizados:
- Gastos: "compré café $5 en Starbucks"
- Ingresos: "recibí $3000 de salario"  
- Pagos fijos: "pago internet $50 mensual"

## Archivos a Modificar (3)
1. **`src/components/dialogs/QuickCaptureDialog.tsx`** — Agregar descripciones contextuales debajo de cada pestaña
2. **`src/components/capture/QuickCapture.tsx`** — Agregar badges de tipos soportados en el empty state
3. **`src/components/capture/SmartTextInput.tsx`** — Agregar bloque de ejemplos categorizados

