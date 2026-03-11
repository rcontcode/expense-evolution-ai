

## CRM: Análisis de Gaps y Plan de Mejoras

### Lo que YA tienes (completo)
- App Center con registro dinámico y webhooks
- Lead Scoring dinámico con decay, returning lead bonus
- Kanban Pipeline (dnd-kit)
- Cola de Contacto Priorizada
- Generador de mensajes IA (WhatsApp/Email/Oferta)
- Plantillas guardadas
- Follow-ups programados + Timeline de interacciones
- Fusión manual de duplicados
- Notificaciones realtime para HOT leads
- Cross-App Ranking + Métricas avanzadas
- Revenue Dashboard (Stripe MRR/ARR)
- Reglas de automatización (UI estática, no ejecutadas)
- Documentación API completa
- Export Excel

### Lo que FALTA para ser genial

**1. Dashboard de Follow-Ups Global (Agenda del Día)**
Hoy los follow-ups solo se ven dentro de cada lead individual. No hay una vista "¿qué tengo que hacer HOY?" que muestre todos los follow-ups pendientes, vencidos y próximos en un solo lugar, tipo agenda de ventas.

- Nueva tab "📅 Agenda" en AdminCRM
- Query a `lead_follow_ups` WHERE `completed_at IS NULL`, ordenados por `scheduled_at`
- Secciones: Vencidos (rojo), Hoy (naranja), Próximos 7 días
- Click → abre LeadDetail del lead asociado
- Completar follow-up directo desde la agenda

**2. Notas Rápidas en el Pipeline (Kanban)**
El Kanban muestra leads pero no permite agregar notas rápidas sin abrir el detalle completo. Agregar un campo de nota inline al mover un lead de etapa, que se registre como `lead_interaction`.

**3. Automatizaciones Ejecutables (no solo UI)**
Las reglas de automatización (`AdminAutomationTab`) son solo visuales/estáticas. Conectarlas realmente:

- Persistir reglas en una nueva tabla `automation_rules`
- Edge Function `run-automations` que evalúa leads nuevos contra reglas activas
- Acciones reales: invocar `generate-lead-message` y marcar `contacted_at`
- Trigger: llamar desde `webhook-leads` tras insertar un lead

**4. Tags/Etiquetas para Leads**
No hay forma de categorizar leads más allá del pipeline stage. Tags personalizables (ej: "VIP", "Requiere demo", "Interés Bundle", "No molestar") permiten segmentar y filtrar mejor.

- Nueva columna `tags TEXT[]` en `quiz_leads`
- UI de chips editables en LeadDetail y filtro en LeadFilters
- Colores predefinidos por tag

**5. Dashboard Resumen Ejecutivo (Home del CRM)**
El CRM abre en la tab "Users" que es una tabla. Falta un dashboard resumen con los KPIs más importantes de un vistazo:

- Leads hoy / esta semana
- Follow-ups vencidos (alerta)
- Tasa de contacto y conversión del mes
- Leads HOT sin contactar
- Revenue MRR actual
- Gráfico sparkline de leads últimos 30 días

### Archivos a Crear/Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/tabs/AdminFollowUpsAgenda.tsx` | **Nuevo** — Vista global de follow-ups pendientes |
| `src/components/admin/tabs/AdminCRMHome.tsx` | **Nuevo** — Dashboard resumen ejecutivo |
| `src/pages/admin/AdminCRM.tsx` | Agregar tabs "Home" y "Agenda", reordenar |
| `src/components/admin/tabs/AdminKanbanPipeline.tsx` | Agregar nota al mover de etapa |
| `supabase migration` | Agregar columna `tags TEXT[]` a `quiz_leads` + tabla `automation_rules` |
| `supabase/functions/run-automations/index.ts` | **Nuevo** — Ejecutar reglas contra leads nuevos |
| `supabase/functions/webhook-leads/index.ts` | Invocar `run-automations` tras insertar lead |
| `src/components/admin/LeadDetail.tsx` | Agregar editor de tags |
| `src/components/admin/LeadFilters.tsx` | Agregar filtro por tags |
| `src/components/admin/tabs/AdminAutomationTab.tsx` | Conectar a tabla real `automation_rules` con CRUD |

### Prioridad de Implementación
1. **CRM Home Dashboard** — primera impresión al abrir el CRM
2. **Agenda de Follow-Ups** — productividad diaria inmediata
3. **Tags para Leads** — segmentación flexible
4. **Nota al mover en Kanban** — contexto en transiciones
5. **Automatizaciones ejecutables** — el más complejo, mayor impacto a largo plazo

