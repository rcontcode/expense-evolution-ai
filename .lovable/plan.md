

## Diagnóstico Completo: Admin, Planes, CRM, Beta

### Problemas Encontrados

**1. Bug Critico: `stripe-webhook` desincronizado con `check-subscription`**
El webhook (`stripe-webhook/index.ts`) todavia usa el mapa viejo `PRODUCT_IDS` sin los product IDs legacy (`prod_TuPUlFnv10u2OA`, `prod_TuPUaVFFZ9bBgf`, `prod_U2ZIfWwlezukmF`, `prod_U2ZNNkNSSVCIp5`). Ya corregiste `check-subscription` pero el webhook sigue sin reconocer esos productos. Resultado: cuando Stripe envia un evento de suscripcion con un producto legacy, el webhook no lo mapea correctamente.

**Fix**: Sincronizar el `PRODUCT_ID_MAP` del webhook con el de `check-subscription`.

**2. BetaDashboard.tsx tiene 1345 lineas — monolito fragil**
Un solo archivo contiene: header, stat cards, 6 tabs (users, feedback, bugs, rewards, testimonials, usage), helpers de badges, traducciones inline. Cualquier cambio es riesgoso.

**Fix**: Extraer cada tab en su propio componente (`AdminTestersTab`, `AdminFeedbackTab`, `AdminBugsTab`, `AdminRewardsTab`, `AdminTestimonialsTab`, `AdminUsageTab`) y mover traducciones a un objeto separado.

**3. AdminUserOverview limitado a 15 usuarios sin paginacion**
Solo muestra los ultimos 15 registros. No hay busqueda ni filtro.

**Fix**: Agregar campo de busqueda por nombre/email y paginacion simple.

---

### Sobre crear una app CRM separada: NO lo hagas (todavia)

**Razonamiento:**

| Factor | App CRM separada | CRM dentro de EvoFinz |
|--------|------------------|----------------------|
| Tiempo de desarrollo | 3-6 meses | Ya tienes 80% hecho |
| Datos | Misma DB — tendrias que duplicar o compartir schema | Acceso directo a `profiles`, `user_subscriptions`, `quiz_leads` |
| Usuarios objetivo | Solo tu (1 admin) | Solo tu (1 admin) |
| Mantenimiento | 2 apps que mantener | 1 sola |
| Costo Lovable | Otro proyecto = mas tokens | Mismo proyecto |

**Veredicto**: Con 2 apps (EvoFinz + Fokuspark) y < 100 usuarios, un CRM dedicado es overengineering. Lo que necesitas es **reforzar el admin panel que ya tienes** para que funcione como tu CRM interno.

### Plan de Accion (paso a paso)

**Fase 1: Corregir bugs criticos**
1. Sincronizar `PRODUCT_ID_MAP` en `stripe-webhook/index.ts` (mismo mapa que `check-subscription`)

**Fase 2: Refactorizar BetaDashboard**
2. Extraer las 6 tabs en componentes individuales dentro de `src/components/admin/tabs/`
3. Mover traducciones a `src/components/admin/adminTranslations.ts`
4. Reducir BetaDashboard a ~150 lineas (solo layout + tabs wrapper)

**Fase 3: Mejorar gestion de usuarios (tu "CRM ligero")**
5. Agregar busqueda y filtros al `AdminUserOverview` (por nombre, email, estado beta, plan)
6. Agregar vista de detalle de usuario: plan actual, historial beta, uso mensual, ultimo login
7. Agregar tab "Suscripciones" al BetaDashboard con overview de planes activos vs free

**Fase 4: Consolidar CRM de leads**
8. Integrar acceso directo a `/admin/leads` desde el BetaDashboard (tab o link directo) en vez de pagina separada

### Resumen de archivos a modificar

- `supabase/functions/stripe-webhook/index.ts` — sincronizar product map
- `src/pages/admin/BetaDashboard.tsx` — refactorizar en componentes
- `src/components/admin/tabs/` — 6 nuevos archivos de tab
- `src/components/admin/adminTranslations.ts` — nuevo
- `src/components/admin/AdminUserOverview.tsx` — busqueda + filtros + detalle

