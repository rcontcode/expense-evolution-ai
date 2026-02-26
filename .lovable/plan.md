

## Diagnóstico correcto

Tienes toda la razón. Corregir el nombre directamente en la base de datos es un parche para ti, no una solución real. **Cualquier usuario** podría terminar con un nombre incorrecto (por OAuth, por un error al registrarse, o como en tu caso, por una herramienta externa que modificó el perfil).

La solución correcta es: **agregar un campo editable de nombre en Settings**, disponible para todos los usuarios.

---

## Plan: Tarjeta "Mi Perfil" en Settings

### Cambio 1 — Nuevo componente `ProfileCard.tsx`

Crear `src/components/settings/ProfileCard.tsx` con:

- Campo de texto para **Nombre completo** (`full_name`), pre-poblado desde `useProfile()`
- Campo de **Email** (solo lectura, informativo)
- Botón "Guardar" que usa el hook existente `useUpdateProfile()` para persistir el cambio
- Feedback con toast de éxito/error
- Textos bilingues (es/en)

### Cambio 2 — Integrar en Settings.tsx

En la pestaña **"Datos"** (`TabsContent value="data"`), agregar `<ProfileCard />` como **primera tarjeta**, antes de `SecurityCard`. Esto agrupa lógicamente: Perfil + Contraseña + Privacidad de datos.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/settings/ProfileCard.tsx` | **Nuevo** — Formulario editable de nombre |
| `src/pages/Settings.tsx` | Importar y renderizar `ProfileCard` en tab "Datos" |

### Sin cambios en base de datos

El campo `full_name` ya existe en la tabla `profiles` y el hook `useUpdateProfile()` ya soporta actualizarlo. No se necesitan migraciones.

