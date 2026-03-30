

# Plan: Migración `.single()` + Internacionalización CRM

## Tarea 1: Migrar `.single()` → `.maybeSingle()` en queries de lectura

Hay ~290 usos de `.single()` en `src/hooks`. La mayoría son en **insert/update** (donde esperamos exactamente 1 resultado y `.single()` es correcto). Solo los **SELECTs puros** (fetches, lookups) deben migrar.

### Archivos a modificar (queries de lectura con `.single()`):

| Archivo | Contexto | Riesgo si no se migra |
|---------|----------|----------------------|
| `useBetaSystem.ts` L99 | Fetch referral code por user_id | Crash si user no tiene código |
| `useDocumentUrl.ts` L25 | Fetch documento por ID | Crash si doc fue eliminado |
| `useProjects.ts` L104 | Fetch proyecto antes de delete | Crash si proyecto ya borrado |
| `useProjects.ts` L131 | Fetch proyecto para duplicar | Crash si no existe |
| `useRecurringBills.ts` L197 | Fetch bill para calcular next_due | Crash si bill eliminada |
| `DataPrivacyCard.tsx` L50 | Fetch perfil para export de datos | Crash si perfil no existe |

**Nota**: Los `.single()` en `.insert().select().single()` y `.update().select().single()` se mantienen — son write operations que deben devolver exactamente 1 resultado.

### Cambio por archivo
Reemplazar `.single()` por `.maybeSingle()` y agregar null-checks donde el resultado se use directamente.

---

## Tarea 2: Internacionalizar strings hardcoded en CRM admin

10 archivos de admin tienen ~96 strings hardcoded en español (toasts, labels, botones). Dado que el admin **solo lo usa el dueño**, la prioridad es:

### Archivos a modificar:

| Archivo | Strings hardcoded | Ejemplo |
|---------|-------------------|---------|
| `LeadsBulkActions.tsx` | 12 | "Marcar contactados", "Etiquetar", "Exportar", pipeline labels |
| `FollowUpsList.tsx` | 4 | "Seguimiento completado/eliminado" |
| `FollowUpModal.tsx` | 4 | "Seguimiento programado", "Selecciona una fecha" |
| `InteractionTimeline.tsx` | 2 | "Interacción registrada" |
| `LeadMergeDialog.tsx` | 1 | "Error al fusionar leads" |
| `LeadsExport.tsx` | 2 | "Error al exportar" |
| `LeadTagEditor.tsx` | 1 | "Error al actualizar tags" |
| `QuickContact.tsx` | 2 | "Este lead no tiene teléfono..." |

### Approach
Cada componente recibirá `useLanguage()` (o ya lo tiene) y usará `const es = language === 'es'` para ternarios inline — mismo patrón ya usado en `AdminContactQueueTab.tsx`, `AdminQuickActions.tsx`, y `AdminUserOverview.tsx`.

---

## Resumen de esfuerzo

| Tarea | Archivos | Cambios |
|-------|----------|---------|
| `.single()` → `.maybeSingle()` | 6 archivos | ~6 líneas cada uno + null checks |
| Internacionalización CRM | 8 archivos | ~50 strings con ternarios es/en |

**Total**: ~14 archivos modificados. Sin cambios de base de datos.

