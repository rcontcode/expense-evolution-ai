

# Plan: Checklist Siempre Visible + Conteo de Documentos + Botón de Reactivar

## Problemas actuales

1. **Checklist se oculta** si `documentCount >= 10` y no se ha iniciado el setup — la mayoría de usuarios nunca lo ven
2. **No hay botón para reactivar** el checklist si fue descartado
3. **No hay conteo visible** de documentos subidos vs procesados por tipo en la Bandeja del Caos
4. **El checklist está dentro del tab "unified"** — debería estar arriba, visible siempre

## Cambios

### 1. `src/components/chaos/DocumentOnboardingChecklist.tsx`

- Eliminar la condición `if (documentCount >= 10 && !setupDone) return null`
- Solo ocultar si `dismissed` o `allDone`
- Exponer función estática `resetChecklist()` para reactivar desde fuera

### 2. `src/pages/ChaosInbox.tsx` — Mover checklist arriba + agregar botón reactivar + stats bar

- Mover `<DocumentOnboardingChecklist>` fuera de `TabsContent`, colocarlo justo después de `PageHeader` y antes de `Tabs`
- Agregar un componente **DocumentStatsBar** inline que muestre siempre:
  - Total documentos subidos
  - Documentos procesados/clasificados
  - Desglose por tipo (receipts, invoices, contracts, etc.) con conteo y badges
- Si el checklist está descartado, mostrar un botón pequeño "Activar guía" que limpia el localStorage y lo reactiva

### 3. Crear `src/components/chaos/DocumentStatsBar.tsx`

Barra compacta que consulta documentos del usuario y muestra:

```text
┌──────────────────────────────────────────────────────┐
│ 📄 12 subidos  ✅ 8 procesados  │ 🧾3  📃2  📑1  📋2 │
│                                  │ Boletas Facturas... │
└──────────────────────────────────────────────────────┘
```

- Query a `documents` agrupando por `status` y por tipo (usando `extracted_data->document_type` o la clasificación existente)
- Query a `contracts` para conteo separado
- Mostrar conteo total, procesados, y mini-badges por categoría
- Siempre visible (no colapsable)

## Archivos afectados

| Accion | Archivo |
|--------|---------|
| Crear | `src/components/chaos/DocumentStatsBar.tsx` |
| Modificar | `src/components/chaos/DocumentOnboardingChecklist.tsx` |
| Modificar | `src/pages/ChaosInbox.tsx` |

Sin migraciones de base de datos.

