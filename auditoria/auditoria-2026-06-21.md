# Auditoría Técnica y de Producto — EvoFinz
**Fecha:** 21 de junio de 2026  
**Autor:** Claude (auditor técnico automatizado)  
**Rama:** `claude/dreamy-cray-x0s721`  
**App:** expense-evolution-ai → evofinz.com

---

## 1. ESTADO GENERAL

### Qué hace la app
EvoFinz es una app de finanzas personales y para PyMEs, multi-país (Canada + Chile), con:
- Seguimiento de gastos e ingresos (con OCR de boletas)
- Presupuesto, facturas recurrentes, clientes, proyectos, contratos
- Calendario fiscal, optimizador de impuestos, T2125, RRSP/TFSA (Canada), APV (Chile)
- Calculadora FIRE, patrimonio neto
- Análisis bancario con importación de CSV
- Asistente de voz (ElevenLabs TTS)
- Gamificación (XP, streaks, misiones)
- Mentoría financiera
- Sistema admin completo con CRM, leads y revenue dashboard

### Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn-ui (Radix) + Tailwind CSS 3.4 |
| Estado | TanStack Query v5 |
| Backend/DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Pagos | Stripe (via Supabase Edge Functions) |
| IA | Anthropic Claude (OCR, análisis) + ElevenLabs (voz) |
| Hosting | Vercel (SPA) |
| PWA | vite-plugin-pwa |

### Qué tan completa está
**Muy completa en features, con detalles de producción pendientes.** Tiene:
- **906 archivos** de código fuente, ~36.000 líneas
- **43 páginas/rutas**, **127 migraciones** de BD, **90+ hooks** personalizados, **40+ Edge Functions**
- Sistema de pagos Stripe con productos reales configurados en producción
- Feature gating por plan implementado y funcionando
- Panel admin con CRM, métricas de revenue, leads y beta testers

La app es claramente un producto real, no un prototipo. Está en producción. El problema no es que no esté lista: es que tiene **bugs específicos que bloquean el flujo de dinero**.

---

## 2. BLOQUEADORES PARA VENDER/MONETIZAR

### 🔴 Bug Crítico #1: Stripe no abre en mobile (bloqueador de conversión)

**Archivo:** `src/hooks/data/useSubscription.ts:106`

```typescript
// Esto falla silenciosamente en iOS Safari y muchos browsers mobile
if (data?.url) {
  window.open(data.url, '_blank');  // ← PROBLEMA
```

**Por qué falla:** La función `createCheckout` llama `await supabase.functions.invoke(...)` antes de hacer `window.open`. En iOS Safari y Android Chrome, los browsers bloquean `window.open` si no está **directamente** en el handler de un click del usuario (sin `await` de por medio). Al meter el `await` antes del open, el contexto del gesto del usuario se pierde y el navegador bloquea el popup.

**Consecuencia:** Un usuario en celular toca "Suscribirse", espera... y no pasa nada. El URL de Stripe se bloquea silenciosamente. No hay mensaje de error visible. El usuario cree que la app está rota y no paga.

**Solución:** Reemplazar `window.open(data.url, '_blank')` con `window.location.href = data.url` para hacer una redirección en la misma ventana. Stripe maneja el return_url correctamente.

---

### 🔴 Bug Crítico #2: URL de retorno post-pago puede ser incorrecta

**Archivo:** `supabase/functions/create-checkout/index.ts:103`

```typescript
const origin = req.headers.get("origin") || "https://evofinz.lovable.app";
//                                            ↑ URL INCORRECTA como fallback
```

Si el header `origin` viene vacío (puede pasar en algunas configuraciones de proxy o si el browser no lo envía), el `success_url` de Stripe lleva al usuario a `evofinz.lovable.app` en vez de `evofinz.com`. El usuario **paga** y queda en la URL de Lovable, que puede no ser la producción actual.

Lo mismo en `customer-portal/index.ts:54`.

