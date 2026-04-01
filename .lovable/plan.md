

# Plan: Optimizar cuota beta + Guía completa de invitación con referidos

## Análisis de la cuota actual

El sistema actual exige **2 contribuciones cada 14 días** (feedback con comentario de 50+ caracteres o bug reports). Si no se cumple, el perfil se degrada a `free` automáticamente.

**Evaluacion: Es demasiado flojo.** Con solo 2 reportes superficiales cada 2 semanas, un tester recibe acceso Pro completo sin aportar valor real. El costo para nosotros es alto (features Pro gratis) y el beneficio es mínimo.

### Cuota recomendada: 4 contribuciones cada 14 días (con calidad)

Justificacion:
- **4 en 14 dias = ~1 cada 3.5 dias** — ritmo realista pero exigente
- **Al menos 1 debe ser bug report** — garantiza testing real, no solo ratings
- **Feedback con comentario de 80+ caracteres** (subir de 50) — fuerza reportes con sustancia
- **Los primeros 14 días son de gracia** — para que el tester explore sin presion

Esto da valor directo: ~8 reportes de calidad por mes por tester, con bugs reales incluidos.

## Cambios

### 1. Archivo: migración SQL — Actualizar `check_beta_weekly_quota`

Cambiar la función para:
- `required` de 2 a 4
- Agregar validacion de que al menos 1 sea bug report
- Subir el mínimo de caracteres de comment de 50 a 80
- Periodo de gracia de 14 días desde `beta_activated_at` (no aplica cuota en ese periodo)
- Retornar campos adicionales: `min_bugs_required: 1`, `bugs_submitted`, `grace_period`

### 2. Archivo: `src/pages/admin/BetaCodes.tsx` — Tab "Invitar" completa

Agregar la tercera tab "Invitar" con TODO el contenido necesario:

**Seccion 1: "Cómo funciona el programa" (guía visual 5 pasos)**
1. Generas códigos en la tab "Códigos"
2. Seleccionas un código y una plantilla aquí
3. Copias el mensaje y lo envías por WhatsApp/Email
4. Tu invitado se registra con el código
5. El invitado va a "Beta Feedback" para reportar

**Seccion 2: "Qué debe hacer un beta tester" (requisitos claros)**
- Card con requisitos mínimos:
  - 4 contribuciones cada 14 días
  - Al menos 1 bug report
  - Comentarios de 80+ caracteres
  - Si no cumple: acceso Pro se degrada a Free
- Card "Qué reportar":
  - Errores visuales, funciones que no cargan, datos incorrectos
  - Sugerencias de mejora con detalle
  - Problemas de rendimiento/velocidad
  - Calificar cada sección que uses (facilidad, utilidad, diseño)
- Card "Dónde reportar":
  - Ir a "Beta Feedback" en el menú lateral
  - Tab "Evaluación": califica secciones con estrellas + comentarios
  - Tab "Bug Report": reporta errores con capturas
  - Cada reporte suma puntos para subir de nivel

**Seccion 3: "Sobre los referidos" (cómo invitar amigos)**
- Explica que una vez activados como beta testers, ellos también pueden generar su propio código de referido desde su perfil/dashboard
- Cada referido exitoso = +1 slot de referido + 100 puntos
- No se permite auto-referido

**Seccion 4: "Generador de mensajes" (lo ya planeado)**
- Select de código activo
- Select de plantilla (WhatsApp ES, WhatsApp EN, Email ES, Email EN)
- Textarea editable
- Botones "Copiar mensaje" y "Copiar solo link"

**Seccion 5: "Sistema de niveles y recompensas" (resumen rápido)**
- Bronze → Silver → Gold → Platinum → Diamond
- Puntos por cada feedback/bug report
- Recompensas canjeables (Premium 1 año, Pro 6 meses, Pro 1 año)

### Plantillas actualizadas (SIN IA, CON requisitos claros)

**WhatsApp ES:**
```
🔥 ¡Te invito a probar EvoFinz antes que nadie!

EvoFinz es una plataforma de finanzas personales que te ayuda a:
✅ Registrar gastos e ingresos fácilmente
✅ Escanear facturas y tickets con tu cámara
✅ Controlar tu presupuesto en tiempo real
✅ Gestionar contratos y suscripciones
✅ Visualizar tu patrimonio neto
✅ Calendario fiscal para tus obligaciones

🎯 Como beta tester recibes acceso GRATIS a todas las funciones Pro.

📋 ¿Qué necesitas hacer?
• Enviar al menos 4 reportes cada 14 días (feedback o bugs)
• Al menos 1 debe ser un reporte de bug
• Ir a "Beta Feedback" en el menú para calificar secciones o reportar errores
• ¡Ganas puntos por cada reporte y subes de nivel!

🏆 Niveles: Bronze → Silver → Gold → Platinum → Diamond
🎁 Canjea puntos por suscripciones reales (¡hasta 1 año de Pro gratis!)

👉 Regístrate aquí: https://evofinz.com/auth?beta={CODE}
🔑 Tu código de acceso: {CODE}

📋 Pasos:
1. Click en el link → crea tu cuenta con el código
2. Explora la app libremente (14 días de gracia)
3. Ve a "Beta Feedback" y empieza a reportar
4. ¡Gana puntos y desbloquea recompensas!

Una vez dentro, también podrás invitar a tus amigos con tu propio código de referido. ¿Te animas? 🚀
```

**WhatsApp EN, Email ES, Email EN:** Equivalentes traducidos.

### 3. Actualizar textos en `BetaGuide.tsx` y `BetaReminderBanner.tsx`

Actualizar las referencias de "2 contribuciones cada 14 días" a "4 contribuciones cada 14 días (al menos 1 bug report)" en todos los componentes que muestren esta información.

## Archivos a modificar

1. **Nueva migración SQL** — Actualizar `check_beta_weekly_quota` (4 contribuciones, 1 bug mínimo, 80 chars, grace period)
2. **`src/pages/admin/BetaCodes.tsx`** — Tab "Invitar" con guía completa + generador de mensajes
3. **`src/pages/BetaGuide.tsx`** — Actualizar requisitos de cuota
4. **`src/components/beta/BetaReminderBanner.tsx`** — Actualizar textos de cuota

