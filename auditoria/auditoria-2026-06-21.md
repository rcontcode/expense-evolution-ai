# Auditoría Técnica y de Producto — EvoFinz / expense-evolution-ai
**Fecha:** 21 de junio de 2026  
**Auditor:** Claude Sonnet 4.6 (autónomo)  
**Rama:** claude/dreamy-cray-i2nnhd  
**Repo:** rcontcode/expense-evolution-ai

---

## 1. ESTADO GENERAL

### Qué hace la app
EvoFinz es una app de finanzas personales y para PyMEs, multi-país (Chile 🇨🇱 y Canadá 🇨🇦 como mercados principales, con inglés/español). Cubre un rango enorme de funciones:

- **Core personal**: Gastos, ingresos, presupuesto, pagos fijos, suscripciones detectadas por IA
- **Business**: Clientes, proyectos, contratos con análisis IA, kilometraje, facturación
- **Riqueza**: Patrimonio neto, ahorro, inversiones, conciliación bancaria
- **Impuestos**: Optimizador fiscal, calendario tributario, reporte T2125 (Canadá), APV (Chile)
- **IA**: OCR de boletas, Chaos Inbox (clasificación automática), análisis de extractos bancarios, voice assistant, asistente de chat
- **Gamificación**: Financial Adventure (misiones, logros)
- **Mentorship**: Módulos educativos (Kiyosaki, Clear, Robbins, etc.)
- **Admin**: CRM de leads, panel beta testers, gestión de demos

### Stack técnico
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18.3, Vite 5.4, TypeScript 5.8, React Router 7 |
| UI | Tailwind CSS 3.4, shadcn/ui, Radix UI (40+ componentes) |
| Estado | TanStack Query 5.83, React Context |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions en Deno) |
| Pagos | Stripe (checkout, webhooks, portal) |
| IA/Voz | ElevenLabs TTS, OCR via edge functions |
| Exports | jsPDF, ExcelJS, XLSX, react-pdf |
| Deploy | Vercel + Lovable, PWA habilitado |

### Qué tan completa está
**Muy completa para ser un producto indie.** Tiene:
- 50+ páginas/rutas
- 43 edge functions en producción
- 126 migraciones de base de datos
- 9 archivos de tests (mínimo pero existe)
- Diseño responsive con 10+ temas visuales
- Multilenguaje (ES/EN) en casi todo

**Pero tiene mucho alcance** (scope creep). Abarca casi todo lo que existe en el mercado de finanzas, lo que dilata el tiempo de llegada a usuarios.

---

## 2. BLOQUEADORES PARA VENDER / MONETIZAR

### ¿Está Stripe funcionando?
**SÍ. Stripe está completamente integrado.** No es un botón falso.

**Planes y precios:**
| Plan | Mensual | Anual |
|------|---------|-------|
| Premium | USD $7.99/mes | $77.88/año ($6.49/mes) |
| Pro | USD $14.99/mes | $143.88/año ($11.99/mes) |
| Bundle | USD $19.99/mes | $191.88/año ($15.99/mes) |

**Flujo implementado:**
- `create-checkout` → sesión Stripe → pago
- `stripe-webhook` → actualiza base de datos
- `customer-portal` → gestión de suscripción
- `check-subscription` → verificación en cada sesión
- Feature gating completo con `usePlanLimits()`

### 🔴 Bug crítico de conversión: pago bloqueado en iOS Safari

**Este es el bloqueador más importante de monetización hoy.**

En `useSubscription.ts:106`:
```typescript
if (data?.url) {
  // Open in new tab
  window.open(data.url, '_blank');
```

El problema: `window.open()` se llama **después** de un `await` (llamada async a Supabase). iOS Safari (iPhone) bloquea popups que no se abren en el handler directo del click del usuario. El resultado práctico:

- **Android Chrome / escritorio**: funciona bien
- **iPhone Safari**: la ventana de pago se bloquea silenciosamente, o en el mejor caso aparece como popup bloqueado

Si tus usuarios están en móvil (lo que es altísimamente probable), **un porcentaje importante está intentando pagar y no puede**. Esto es dinero que se está yendo.

**Fix simple**: abrir la ventana ANTES del await, y luego cambiar su URL:
```typescript
const payWindow = window.open('', '_blank'); // Abre inmediatamente en el click
const { data } = await supabase.functions.invoke('create-checkout', ...);
if (data?.url && payWindow) {
  payWindow.location.href = data.url; // Redirige la ventana ya abierta
}
```

### 🟡 Problema menor: múltiples product IDs de Stripe en código

El webhook tiene product IDs viejos y nuevos hardcodeados juntos (`prod_TuPUlFnv10u2OA` como "old premium" junto a `prod_U4OdR9JHiXuKho` como nuevo). Esto sugiere que hubo una migración de productos a mitad de camino. Técnicamente funciona, pero es frágil y confuso. Documentar cuándo expiran las suscripciones viejas.