Hay también una referencia a `evofinz.lovable.app` hardcodeada en el texto de los términos de servicio del checkout de Stripe:
```typescript
message: 'Al suscribirte, aceptas nuestros [términos de servicio](https://evofinz.lovable.app/legal)...'
```

**Solución:** Cambiar el fallback a `https://evofinz.com` y actualizar el link de términos.

---

### 🟡 Problema #3: Sin Apple Pay ni Google Pay en mobile

**Archivo:** `supabase/functions/create-checkout/index.ts:145`

```typescript
payment_method_types: ['card'],  // Solo tarjeta
```

En mobile, pedir número de tarjeta es la mayor fuente de abandono de checkout (estudios de Stripe muestran 30-50% menos conversión vs wallet payments). Apple Pay y Google Pay se activan en el módulo de Stripe sin código extra: solo hay que quitar el `payment_method_types` y dejar que Stripe detecte automáticamente los métodos disponibles.

**Solución:** Eliminar la línea `payment_method_types: ['card']` o cambiarlo a `['card', 'apple_pay', 'google_pay']`.

---

### 🟡 Verificación: ¿Los pagos funcionan actualmente?

La infraestructura de Stripe **está bien construida**:
- Edge Functions `create-checkout`, `check-subscription`, `customer-portal`, `stripe-webhook` están presentes y tienen lógica correcta
- Los Product IDs de Stripe son reales y están sincronizados entre el frontend y las Edge Functions
- El webhook maneja correctamente los eventos `customer.subscription.*`
- El sistema guarda el estado en `user_subscriptions` y lo sincroniza con Stripe en cada verificación
- El feature gating responde al plan_type correctamente

**Conclusión:** Los pagos funcionan en desktop. En mobile están bloqueados por el bug #1.

---

## 3. PROBLEMAS DE MOBILE/UX

### Bug de Scroll Reportado

El bug de scroll en mobile que mencionó Rudy probablemente viene de **conflicto entre clases CSS**:

**Clase `mobile-app-shell`** (usada en el Layout para rutas autenticadas):
```css
.mobile-app-shell {
  overflow: hidden;          /* ← bloquea todo scroll */
  overscroll-behavior: none; /* ← no hay scroll natural */
}
```

**`@media (max-width: 639px)` en `html, body`:**
```css
overscroll-behavior-y: none;  /* ← desactiva bounce de iOS */
```

**Clase `public-scroll-page`** (para páginas públicas como Landing):
```css
overflow-y: auto !important;
touch-action: pan-y !important;
-webkit-overflow-scrolling: touch;
```

El diseño funciona así: `mobile-app-shell` contiene un `mobile-app-main` que tiene `overflow-y: auto`. El scroll ocurre dentro del contenedor, no en el body. Esto está bien diseñado, pero **si alguna página anidada tiene un `overflow: hidden` propio** (cosa común en diálogos, cards con animaciones, etc.), puede "atrapar" el scroll y dejarlo muerto. El bug específico requiere reproducirlo en dispositivo físico para pinpointear exactamente dónde falla.

### Otros Problemas UX Mobile

**Navegación:** El menú sidebar desktop tiene 30+ opciones organizadas en secciones. En mobile se convierte en un Sheet drawer, que funciona pero es cognitivamente pesado.

**Teclado virtual en iOS:** Los Dialogs (modals) de Radix UI tienen un problema conocido en iOS donde el contenido queda detrás del teclado virtual al abrir un input. La app no parece tener workaround específico para esto (el viewport no se ajusta automáticamente en WKWebView de iOS).

**Touch targets:** El CSS define `--mobile-touch-target: 44px` (correcto según iOS HIG) y hay clases `.btn-touch` aplicadas. Bien.

**Tablas en mobile:** Tienen `.table-responsive` con `overflow-x: auto` y `-webkit-overflow-scrolling: touch`. Correcto.

