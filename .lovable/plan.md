## Tracking de uso por usuario — diagnóstico y plan

### Diagnóstico (estado actual)

Reviso lo que ya existe y la realidad de los datos:

| Fuente | Para qué sirve | Filas hoy | Estado |
|---|---|---|---|
| `feature_usage_logs` | Eventos por feature/página/sesión por usuario (la tabla "buena") | **0** | Tabla creada y leída en 4 sitios, **pero nadie escribe en ella** |
| `audit_log` | Cambios CRUD (crear/editar/borrar entidades) | 40 | Funciona, pero solo registra mutaciones |
| `ai_usage_logs` | Llamadas a IA por usuario, créditos consumidos | 0 | Sin uso reciente |
| `usage_tracking` | Contadores mensuales (gastos, OCR, voz, etc.) | 6 | Funciona |
| `mission_control_history` | Snapshot semanal del "fuel score" del usuario | 17 | Funciona |
| `financial_focus_sessions` | Minutos en modo foco | 1 | Funciona pero casi vacío |
| `ecosystem_streaks` | Rachas diarias | — | Funciona |

**Conclusión honesta**: hoy puedes ver *qué creó* cada usuario y *cuántos contadores* tiene, pero **no puedes ver "tiempo en app", "qué sección visita", "qué botón pulsa"** porque la tabla diseñada para eso (`feature_usage_logs`) nunca recibe escrituras.

### Lo que se puede medir cuando esté instrumentado

Por usuario:
- **Tiempo total en la app** (sesiones + duración)
- **Sesiones por día/semana** y hora típica de uso
- **Páginas más visitadas** y tiempo en cada una
- **Features usadas** (voz, OCR, banco, contratos, reportes, etc.) con conteo
- **Última conexión** y **racha de días activos**
- **Embudo de adopción**: qué features descubrió y cuáles no toca
- **Dispositivo** (móvil vs desktop), navegador, idioma, país
- **Eventos clave**: primer gasto, primer reporte, primera importación bancaria
- **Errores/abandono**: dónde se quedan atascados
- **Engagement score** combinando frecuencia + variedad de features + duración

A nivel agregado (admin):
- Top 10 usuarios más activos / en riesgo de churn
- Features muertas (nadie las usa)
- Heatmap de horarios de uso
- Cohorts de retención (D1, D7, D30)
- Tiempo promedio hasta "aha moment" (primer reporte, primera carga bancaria)

### Plan en 3 fases

#### Fase 1 — Instrumentar (lo que falta)
Crear `src/lib/analytics/trackUsage.ts` con dos funciones ligeras:

- `trackPageView(path)` — se dispara en cada cambio de ruta desde `Layout` o un hook global.
- `trackFeature(featureName, metadata?)` — se llama en hooks clave ya existentes (`useCreateExpense`, `useVoiceInput`, `process-bank-statement`, `analyze-contract`, generación de reportes, etc.).

Ambas insertan en `feature_usage_logs` con `session_id` (uuid en `sessionStorage`, así se mide duración por sesión) + debounce + cola para no saturar. Sin PII, sin texto del usuario.

#### Fase 2 — Panel "Actividad del usuario"
Nueva subtab en `Admin → CRM & Apps → Usuarios → [click en un usuario]` (o tab nueva "Actividad") que muestre por usuario:

- Header: última sesión, racha, sesiones últimos 30 días, tiempo total estimado.
- Línea de tiempo de eventos (últimos 50).
- Heatmap día/hora.
- Top features usadas + features nunca usadas.
- Embudo de onboarding (cuáles hitos completó).
- Sesiones por día (gráfica).

Reutiliza el panel existente `AdminUserOverview` y le agrega una pestaña "Actividad".

#### Fase 3 — Vista agregada
Nueva tab en CRM "📊 Engagement":
- Ranking de usuarios por engagement score.
- Lista de "en riesgo" (sin sesión > 7 días) → enlaza con el flujo de nurturing/reactivación que ya tienes.
- Features muertas y features estrella.
- Cohorts de retención.

### Privacidad y costo
- Solo se registran rutas y nombres de features, **nunca contenido** (montos, descripciones, nombres de personas).
- Se respeta el flag actual `notification_preferences` para opt-out de telemetría (añadiré `analytics_opt_in` si no existe).
- Volumen estimado: ~50–200 eventos/usuario/día → bajo costo en Cloud.
- Job mensual opcional para archivar eventos > 6 meses.

### Pregunta antes de implementar
¿Avanzo con **las 3 fases completas** (instrumentación + panel individual + panel agregado), o prefieres que empiece **solo con la Fase 1 + panel individual** y dejemos el agregado para después de tener datos reales (1–2 semanas)?