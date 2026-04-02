

# Plan de Lanzamiento — EvoFinz, Fokuspark, UniversMind

## Estado actual: LISTO PARA LANZAR

No hay errores críticos bloqueantes. Las 3 apps están funcionales.

---

## PASO 1: Publicar las apps (5 minutos)

### EvoFinz (esta app)
1. Click **Publish** (botón arriba a la derecha)
2. Click **Update** para publicar los últimos cambios
3. Ve a **Settings → Domains** y verifica que `evofinz.com` esté conectado y Active

### Fokuspark
1. Abre el proyecto Fokuspark en Lovable
2. Click **Publish → Update**
3. Verifica dominio `fokuspark.com`

### UniversMind
1. Abre el proyecto UniversMind en Lovable
2. Click **Publish → Update**
3. Verifica dominio `universmind.com`

---

## PASO 2: Google Cloud — Ajuste rápido (2 minutos)

En `console.cloud.google.com` → tu proyecto → **Branding**:

1. **App name**: Cambia a `Evolarys`
2. **Home page**: `https://evolarys.com` (o `https://evofinz.com`)
3. **Logo**: Pon uno neutro del ecosistema
4. **NO toques** los dominios autorizados ni las credenciales existentes
5. **Save**

Eso es TODO. No crees proyectos nuevos.

---

## PASO 3: Usar el CRM para el lanzamiento

### 3A. Enviar emails de lanzamiento desde el CRM

1. Ve a `/admin/crm` en EvoFinz
2. Pestaña **Leads** → tienes todos los leads de las 3 apps
3. Filtra por fuente:
   - **"EvoFinz"** → leads de EvoFinz
   - **"Fokuspark"** → leads de Fokuspark
   - **"UniversMind"** → leads de UniversMind

### 3B. Qué plantilla usar para cada app

| App | Primer contacto | Bienvenida | Reactivación | Oferta |
|-----|-----------------|------------|--------------|--------|
| EvoFinz | `crm-evofinz-outreach` | `crm-evofinz-welcome` | `crm-evofinz-reactivation` | `crm-evofinz-offer` |
| Fokuspark | `crm-fokuspark-outreach` | `crm-fokuspark-welcome` | `crm-fokuspark-reactivation` | `crm-fokuspark-offer` |
| UniversMind | `crm-universmind-outreach` | `crm-universmind-welcome` | `crm-universmind-reactivation` | `crm-universmind-offer` |

El sistema **selecciona automáticamente** la plantilla correcta según el `leadSource`. No necesitas elegir manualmente.

### 3C. Flujo de lanzamiento recomendado

**Día 1 — HOY:**
1. Filtra leads **Hot** (prioridad alta) de cada app
2. Envía email de **Welcome** a los que ya tienen cuenta
3. Envía email de **Outreach** a los que solo hicieron el quiz
4. Los follow-ups se activan automáticamente si tienes reglas configuradas

**Día 2-3:**
1. Revisa en el CRM pestaña **Seguimientos** qué leads no abrieron
2. Envía **Follow-up** manual o automático (el sistema usa `crm-follow-up` con branding dinámico según la app de origen)

**Día 7:**
1. El **Reporte Semanal** se envía automáticamente con métricas de las 3 apps
2. Revisa en pestaña **Analytics/BI** las conversiones por app

### 3D. Para enviar emails masivos

1. En la tabla de leads, selecciona múltiples leads con los checkboxes
2. Click **Acciones masivas** → **Enviar email**
3. El sistema detecta la app de origen de cada lead y usa el branding correcto automáticamente

### 3E. Automatización (ya configurada)

Las reglas de automatización en la pestaña **Reglas** ya manejan:
- Asignación automática de secuencias de nurturing
- Follow-ups programados con ventanas de horario
- Branding dinámico por app de origen

---

## PASO 4: Mensajes sugeridos para el lanzamiento

### Para leads de EvoFinz (finanzas):
> **Asunto**: Tu evolución financiera comienza hoy
> **Cuerpo**: Hemos lanzado nuevas herramientas para que tomes control de tus finanzas. Proyecciones inteligentes, presupuestos automáticos y más te esperan.

### Para leads de Fokuspark (productividad):
> **Asunto**: Tu enfoque merece un upgrade
> **Cuerpo**: Fokuspark está listo con timer de enfoque, respiración guiada y journaling reflexivo. Todo diseñado para que rindas al máximo.

### Para leads de UniversMind (bienestar):
> **Asunto**: Expande tu mente — UniversMind está aquí
> **Cuerpo**: Meditaciones guiadas, herramientas de reflexión y un camino de bienestar personalizado te esperan en UniversMind.

---

## PASO 5: Verificación post-lanzamiento

1. **Prueba el login** en cada app (email + Google) con una cuenta de prueba
2. **Envía un email de prueba** desde el CRM a tu propio correo
3. **Revisa** que los dominios de email estén Active en cada proyecto (Cloud → Emails)
4. **Monitorea** el CRM las primeras 24h para ver entregas y aperturas

---

## Resumen: Orden de acciones

```text
1. Publish EvoFinz      → 1 min
2. Publish Fokuspark     → 1 min  
3. Publish UniversMind   → 1 min
4. Google Cloud branding → 2 min
5. CRM: filtrar hot leads → enviar outreach
6. Monitorear respuestas día 2-3
7. Revisar reporte semanal día 7
```

No se requieren cambios de código. Todo está listo para lanzar.