**Checkout abre nueva pestaña:** Incluso si se arregla el `window.open` con `window.location.href`, el flujo de pago abandona la app y vuelve. Esto es normal para Stripe pero en mobile puede percibirse como "fui a otro lado y perdí mi lugar".

---

## 4. BUGS Y RIESGOS TÉCNICOS

### 🔴 Edge Function `auth-email-hook/index.ts:49`
```typescript
const SAMPLE_PROJECT_URL = "https://expense-evolution-ai.lovable.app"
```
Este valor está en la sección de datos de preview/muestra. Los emails reales usan la URL del proyecto de Supabase, no este string. **No afecta producción** pero podría confundir a quien lo edite.

### 🟡 Paquete `xlsx` con vulnerabilidades conocidas
**Archivo:** `package.json:85` → `"xlsx": "^0.18.5"`

La librería SheetJS `xlsx` v0.18.5 tiene vulnerabilidades de contaminación de prototipo (CVE-2023-30533). Aunque el impacto es bajo al ser solo exportación del lado del cliente, es técnicamente riesgoso si usuarios suben archivos maliciosos. El mantenedor ofrece una versión comercial segura o se puede reemplazar con `exceljs` (que ya tienen instalada: v4.4.0 en `package.json:64`).

**Solución:** Migrar la lógica de exportación de `xlsx` a `exceljs` (ya está como dependencia) y eliminar `xlsx`.

### 🟡 Router dual (BrowserRouter/HashRouter)
**Archivo:** `src/App.tsx:439-443`
```typescript
const shouldUseHashRouter = /* detects hash-based redirect from 404.html */
const Router = shouldUseHashRouter ? HashRouter : BrowserRouter;
```

La lógica es inteligente (detecta si llegó desde un redirect de 404 y usa hash routing temporalmente), pero el `vercel.json` ya tiene el catch-all correcto (`"source": "/(.*)" → "/index.html"`). Este mecanismo de doble router puede ser fuente de bugs sutiles de navegación si el estado de `shouldUseHashRouter` es inesperado.

### 🟡 Falta `.env.example`
Las credenciales de Supabase están solo en `.env` sin template de ejemplo. Si alguien hace fork o deployment nuevo, no sabe qué variables configurar. Las keys del frontend son `VITE_SUPABASE_*` (publishable, no secretas), pero los secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) están en Supabase y no están documentados.

### 🟢 Buenas noticias técnicas
- Row Level Security (RLS) en **todas** las tablas: los datos de un usuario nunca se exponen a otro
- `_shared/plan-guard.ts` centraliza los checks de plan en las Edge Functions de IA
- `lazyWithRetry()` con backoff exponencial para lazy loading de rutas: resiliente a errores de red
- Error boundary global (`ErrorBoundary.tsx`) con fallback y botón de "Reportar bug"
- `useUndoableAction` para gastos: Ctrl+Z funciona
- Validación Zod en formularios y en schemas de Edge Functions

---

## 5. PLAN PRIORIZADO (por impacto en ingresos)

### Prioridad 1 — Esta semana (bloqueadores de caja)

**A. Arreglar el checkout en mobile**  
`src/hooks/data/useSubscription.ts:104-109`  
Cambiar `window.open(data.url, '_blank')` por `window.location.href = data.url`.  
Tiempo estimado: **15 minutos**. Impacto: desbloquea 100% de los usuarios mobile que intentan pagar.

**B. Arreglar la URL de fallback post-pago**  
`supabase/functions/create-checkout/index.ts:103`  
`supabase/functions/customer-portal/index.ts:54`  
Cambiar `"https://evofinz.lovable.app"` por `"https://evofinz.com"`. También actualizar el link de términos en la línea 141.  
Tiempo estimado: **10 minutos**. Impacto: evita que usuarios paguen y queden en URL incorrecta.

### Prioridad 2 — Esta semana (mejoras directas de conversión)

**C. Activar Apple Pay / Google Pay**  
`supabase/functions/create-checkout/index.ts:145`  
Eliminar `payment_method_types: ['card']` o agregar `'apple_pay', 'google_pay'`.  
Tiempo estimado: **5 minutos**. Impacto: puede subir conversión mobile 20-40%.

