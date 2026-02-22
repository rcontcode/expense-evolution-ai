
## Plan: Corregir Triggers Duplicados + Guia Completa de Lanzamiento Beta

### Problema Critico Encontrado: PUNTOS DOBLES

La base de datos tiene **triggers duplicados** que otorgan puntos DOS VECES por cada accion:

**En `beta_feedback` (2 triggers que hacen lo mismo):**
- `award_feedback_points_trigger` -> `award_points_for_feedback()` (25-50 pts)
- `award_points_on_feedback` -> `trigger_award_points_on_feedback()` (25-50 pts)
- Resultado: Un feedback da 50-100 pts en vez de 25-50

**En `beta_bug_reports` (2 triggers que hacen lo mismo):**
- `award_bug_report_points_trigger` -> `award_points_for_bug_report()` (25-150 pts)
- `award_points_on_bug_report` -> `trigger_award_points_on_bug_report()` (25-150 pts)
- Resultado: Un bug report da 50-300 pts en vez de 25-150

**En `profiles` (6+ triggers duplicados para referral/init):**
- `generate_referral_on_beta`, `generate_referral_on_beta_activation`, `trigger_generate_beta_referral_code`, `on_beta_tester_activated` -- todos generan codigos de referido
- `init_beta_on_profile_update`, `init_beta_points_on_activation`, `on_profile_beta_status_change` -- todos inicializan puntos

### Solucion

Crear una migracion SQL que:

1. **Elimina los triggers duplicados** dejando solo UNO por accion:
   - Mantener `award_feedback_points_trigger` (eliminar `award_points_on_feedback`)
   - Mantener `award_bug_report_points_trigger` (eliminar `award_points_on_bug_report`)
   - Mantener `generate_referral_on_beta_activation` (eliminar los otros 3 duplicados de referral)
   - Mantener `init_beta_points_on_activation` (eliminar los otros 2 duplicados de init)

2. **Eliminar las funciones huerfanas** que ya no se usan (las que quedan sin trigger)

### Estado Final del Sistema (tras la correccion)

Todo lo demas ya esta correctamente implementado:

- `plan_configurations` tiene `pro_beta` con 15 min voz, 20 OCR scans
- `check_beta_weekly_quota` verifica 2 contribuciones cada 14 dias
- `apply_beta_reward` crea suscripciones reales al aprobar premios
- `claim_beta_reward` actualizado con umbrales 1000/2000/3000
- `usePlanLimits` reconoce `pro_beta` y aplica limites reducidos
- `BetaGamificationCard` muestra cuota semanal y progreso
- `BetaDashboard` tiene tab de Premios con Aprobar/Rechazar
- `AdminBetaControls` permite extender/revocar acceso
- 14 goals configurados con puntos
- Triggers de expiracion y streaks funcionan

---

### Guia Completa de Lanzamiento

#### Tus Rutas de Admin

```text
/admin/beta-dashboard   -> Centro de comando (5 tabs: Testers, Feedback, Bugs, Premios, Uso)
/admin/beta-codes       -> Crear y gestionar codigos de invitacion
/admin/leads            -> CRM de prospectos del quiz
```

#### Paso a Paso para Lanzar

**Paso 1: Crear codigos de invitacion**
- Ve a `/admin/beta-codes`
- Click "Crear Codigos"
- Prefijo: `BETA` (o lo que quieras), Cantidad: 10-20, Usos max: 1
- Esto genera codigos como `BETA-01`, `BETA-02`, etc.

**Paso 2: Enviar invitaciones**
- Comparte el link de tu app publicada: `https://expense-evolution-ai.lovable.app`
- Junto con un codigo unico por persona

**Paso 3: Como funciona para el beta tester**
- Van a la app -> se registran -> ingresan su codigo beta
- Automaticamente obtienen acceso Pro Beta (todas las features Pro, con 15 min voz/mes y 20 OCR/mes)
- Ven su panel de gamificacion con metas, puntos y progreso

**Paso 4: Tu gestion diaria**
- Revisa `/admin/beta-dashboard` periodicamente
- Tab Testers: ve quien esta activo, sus contribuciones y controla acceso
- Tab Feedback: lee opiniones y ratings por seccion
- Tab Bugs: gestiona reportes (cambiar estado, agregar notas)
- Tab Premios: aprueba o rechaza solicitudes de recompensa
- Tab Uso: ve que features son mas populares

**Paso 5: El sistema automatico se encarga de**
- Dar puntos por cada feedback (25-50 pts) y bug report (25-150 pts)
- Subir de tier automaticamente (bronze -> silver -> gold -> platinum -> diamond)
- Verificar cuota de 2 contribuciones cada 14 dias en login
- Desactivar betas inactivos automaticamente

#### Mensajes para tus Beta Testers

**Espanol:**

> Asunto: Te invito a ser Beta Tester de EvoFinz
>
> Hola [nombre],
>
> Te invito a probar EvoFinz antes que nadie. Como beta tester tendras acceso a TODAS las funciones Pro de la app mientras nos ayudes a mejorarla.
>
> Lo que obtienes:
> - Acceso completo a funciones Pro (asistente de voz IA, OCR, kilometraje, calendario fiscal y mas)
> - Sistema de puntos: gana puntos por cada opinion y reporte de bug
> - Premios reales por tus puntos:
>   - 1,000 pts = Premium gratis por 1 ano
>   - 2,000 pts = Pro gratis por 6 meses
>   - 3,000 pts = Pro gratis por 1 ano
>
> Lo que necesito de ti:
> - Al menos 2 opiniones o reportes de calidad cada 2 semanas
> - Honestidad en tu feedback (lo bueno Y lo malo)
>
> Como empezar:
> 1. Ve a https://expense-evolution-ai.lovable.app
> 2. Crea tu cuenta
> 3. Usa este codigo de invitacion: [CODIGO]
> 4. Explora la app y comparte tu opinion desde la seccion de feedback
>
> Gracias por ser parte de esto.

**English:**

> Subject: You're invited to beta test EvoFinz
>
> Hi [name],
>
> I'd like to invite you to try EvoFinz before anyone else. As a beta tester, you'll get access to ALL Pro features while helping us improve the app.
>
> What you get:
> - Full access to Pro features (AI voice assistant, OCR, mileage tracking, tax calendar and more)
> - Points system: earn points for every review and bug report
> - Real rewards for your points:
>   - 1,000 pts = Free Premium for 1 year
>   - 2,000 pts = Free Pro for 6 months
>   - 3,000 pts = Free Pro for 1 year
>
> What I need from you:
> - At least 2 quality reviews or reports every 2 weeks
> - Honest feedback (the good AND the bad)
>
> How to start:
> 1. Go to https://expense-evolution-ai.lovable.app
> 2. Create your account
> 3. Use this invitation code: [CODE]
> 4. Explore the app and share your thoughts from the feedback section
>
> Thanks for being part of this.

#### Resumen de lo que se corrige en esta implementacion

Solo se eliminarán triggers duplicados via migracion SQL. No hay cambios de codigo frontend necesarios -- todo lo demas ya funciona correctamente.