### 🟡 Sin .env.example en el repo
No hay archivo `.env.example`. Alguien que quiera hacer dev local tiene que adivinar las variables. No es un bloqueador de ventas pero sí de colaboración.

### ✅ El plan Free tiene límites bien definidos
El plan gratuito es funcional pero limitado (50 gastos/mes, 5 OCR, 2 clientes), lo que crea una razón real para upgradar. Está bien pensado.

---

## 3. PROBLEMAS DE MOBILE / UX

### Bug de scroll: parcialmente resuelto
Rudy mencionó un bug de scroll en mobile. El último commit en esta rama (`31de8e7`, "Corrigió scroll móvil en rutas") aplicó un fix el 5 de junio de 2026, tocando `App.tsx`, `Layout.tsx`, e `index.css`.

**El patrón de scroll es correcto en CSS:**
```css
.mobile-app-shell {
  height: 100dvh;
  overflow: hidden;    /* Shell no scrollea */
}
.mobile-app-main {
  overflow-y: auto;    /* Solo el contenido scrollea */
  -webkit-overflow-scrolling: touch;
}
```

**Pero queda un problema residual:** hay varios lugares que todavía llaman `window.scrollTo()`:
- `src/hooks/utils/useHighlightOnArrival.ts:91` — `window.scrollTo({ top: 0 })`
- `src/pages/Privacy.tsx:44` — `window.scrollTo(0, 0)`
- `src/pages/admin/DemoStudio.tsx:440` — `window.scrollTo({ top: 0 })`

Esto no funciona en mobile porque el scrollable container es `.mobile-app-main`, no `window`. El síntoma: al navegar a ciertas secciones destacadas, la página no sube al tope. Menor pero visible.

### Problemas de UX mobile adicionales

**🟡 Navegación muy densa:** el sidebar tiene 30+ ítems en 6 secciones. En desktop está bien colapsado. En mobile, el menú hamburguesa muestra todo en pantalla y requiere mucho scroll para encontrar algo. Una app de finanzas que usa gente diariamente en el celular debería tener 4-5 acciones al frente y el resto enterrado.

**🟡 Muchas features de Pro detrás de lock screens:** el Feature Gate está bien implementado, pero si hay demasiados "candados" en la primera sesión, el usuario free puede sentir que no puede hacer nada y abandona. Hay que calibrar qué se muestra primero.

**🟡 `window.open()` para portal de Stripe también afectado:** la misma función de popup bloqueado en iOS aplica para `openCustomerPortal()` en `useSubscription.ts:144`. Si un usuario en iPhone quiere cancelar o cambiar plan, también puede ser bloqueado.

**🟡 El quiz financiero (landing):** tiene UI compleja con `QuizHero` y estilos recién revisados en el último commit. No pude verificar el render real, pero fue parte del fix de scroll, así que puede tener regresiones.

---

## 4. BUGS Y RIESGOS TÉCNICOS

### 🔴 Riesgo crítico: CORS abierto en todas las edge functions
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",   // ← todas las functions tienen esto
```

En Supabase Edge Functions esto es común durante desarrollo. Para producción, idealmente restringirlo al dominio de la app (`https://evofinz.com`). Con `*`, cualquier página puede llamar a tus APIs. En la práctica, las functions requieren auth token así que el riesgo real es bajo, pero es técnica deuda de seguridad.

### 🟡 126 migraciones SQL
Hay 126 archivos de migración. Eso es mucho para el tiempo de vida probable de este proyecto. Indica desarrollo rápido con cambios frecuentes de schema. El riesgo: si alguna migración falla en producción a mitad de camino, puede dejar la base de datos en estado inconsistente. Recomiendo revisar si hay duplicados o migraciones que se anulen mutuamente.

### 🟡 `package.json` con nombre por defecto de Lovable
```json
"name": "vite_react_shadcn_ts"
```
Es el nombre default del template de Lovable. No afecta producción pero es descuidado.

### 🟡 Dependencias en versiones un poco desfasadas
- `react-pdf: 9.2.1` (fija, sin `^`) — puede tener vulnerabilidades sin patch automático
- `framer-motion: ^12.23.26` — API 12.x tiene breaking changes respecto a 10.x/11.x

### 🟡 Tests muy limitados
9 archivos de test pero son principalmente unit tests de configuración (verifican que los IDs de Stripe tengan el formato correcto, etc). No hay tests end-to-end del flujo crítico: signup → upgrade → feature access. Si algo se rompe en el checkout, nadie se entera hasta que un usuario lo reporta.

