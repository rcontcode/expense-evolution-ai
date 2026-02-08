

# Plan de Lanzamiento Beta - EvoFinz

## Objetivo
Lanzar la beta privada con 10-25 testers, contactándolos via WhatsApp y Email, y crear el contenido de marketing necesario.

---

## Estado Actual del Sistema

### Lo que YA tienes funcionando:

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| Quiz de captación | Activo | `/` (página principal) |
| CRM de Leads | Activo | `/admin/leads` |
| Lead scoring automático | Activo | Score 0-100 con prioridades |
| Gestión de códigos beta | Activo | `/admin/beta-codes` |
| Dashboard beta admin | Activo | `/admin/beta-dashboard` |
| Sistema de referidos | Activo | Mensajes pre-escritos listos |
| Onboarding gamificado | Activo | Tutorial de 9 pasos |
| Landing page completa | Activo | `/landing` |

### Datos actuales:
- 12 leads capturados
- 2 usuarios registrados
- 0 leads contactados (oportunidad de acción inmediata)

---

## Plan de Ejecución en 3 Fases

### FASE 1: Preparación (1-2 días)

#### 1.1 Contenido de Marketing a Crear

**Posts para redes sociales (3-5 imágenes):**

**Post 1 - Problema/Dolor:**
```
"¿Cuántas veces has terminado el mes preguntándote
a dónde se fue tu dinero?"

El 78% de las personas no tiene visibilidad
de sus gastos mensuales.

EvoFinz cambia eso.
📸 Foto → Gasto registrado en 3 segundos.

[CTA: Descubre tu nivel financiero - link al quiz]
```

**Post 2 - Demo/Feature:**
```
🎯 Control financiero en 3 pasos:

1. Toma foto del recibo
2. La IA extrae todo automáticamente
3. Dashboard te muestra dónde optimizar

Sin Excel. Sin escribir nada. Sin excusas.

Prueba gratis 👇
[Link al quiz]
```

**Post 3 - Social Proof/Escasez:**
```
🔥 BETA PRIVADA - Solo 25 lugares

Los primeros beta testers obtienen:
✅ Acceso premium gratuito de por vida
✅ Badge de "Founding Member"
✅ Voz directa en las nuevas features

¿Quieres ser uno?
[Link al quiz]
```

**Mensajes de WhatsApp (ya tienes en ReferralCard, usar como base):**
- Versión casual para amigos
- Versión profesional para contactos de trabajo
- Versión corta para grupos

**Email de invitación (template):**
```
Asunto: 🎁 Invitación exclusiva - Beta privada EvoFinz

Hola [NOMBRE],

Vi que completaste el quiz financiero y tu perfil
es exactamente el tipo de persona que buscamos
para nuestra beta exclusiva.

Como [SITUACIÓN], sé que [OBSTÁCULO] es un desafío real.
EvoFinz te ayuda con exactamente eso.

Te estoy reservando un lugar VIP.

[BOTÓN: Activar mi acceso beta]

Solo hay 25 lugares. Ya van [X] ocupados.

Saludos,
[Tu nombre]
```

#### 1.2 Configuración Previa

**Acciones en /admin/beta-codes:**
1. Crear códigos únicos para los 25 lugares
2. O generar un código "LAUNCH25" con 25 usos máximos

**Acciones en /admin/leads:**
1. Revisar los 12 leads existentes
2. Identificar los de mayor score para contactar primero

---

### FASE 2: Contacto de Leads (3-5 días)

#### 2.1 Priorización de Contacto

Contactar en este orden (desde `/admin/leads`):

| Prioridad | Criterio | Acción |
|-----------|----------|--------|
| 1 | Leads con comentarios personales | WhatsApp primero |
| 2 | Score alto (HOT/WARM) | WhatsApp + Email |
| 3 | Nivel "principiante" | Email con énfasis en ayuda |
| 4 | Resto | Email masivo |

#### 2.2 Flujo de Contacto Manual

```
1. Abrir /admin/leads
2. Click en lead → Ver detalles
3. Click en icono WhatsApp → Mensaje pre-llenado se abre
4. Enviar mensaje personalizado con código beta
5. Marcar como "Contactado" con notas
6. Si responde positivo → Enviar link de registro
7. Si se registra → Marcar como "Convertido"
```

#### 2.3 Frecuencia de Seguimiento

- **Día 1:** Primer contacto (WhatsApp)
- **Día 3:** Si no responde → Email
- **Día 7:** Último intento (WhatsApp corto)

---

### FASE 3: Lanzamiento y Amplificación (Ongoing)

#### 3.1 Canales de Promoción

**Canales inmediatos:**
- WhatsApp personal a contactos de confianza
- LinkedIn (tu red profesional)
- Grupos de Facebook de finanzas personales
- Reddit (r/personalfinance, r/chile, r/PersonalFinanceCanada)

**Cada beta tester tiene herramientas para referir:**
- Sistema de referidos con mensajes pre-escritos
- Código personal generado automáticamente
- +100 puntos beta por cada referido exitoso

#### 3.2 Métricas a Monitorear

Desde `/admin/beta-dashboard`:
- Usuarios activos diarios
- Feedback enviado
- Bugs reportados
- Referidos generados

Desde `/admin/leads`:
- Tasa de respuesta (contactados / total)
- Tasa de conversión (convertidos / contactados)
- Leads HOT sin contactar (urgente)

---

## Checklist de Lanzamiento

### Antes de lanzar:
- [ ] Crear 3-5 posts para redes sociales
- [ ] Preparar email template personalizado
- [ ] Generar códigos beta (25 lugares)
- [ ] Revisar los 12 leads actuales y priorizarlos

### Día del lanzamiento:
- [ ] Publicar primer post en redes
- [ ] Contactar 5 leads de mayor prioridad via WhatsApp
- [ ] Enviar emails a los demás leads

### Primera semana:
- [ ] Seguimiento a leads que no respondieron
- [ ] Monitorear nuevos signups en /admin/beta-dashboard
- [ ] Responder feedback de beta testers
- [ ] Celebrar cada conversión

---

## Sección Técnica

### Sistema actual (funciona sin cambios):

```
Quiz (/) 
    ↓
Lead guardado en `quiz_leads` con scoring automático
    ↓
CRM (/admin/leads) muestra leads priorizados
    ↓
Contacto manual via WhatsApp/Email
    ↓
Registro (/auth) con código beta
    ↓
Usuario obtiene acceso premium + gamificación
    ↓
Sistema de referidos amplifica alcance
```

### Lo que NO necesitas para lanzar:
- GHL (opcional para automatizar después)
- Más desarrollo técnico
- Cambios en la base de datos

### Mejoras opcionales post-lanzamiento:
1. Notificaciones push para leads HOT nuevos
2. Dashboard de analytics de quiz (abandono por paso)
3. A/B testing en mensajes de resultado
4. Automatización de emails con GHL cuando lo actives

---

## Resumen Ejecutivo

**Estás LISTO para lanzar.** Tu sistema está completo:

| Necesidad | Solución actual |
|-----------|-----------------|
| Captar leads | Quiz en página principal |
| Priorizar leads | CRM con scoring automático |
| Contactar leads | Botones de WhatsApp/Email en CRM |
| Registrar usuarios | /auth con códigos beta |
| Retener usuarios | Gamificación + referidos |
| Escalar | Sistema de referidos built-in |

**Próximo paso concreto:** Crear los 3-5 posts de contenido y comenzar a contactar los 12 leads que ya tienes.