**D. Investigar y reproducir el bug de scroll mobile**  
Probar en iPhone (Safari) y Android (Chrome) las rutas: Dashboard, Expenses, Landing.  
Enfocarse en: ¿hay alguna página donde el contenido queda estático y no se puede scrollear?  
Si se reproduce: revisar si la página usa `mobile-app-shell` correctamente y si hay algún `overflow: hidden` sobrante.  
Tiempo estimado: **1-2 horas de QA**.

### Prioridad 3 — Próximas 2 semanas (UX y retención)

**E. Simplificar el menú mobile**  
El sidebar tiene 30+ opciones. Para mobile, considerar mostrar solo las 6-8 más usadas (Dashboard, Gastos, Ingresos, Presupuesto, Bills, Buscar) y mover el resto a "Más" o Settings.

**F. Mejorar el onboarding de free → paid**  
Actualmente el upgrade aparece cuando el usuario topa un límite (UpgradePrompt). Agregar un banner suave en el Dashboard para usuarios free con 7+ días de uso que muestre el beneficio del upgrade (no solo el bloqueo).

**G. Verificar el webhook de Stripe en producción**  
Confirmar en el dashboard de Stripe que el webhook `stripe-webhook` está activo y apuntando a la URL correcta de Supabase. Si no, los estados de suscripción no se actualizan en tiempo real (solo al relogin).

### Prioridad 4 — Próximo mes (crecimiento)

**H. Migrar `xlsx` a `exceljs`**  
Eliminar la vulnerabilidad y la dependencia redundante. Ya tienen `exceljs` instalado.

**I. E2E test del flujo de pago**  
Agregar un test Playwright que simule el flujo completo: registro → upgrade → vuelta al dashboard con plan activo. Esto previene regresiones en el flujo más crítico.

**J. Página de precios standalone**  
La landing tiene una sección de precios que funciona bien. Agregar `/pricing` como ruta independiente para campañas de marketing.

---

## 6. RECOMENDACIÓN FINAL

**La 1 cosa que Rudy debería hacer primero:**

**Arreglar el `window.open` por `window.location.href` en el checkout de Stripe.**

En un mundo donde más del 60% del tráfico web es mobile, tener el flujo de pago roto en mobile significa que la mayoría de los usuarios que intentan pagar no pueden. El arreglo toma 15 minutos y no rompe nada en desktop.

Después de eso, el segundo fix (URL de fallback) también toma 10 minutos y cierra el ciclo: usuario paga → vuelve a evofinz.com → ve su plan activo.

Con esos dos cambios, EvoFinz puede empezar a cobrar correctamente.

---

## Apéndice: Resumen de Hallazgos

| # | Tipo | Severidad | Descripción | Tiempo Fix |
|---|------|-----------|-------------|-----------|
| 1 | Bug | 🔴 Crítico | `window.open` bloqueado en mobile → pago no funciona | 15 min |
| 2 | Bug | 🔴 Crítico | URL fallback post-pago apunta a `lovable.app` | 10 min |
| 3 | UX | 🟡 Alto | Sin Apple Pay / Google Pay en checkout | 5 min |
| 4 | Bug | 🟡 Alto | Scroll mobile potencialmente roto (sin confirmar) | 1-2h QA |
| 5 | Seguridad | 🟡 Medio | `xlsx` v0.18.5 con vulnerabilidades conocidas | 2-4h |
| 6 | Tech Debt | 🟢 Bajo | Router dual BrowserRouter/HashRouter | — |
| 7 | Docs | 🟢 Bajo | Falta `.env.example` | 15 min |
| 8 | UX | 🟢 Bajo | Menú mobile con 30+ opciones (demasiado) | 1-2 días |
| 9 | Negocio | 🟡 Medio | Webhook Stripe no verificado en producción | verificar |
