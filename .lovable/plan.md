

## Plan: Sistema Beta Robusto y Rentable

### Diagnostico Actual

**Lo que SI funciona:**
- Los triggers para dar puntos por feedback (25-50 pts) y bug reports (25-150 pts) ya existen y funcionan
- `internal_award_beta_points` actualiza puntos y tier automaticamente
- `update_beta_streak` funciona correctamente
- 14 goals configurados con puntos

**Lo que NO funciona / falta:**
- `claim_beta_reward` solo crea un registro "pending" -- no activa nada en la suscripcion del usuario
- No hay control de contribucion minima semanal
- No hay diferenciacion de limites para betas vs usuarios Pro pagados (un beta con acceso Pro usaria 120 min de voz/mes = costo alto para ti)
- No hay mecanismo para desactivar acceso si dejan de contribuir

---

### Mi Recomendacion: Modelo "Pro Beta Limitado"

Los beta testers obtienen acceso **Pro con limites reducidos** mientras contribuyan activamente. Esto les da motivacion real (acceso a features que valen dinero) pero protege tus costos.

**Acceso Beta Activo (mientras contribuyan):**
- Todas las features Pro desbloqueadas
- Voz IA: 15 min/mes (vs 120 del Pro pagado -- te ahorra ~87% del costo)
- OCR: 20 scans/mes (vs ilimitado del Pro)
- Esto les da suficiente para probar todo pero no abusa de tus recursos

**Cuota minima semanal: 2 contribuciones de calidad**
- Feedback con comentario de 50+ caracteres, o
- Bug report con descripcion clara, o
- Rating de seccion
- Si pasan 14 dias sin contribuir, se bajan a plan Free automaticamente

**Premio final por puntos acumulados:**
- 1,000 pts: Premium 1 ano (valor real)
- 2,000 pts: Pro 6 meses (valor alto)
- 3,000 pts: Pro 1 ano (el premio maximo)
- El premio se aplica automaticamente cuando el admin lo aprueba, activando la suscripcion real

---

### Implementacion Tecnica

#### 1. Nueva tabla `beta_access_config` y columna en profiles

Agregar columna `beta_plan_level` a profiles (valores: 'free', 'pro_beta') para distinguir betas activos de inactivos.

#### 2. Crear configuracion de plan `pro_beta` en `plan_configurations`

Un nuevo plan tipo `pro_beta` con:
- voice_minutes_per_month: 15
- ocr_scans_per_month: 20
- Todas las demas features Pro habilitadas
- Esto se leera desde `usePlanLimits` automaticamente

#### 3. Funcion DB `check_beta_weekly_quota`

Funcion que verifica si un beta tester ha hecho al menos 2 contribuciones en los ultimos 14 dias. Si no, actualiza `is_beta_tester = false` y cambia su plan.

#### 4. Trigger de login para verificar cuota

Cuando un beta tester hace login, se ejecuta la verificacion automatica. Si no cumple, se le muestra un aviso y se degrada a Free.

#### 5. Auto-aplicar recompensa aprobada

Modificar `claim_beta_reward` o crear nuevo RPC `apply_beta_reward` que cuando el admin aprueba, cree un registro en `user_subscriptions` con el plan y duracion correspondiente.

#### 6. Actualizar `usePlanLimits` y `useSubscription`

Que reconozcan el plan `pro_beta` y apliquen los limites reducidos correctos.

#### 7. Actualizar UI de MissionsCard y BetaGamificationCard

- Mostrar claramente la cuota semanal y su progreso
- Mostrar los limites del plan beta vs Pro pagado
- Alertar cuando estan cerca de perder acceso por inactividad

#### 8. Actualizar REWARDS_CONFIG

Ajustar los umbrales de puntos y descripciones para reflejar el nuevo esquema (1000, 2000, 3000 pts).

---

### Resumen de Costos vs Valor

```text
+-------------------+----------------+------------------+
| Recurso           | Pro Pagado     | Pro Beta         |
+-------------------+----------------+------------------+
| Voz IA            | 120 min/mes    | 15 min/mes       |
| OCR               | Ilimitado      | 20/mes           |
| Features Pro      | Todas          | Todas            |
| Costo para ti     | $0 (pagan)     | ~12% del Pro     |
| Valor para ellos  | Completo       | Alto (real)      |
+-------------------+----------------+------------------+
```

Con 10 beta testers activos, el costo de IA es equivalente a ~1.2 usuarios Pro -- pero obtienes QA, feedback, y bugs reportados que mejoran tu producto para todos los futuros clientes pagados.

