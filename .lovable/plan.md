

# Auditoria Profesional: Lo Que Falta en EvoFinz

## 1. Cambiar Contrasena (Critico)

No existe forma de cambiar la contrasena una vez logueado. Solo hay "Forgot Password" que envia email. Un usuario deberia poder cambiar su contrasena desde Settings sin tener que cerrar sesion.

**Cambio:** Agregar seccion "Cambiar Contrasena" en `src/components/settings/DataPrivacyCard.tsx` (o nuevo componente `SecurityCard.tsx`) con campos para contrasena actual y nueva, usando `supabase.auth.updateUser({ password })`.

---

## 2. URL Canonica Incorrecta (SEO / Branding)

En `index.html` linea 41:
```
<link rel="canonical" href="https://expense-evolution-ai.lovable.app/" />
```
Deberia ser `https://evofinz.com/` cuando conectes tu dominio. Tambien las URLs en JSON-LD (lineas 74, 79, 88-89) siguen usando `expense-evolution-ai.lovable.app`.

**Cambio:** Actualizar `index.html` reemplazando todas las URLs de `expense-evolution-ai.lovable.app` por `evofinz.com`.

---

## 3. Pagina de Terminos de Servicio Dedicada (/terms)

Actualmente los terminos estan embebidos dentro de /legal como una seccion mas. Para una app profesional, especialmente manejando datos financieros, necesitas una pagina dedicada `/terms` que sea enlazable individualmente y que cubra:
- Condiciones de uso del servicio
- Politica de suscripciones y pagos
- Politica de reembolsos
- Propiedad intelectual
- Terminacion de cuenta

**Cambio:** Crear `src/pages/Terms.tsx` con contenido legal completo, bilingue. Agregar ruta `/terms` en App.tsx. Actualizar checkbox de Auth para enlazar a `/terms` separado de `/privacy`.

---

## 4. Pagina de Estado / Status Page

No existe forma para los usuarios de saber si la app esta funcionando correctamente o en mantenimiento. Una status page basica da confianza profesional.

**Cambio:** Crear una pagina simple `/status` que muestre el estado de la app (puede ser estatica por ahora con un indicador de "Operativo" y fecha de ultima verificacion).

---

## 5. "Acerca de" o "Sobre Nosotros"

No existe pagina que explique quien esta detras de EvoFinz. Para confianza y transparencia, especialmente en finanzas, los usuarios quieren saber quien creo la app.

**Cambio:** Crear `/about` con informacion del equipo/fundador, mision de EvoFinz, y enlaces a redes sociales.

---

## 6. Sesion por Inactividad (Seguridad)

No existe timeout de sesion por inactividad. En una app financiera, si un usuario deja la sesion abierta en un computador compartido, sus datos quedan expuestos indefinidamente.

**Cambio:** Implementar un hook `useSessionTimeout` que detecte inactividad (sin clicks/teclas por 30 minutos) y cierre la sesion automaticamente con un aviso previo de 60 segundos para extender.

---

## Resumen de Archivos

| # | Que | Archivo | Tipo |
|---|---|---|---|
| 1 | Cambiar contrasena | `src/components/settings/SecurityCard.tsx` (nuevo) + Settings.tsx | Nuevo + Editar |
| 2 | URLs canonicas | `index.html` | Editar |
| 3 | Pagina Terminos | `src/pages/Terms.tsx` (nuevo) + App.tsx + Auth.tsx | Nuevo + Editar |
| 4 | Status page | `src/pages/Status.tsx` (nuevo) + App.tsx | Nuevo + Editar |
| 5 | About page | `src/pages/About.tsx` (nuevo) + App.tsx + Landing.tsx footer | Nuevo + Editar |
| 6 | Session timeout | `src/hooks/useSessionTimeout.ts` (nuevo) + App.tsx | Nuevo + Editar |

## Prioridad Recomendada

1. Cambiar contrasena (seguridad basica)
2. URLs canonicas (SEO, toma 2 minutos)
3. Terminos de Servicio (legal obligatorio)
4. Session timeout (seguridad financiera)
5. About page (confianza)
6. Status page (profesionalismo)

Total: 5 archivos nuevos, 5 archivos editados. Sin migraciones de base de datos necesarias.
