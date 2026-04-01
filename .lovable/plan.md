

# Plan: Ordenar plantillas por app/etapa + Unificar datos de leads en todas las herramientas

## Problemas encontrados

### 1. Plantillas (`AdminSavedTemplates`) — Sin filtro por app ni agrupación
- Solo filtra por `message_type` (WhatsApp/Email/Offer)
- **No filtra por app** (EvoFinz/FokusPark/UniversMind)
- **No filtra por etapa** (primer contacto/follow-up/reactivación/oferta/welcome)
- Se muestran como grid plano sin agrupación visual — difícil encontrar lo que buscas

### 2. Leads — Datos inconsistentes entre pestañas
| Pestaña | Filtro por app/source | Límite | Problema |
|---|---|---|---|
| **Home** | No (agrupa internamente) | Sin límite | OK |
| **Leads Tab** | Sí (sourceFilter opcional) | `LIMIT 50` | Solo muestra 50, pierde leads |
| **Contact Queue** | No | Sin límite | No filtra por app |
| **Historial** | No | Sin límite | No filtra por app ni por tipo de interacción |
| **Pipeline (Kanban)** | No | Sin límite | No filtra por app |
| **Métricas** | No (agrupa internamente) | Sin límite | OK |
| **Automatización** | No | Sin límite | No filtra por app |
| **ROI** | No (agrupa internamente) | Sin límite | OK |
| **Ranking** | No (agrupa internamente) | Sin límite | OK |

**Problema central:** Las pestañas que muestran leads individuales (Contact Queue, Historial, Pipeline, Automatización) **no tienen filtro por app/source**, así que mezclan leads de las 3 apps sin opción de separar.

---

## Implementación

### Paso 1: Rediseñar `AdminSavedTemplates` con filtros y agrupación

- Agregar filtro por **app** (EvoFinz/FokusPark/UniversMind/Bundle/Todos)
- Agregar filtro por **etapa** (Primer contacto/Follow-up/Reactivación/Oferta/Welcome/Todos)
- Agrupar plantillas visualmente por app (secciones con header de app)
- Dentro de cada grupo, ordenar por etapa (primer contacto → follow-up → reactivación → oferta)
- Mostrar contador de plantillas por grupo
- Actualizar la lógica de `filtered` para aplicar ambos filtros

### Paso 2: Agregar filtro por app a las pestañas que lo necesitan

Crear un componente reutilizable `AppSourceFilter` (dropdown con las 3 apps + "Todas") y agregarlo a:

- **Contact Queue** (`AdminContactQueueTab`) — filtrar `rawLeads` por `source`
- **Historial** (`AdminLeadHistory`) — filtrar leads por `source`
- **Pipeline Kanban** (`AdminKanbanPipeline`) — filtrar leads por `source`

Cada pestaña usará el mismo patrón: un `Select` con EvoFinz/FokusPark/UniversMind/Todas, filtrando por `lead.source` con matching parcial (`includes`).

### Paso 3: Quitar el `LIMIT 50` de `AdminLeadsTab`

El componente `AdminLeadsTab` tiene `.limit(50)` que corta los datos. Eliminarlo para que sea consistente con las demás pestañas que cargan todos los leads.

---

## Archivos a crear (1)
- `src/components/admin/AppSourceFilter.tsx` — Componente reutilizable de filtro por app

## Archivos a modificar (5)
- `src/components/admin/tabs/AdminSavedTemplates.tsx` — Filtros por app + etapa, agrupación visual, ordenamiento
- `src/components/admin/tabs/AdminContactQueueTab.tsx` — Agregar AppSourceFilter
- `src/components/admin/tabs/AdminLeadHistory.tsx` — Agregar AppSourceFilter
- `src/components/admin/tabs/AdminKanbanPipeline.tsx` — Agregar AppSourceFilter
- `src/components/admin/tabs/AdminLeadsTab.tsx` — Quitar `.limit(50)`

