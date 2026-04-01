

# Estrategia: Qué compartir con los beta testers

## Situación actual

| Recurso | URL | ¿Público? | ¿Útil para el tester? |
|---------|-----|-----------|----------------------|
| Landing | `/landing` | Si | Muestra qué hace la app, demos interactivos |
| Quiz | `/quiz` | Si | Engancha, personaliza la experiencia |
| About | `/about` | Si | Contexto sobre el proyecto |
| Beta Guide | `/beta-guide` | No (login) | Explica el programa beta completo |
| User Guide | `/user-guide` | No (login) | Manual de uso de la app |
| Beta Features | `/beta-features` | No (login) | Tour visual de funciones Pro |

## Recomendación: Flujo en 2 momentos

### Momento 1: ANTES de registrarse (en el mensaje de invitación)

Incluir en las plantillas de WhatsApp/Email:
- **Link principal**: `https://evofinz.com/auth?beta=CODE` (registro directo)
- **Link al landing**: `https://evofinz.com/landing` — "Si quieres ver qué hace la app antes de registrarte"
- **Link al quiz**: `https://evofinz.com/quiz` — "Haz el quiz financiero para ver tu perfil"

Estos 3 links son públicos y dan contexto suficiente sin requerir cuenta.

### Momento 2: DESPUÉS de registrarse (automático dentro de la app)

Ya existe el flujo automático:
1. Se registran → `BetaWelcome` (confetti + bienvenida)
2. → `BetaFeatures` (tour de funciones Pro)
3. → Dashboard con acceso a `Beta Guide` y `User Guide` en el menú

No necesitas enviar esos links — la app ya los guía.

## Cambio propuesto

**Actualizar las plantillas de invitación** en `BetaInviteTab.tsx` para incluir los 3 links públicos de forma natural:

```
👉 Regístrate aquí: https://evofinz.com/auth?beta={CODE}
🔑 Tu código: {CODE}

🔍 ¿Quieres ver más antes de registrarte?
• Mira qué hace la app: https://evofinz.com/landing
• Haz tu diagnóstico financiero: https://evofinz.com/quiz
```

Agregar esto a las 4 plantillas (WhatsApp ES/EN, Email ES/EN).

## Archivo a modificar

1. **`src/components/admin/BetaInviteTab.tsx`** — Agregar links al landing y quiz en las 4 plantillas de mensaje