### 🟢 Lo que está bien
- RLS (Row-Level Security) de Supabase correctamente configurado
- Lazy loading de todas las páginas con retry automático
- Error boundary para componentes lazy
- Preloading de rutas core en idle time (buena performance)
- Versiones viejas de productos Stripe también manejadas en el webhook

---

## 5. PLAN PRIORIZADO PARA MONETIZAR

### Prioridad 1 — Esta semana (dinero perdido hoy)

**Fix iOS Safari bloqueando el checkout** (`useSubscription.ts:83-120`)  
Este es el único fix que puede aumentar ingresos mañana. Si hay usuarios en iPhone que hacen click en "Suscribirse" y nada pasa, se van. El fix es 5 líneas de código.

```typescript
// Cambiar esto:
const { data } = await supabase.functions.invoke('create-checkout', ...);
if (data?.url) window.open(data.url, '_blank');

// Por esto:
const payWindow = window.open('', '_blank'); // Antes del await
const { data } = await supabase.functions.invoke('create-checkout', ...);
if (data?.url && payWindow) {
  payWindow.location.href = data.url;
} else if (data?.url) {
  window.location.href = data.url; // fallback: misma tab
}
```

Aplicar el mismo fix a `openCustomerPortal()`.

### Prioridad 2 — Esta semana (conversión)

**Definir el usuario objetivo principal**  
La app tiene demasiado. Freelancers chilenos con boletas de honorarios, o contadores canadienses con T2125, son audiencias muy distintas. Elegir UNA como ICP (Ideal Customer Profile) y poner esa funcionalidad al frente. El resto puede existir pero no debe distraer en el onboarding.

**Mejorar el primer minuto del usuario Free**  
El usuario nuevo debería poder registrarse y en 60 segundos ver un dashboard que ya hace algo útil. Revisar si el onboarding pide demasiada info antes de mostrar valor.

### Prioridad 3 — Próximas 2 semanas (retención)

**Notificaciones de valor por email**  
Ya existe `send-weekly-report`. Asegurarse de que está activado y que el reporte sea bueno. Un email semanal que dice "gastaste X en comida este mes" es lo que retiene usuarios gratis y los convierte en pagos.

**Fix residual de scroll** (`useHighlightOnArrival.ts:91`)  
Cambiar `window.scrollTo()` por `document.querySelector('.mobile-app-main')?.scrollTo()`. Mejora la sensación en mobile.

### Prioridad 4 — Un mes (crecimiento)

**Landing page con prueba social**  
La landing actual es técnicamente funcional pero no veo testimonios, números de usuarios, o casos de uso específicos. Para convertir tráfico orgánico, la landing necesita "prueba de que esto funciona para gente como yo".

**Quiz de leads más corto**  
El quiz financiero existe y es una buena idea para capturar leads. Revisar que no tenga demasiados pasos antes de pedir el email.

**Resolver el Bundle plan**  
El plan Bundle (USD $19.99) integra EvoFinz con "Fokuspark". Si Fokuspark no está listo o no hay usuarios en ambas, este plan confunde más que ayuda. O lanzarlo con más claridad o ocultarlo por ahora.

### Prioridad 5 — Después de tener tracción

- Tests E2E del flujo de pago
- Soporte más países (México, Colombia, España están en roadmap)
- Restricciones CORS en edge functions
- Limpiar migraciones duplicadas

---

## 6. RECOMENDACIÓN FINAL

**La 1 cosa que Rudy debería hacer primero:**

**Arreglar el `window.open()` del checkout para iOS Safari.**

No importa cuánto tráfico tenga la app, ni cuánto buen copy tenga la página de precios. Si un usuario en iPhone hace click en "Suscribirme" y no pasa nada, es dinero que se va. iOS Safari es el browser de una parte significativa de los usuarios de finanzas personales (gente que cuida su plata tiende a tener iPhone). Este bug convierte lo que debería ser una venta en una experiencia rota.

El fix toma 30 minutos. El ROI es inmediato.

Todo lo demás (scroll, UX, más features) viene después.

---

## Resumen ejecutivo

| Dimensión | Nota | Comentario |
|-----------|------|-----------|
| Completitud del producto | 8/10 | Feature-completo, quizás demasiado |
| Monetización activa | 7/10 | Stripe funciona, pero hay un bug crítico en iOS |
| Mobile UX | 6/10 | Scroll fix reciente, quedan issues menores |
| Seguridad | 7/10 | RLS bien, CORS mejorable |
| Calidad de código | 7/10 | TypeScript limpio, tests mínimos |
| Listo para vender | 7/10 | Sí, si se arregla el checkout en iOS |

**La app está en muy buen estado para ser un proyecto indie.** El stack es sólido, Stripe está cableado, y hay features reales. El obstáculo número uno para generar ingresos no es una feature faltante — es un bug de 30 minutos en el flujo de pago móvil.
