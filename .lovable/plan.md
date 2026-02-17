
# Diagnostico: El Flujo de Captura esta Fragmentado y Sin Guia Clara

## El Problema

Hoy el usuario tiene **5 puntos de entrada distintos** para registrar documentos financieros, pero **ninguno le dice claramente "mete todo aqui"**:

```text
Punto de Entrada          Que acepta                    Donde esta
─────────────────────────────────────────────────────────────────────
1. Boton + (FAB)          Foto de recibo, texto libre   Barra inferior movil
2. Quick Capture sidebar  Foto, voz, texto libre        Sidebar izquierdo (desktop)
3. Banking > Importar     CSV, PDF, foto de extracto    /banking (escondido)
4. Centro de Revision     Fotos pendientes de revisar   /chaos-inbox
5. Gastos > Agregar       Formulario manual              /expenses
```

**Problemas concretos:**
- No existe una pagina o seccion que diga: "Aqui puedes meter TODOS tus documentos"
- El usuario no sabe que el FAB puede procesar boletas
- El import de extractos bancarios solo esta en /banking, no es obvio
- No hay guia paso a paso: "1. Sube extractos, 2. Sube boletas, 3. Revisa lo detectado"
- El InteractiveWelcome del Dashboard menciona las acciones pero no explica el flujo completo

## La Solucion: "Centro de Captura" Unificado

Crear un **panel visible en /budget** (donde el usuario ya esta) que unifique TODOS los metodos de entrada en un solo lugar con instrucciones claras.

### Componente Nuevo: `CaptureHub.tsx`

Un card prominente dentro del tab de presupuesto que muestre:

```text
┌─────────────────────────────────────────────────┐
│  📥 Centro de Captura - Registra Todo Aqui      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 📷 Foto  │  │ 📝 Texto │  │ 🏦 Banco │      │
│  │ Boletas, │  │ "pague   │  │ CSV, PDF │      │
│  │ cuentas, │  │  $50 de  │  │ o foto   │      │
│  │ recibos  │  │  luz"    │  │ extracto │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  Como funciona:                                  │
│  1. Sube cualquier documento financiero          │
│  2. La IA extrae datos y clasifica               │
│  3. Detecta suscripciones y pagos recurrentes    │
│  4. Todo aparece organizado en tu presupuesto    │
│                                                  │
│  [Ver documentos pendientes de revision (3)]     │
└─────────────────────────────────────────────────┘
```

### Que hace cada boton:
- **Foto**: Abre el QuickCaptureDialog (tab foto) - boletas, cuentas de celular, recibos, e-transfers
- **Texto**: Abre el QuickCaptureDialog (tab texto) - "pague $45 de internet", "recibi $2000 de salario"
- **Banco**: Abre el BankImportDialog - extractos bancarios CSV, PDF o foto

### Donde se coloca:
- En `BudgetCommandCenter.tsx`, como primera seccion visible (antes de los charts)
- Reemplaza la necesidad de que el usuario navegue a /banking para importar extractos

### Archivos a crear/modificar:

| Archivo | Cambio |
|---|---|
| `src/components/budget/CaptureHub.tsx` | NUEVO - panel unificado con 3 botones + explicacion |
| `src/components/budget/BudgetCommandCenter.tsx` | Agregar CaptureHub como primera seccion visible |

### Detalles del CaptureHub:
- 3 cards clickeables (Foto, Texto, Banco) con iconos grandes y descripcion clara
- Seccion "Como funciona" con 4 pasos numerados
- Link al Centro de Revision si hay documentos pendientes (usa conteo de expenses en estado "revision")
- Banner educativo colapsable: "Que puedo subir?" con lista de ejemplos (extractos, boletas de luz, cuentas de celular, e-transfers, recibos de compra, facturas)
- Bilingue ES/EN
- Reutiliza QuickCaptureDialog y BankImportDialog existentes, no duplica logica
