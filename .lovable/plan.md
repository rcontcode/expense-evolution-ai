
# Mejoras Integrales al CRM — Plan por Fases

## ✅ Fase 1: Acciones en Lote — COMPLETADA
- Checkbox de selección múltiple en tabla de leads (select all + individual)
- Barra flotante con acciones masivas: Marcar contactados, Etiquetar, Mover pipeline, Exportar CSV
- Componente `LeadsBulkActions.tsx` creado

## ✅ Fase 2: Notificaciones Push en Tiempo Real — COMPLETADA
- Sonido de alerta (beep) para leads HOT via Web Audio API
- Hook `useUncontactedHotCount` para badge en tiempo real
- Badge numérico animado en pestaña "Contactar" del CRM
- Cache invalidation automática del contador con realtime

## ✅ Fase 3: Dashboard de ROI / Revenue por Lead — COMPLETADA
- Cross-reference `quiz_leads` ↔ `profiles` ↔ `user_subscriptions` por email
- KPIs: MRR de leads, Conversión total, Leads pagando, Valor por lead
- Embudo visual: Quiz → Registro → Suscripción con tasas de conversión
- Gráfico de barras MRR por fuente + desglose de conversión por fuente
- Tabla de top 20 leads convertidos a suscripción
- Nueva pestaña "💰 ROI" en CRM

## 🔲 Fase 4: Secuencias de Nurturing
- Tablas: `lead_nurturing_sequences` + `lead_nurturing_log`
- UI para crear/editar secuencias con pasos día 1→3→7
- Extender Edge Function `run-delayed-automations`
- Nueva pestaña "🔄 Nurturing" en CRM
