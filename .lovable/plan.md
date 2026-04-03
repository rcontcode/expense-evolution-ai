

# Plan: Expandir Checklist con Categorías, Subtipos, Colores y Guía Visual

## Resumen

Transformar el checklist de 6 items planos a un sistema de **categorías expandidas con subtipos**, colores por categoría, iconos descriptivos, y una experiencia visual tipo "candy 3D" que guíe al usuario de forma clara sin importar el orden en que suba documentos.

## Cambios

### 1. `src/components/chaos/DocumentOnboardingChecklist.tsx` — Reescritura completa

**Estructura de datos expandida** con categorías principales y subtipos:

| Categoría | Color | Subtipos |
|-----------|-------|----------|
| Salud | Verde | Boletas médicas, dentales, farmacia, óptica, exámenes de laboratorio |
| Compras y materiales | Naranja | Herramientas, materiales de construcción, suministros de oficina, electrónica |
| Alimentos | Amarillo | Supermercado, restaurantes, delivery, cafetería |
| Hogar y servicios | Azul | Agua, luz, gas, internet, teléfono, arriendo |
| Transporte | Púrpura | Combustible, peajes, estacionamiento, mantención vehículo, transporte público |
| Financieros | Indigo | Extractos bancarios, certificados AFP/RRSP, inversiones, estados de tarjeta |
| Seguros | Rosa | Salud, auto, hogar, vida |
| Contratos y legales | Gris | Contratos de servicio, arriendo, trabajo, notariales |
| Impuestos | Rojo | Declaraciones, formularios fiscales, boletas de donación |
| Ingresos | Esmeralda | Liquidaciones de sueldo, boletas de honorarios, facturas emitidas |

**Fase 1 — Selección por categoría** (rediseño visual):
- Grid de cards con color de fondo por categoría (gradient sutil)
- Al hacer click en una categoría, se expande mostrando los subtipos como chips seleccionables
- Efecto hover con `scale(1.04)` y sombra 3D candy
- Cada categoría muestra un emoji + icono Lucide + descripción corta
- Botón "Seleccionar todos" por categoría
- Contador flotante de items seleccionados

**Fase 2 — Progreso con subtipos**:
- Agrupar items seleccionados por categoría con header de color
- Cada subtipo tiene su botón "Subir" individual
- Progress bar coloreada por categoría
- Mensaje motivacional: "¡Ya subiste 4 de 7! Sigue así"
- Banner: "Puedes subir en cualquier orden — esto es el Caos organizado"

### 2. `src/components/chaos/DocumentStatsBar.tsx` — Expandir tipos reconocidos

Agregar al `typeConfig` los nuevos tipos para que el conteo refleje las categorías expandidas:
- `medical_receipt`, `dental`, `pharmacy`, `tools`, `materials`, `food`, `utilities`, `transport`, `tax_document`, `income_proof`, etc.
- Mapear cada uno a su icono y color correspondiente

### 3. Detalles de UI/UX

- Mensaje inicial: "Esto es la Bandeja del Caos — sube lo que tengas, como lo tengas. Fotos, PDFs, capturas... nosotros lo organizamos"
- Tip contextual: "No importa el orden. Sube primero lo que tengas a mano"
- Colores con `bg-{color}/10` para fondo, `border-{color}/30` para borde, `text-{color}` para icono
- Animación `transition-all duration-200` en hover con `hover:shadow-md hover:scale-[1.04]` y `active:translate-y-0.5`
- Badge con conteo por categoría que se actualiza en tiempo real

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/components/chaos/DocumentOnboardingChecklist.tsx` |
| Modificar | `src/components/chaos/DocumentStatsBar.tsx` |

Sin migraciones de base de datos.

