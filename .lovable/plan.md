

# Plan: Agregar logo EvoFinz y mejorar diseño profesional de todos los emails

## Problema
Los 8 emails actuales (6 de autenticación + 1 CRM + infraestructura) no tienen logo ni header visual. Son solo texto plano con estilos básicos.

## Solución
Agregar un header profesional con el logo del fénix de EvoFinz a todas las plantillas de email, más mejoras de diseño (separadores, mejor estructura visual).

## Reto: Logo en emails
Los clientes de email no pueden cargar imágenes locales. Necesitamos subir el logo (`phoenix-clean-logo.png` o `evofinz-phoenix-transparent.png`) a un bucket público de almacenamiento en la nube para obtener una URL pública accesible desde cualquier cliente de email.

## Archivos a modificar (8 plantillas)

### Plantillas de autenticación (6):
1. `supabase/functions/_shared/email-templates/signup.tsx`
2. `supabase/functions/_shared/email-templates/recovery.tsx`
3. `supabase/functions/_shared/email-templates/invite.tsx`
4. `supabase/functions/_shared/email-templates/magic-link.tsx`
5. `supabase/functions/_shared/email-templates/email-change.tsx`
6. `supabase/functions/_shared/email-templates/reauthentication.tsx`

### Plantillas transaccionales (1):
7. `supabase/functions/_shared/transactional-email-templates/crm-lead-outreach.tsx`

## Cambios de diseño en cada plantilla

- **Header con logo**: Agregar componente `Img` con el logo del fénix centrado (60x60px) + texto "EvoFinz" debajo
- **Contenedor con borde**: Card visual con borde sutil `#e5e7eb` y border-radius
- **Separador**: `Hr` entre contenido y footer
- **Footer mejorado**: "EvoFinz — Tu evolución financiera" + año actual
- **Colores consistentes**: Azul `#2563eb` para botones/acentos, `#1a2332` para títulos

## Pasos de implementación

1. **Subir logo al almacenamiento** — Crear bucket público `email-assets` y subir `phoenix-clean-logo.png`
2. **Actualizar las 7 plantillas** — Agregar header con logo, mejorar estructura visual, unificar footer
3. **Redesplegar Edge Functions** — `auth-email-hook` y `send-transactional-email`

## Detalle técnico

Estructura visual de cada email:
```text
┌──────────────────────────────┐
│       [Logo Fénix 60px]      │
│          EvoFinz             │
│                              │
│  ┌────────────────────────┐  │
│  │  Título                │  │
│  │  Contenido / CTA       │  │
│  │  ─────────────────     │  │
│  │  Footer discreto       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

Se usará el componente `Img` de `@react-email/components` con la URL pública del logo almacenado en la nube.

