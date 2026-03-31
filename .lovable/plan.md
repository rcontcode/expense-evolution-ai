

# Estado actual y lo que falta para echar a andar los emails

## ✅ Lo que YA está listo

| Componente | Estado |
|---|---|
| **evofinz.com** — dominio de email | ✅ Verificado y activo |
| **Infraestructura de colas** (pgmq, cron job cada 5s) | ✅ Funcionando |
| **Edge Functions** (send-transactional-email, auth-email-hook, process-email-queue, send-crm-email, handle-email-unsubscribe, handle-email-suppression) | ✅ Desplegadas |
| **Plantilla CRM** (crm-lead-outreach) | ✅ Registrada |
| **Cloudflare** — 3 dominios activos | ✅ Confirmado |

## ⚠️ Lo que hay que corregir

### 1. SITE_NAME incorrecto en send-transactional-email
El `From:` de los correos transaccionales aparece como **"expense-evolution-ai"** en vez de **"EvoFinz"**. Hay que cambiar la línea 8 de `send-transactional-email/index.ts`:
- `"expense-evolution-ai"` → `"EvoFinz"`

### 2. universmind.com — dominio de email aún pendiente
El dominio `universmind.com` aparece con status **"initiated"** (no verificado). Esto significa que la delegación DNS todavía no se ha verificado. Hay que ir a **Cloud → Emails → Manage Domains** y hacer clic en **Verify Domain** para `universmind.com`.

### 3. fokuspark.com — dominio de email no configurado aún
`fokuspark.com` no tiene dominio de email configurado en este proyecto. Pero como Fokuspark es un **proyecto diferente en Lovable**, su configuración de email se hace desde ese proyecto, no desde este.

## 📋 Acciones a ejecutar (en este proyecto EvoFinz)

1. **Corregir SITE_NAME** en `send-transactional-email/index.ts` — cambiar `"expense-evolution-ai"` a `"EvoFinz"`
2. **Redesplegar** las edge functions afectadas (`send-transactional-email`)
3. **Verificar universmind.com** — pedirte que vayas a Cloud → Emails y hagas clic en "Verify Domain"

## 🔑 Sobre los otros proyectos

- **Universmind**: El dominio de email está en este mismo proyecto pero pendiente de verificación DNS. Una vez verificado, los correos CRM podrán enviarse desde `notify.universmind.com`.
- **Fokuspark**: Se configura desde su propio proyecto en Lovable. Cuando lo hagas, seguirás el mismo flujo: configurar dominio de email, agregar NS records en Cloudflare, verificar, y scaffoldear las plantillas.

## Resultado
Tras estos cambios, el sistema de emails automatizados del CRM estará listo para enviar correos a leads desde `noreply@evofinz.com` con el nombre "EvoFinz".

