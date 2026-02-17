
# Pagina Dedicada de Politica de Privacidad

## Situacion Actual

Ya existe una seccion breve de "Privacidad y Datos" dentro de `/legal#privacy`, pero es muy general. No explica en detalle:
- Que tablas/datos especificos se guardan
- Que el administrador NO puede ver datos financieros
- Como funciona el aislamiento de datos (RLS)
- Que pasa con los datos enviados a proveedores de IA
- Derechos especificos del usuario (PIPEDA, GDPR)

## Lo Que Se Hara

Crear una nueva pagina `/privacy` con contenido completo, bilingue (ES/EN), organizada en secciones claras.

### Estructura de la Pagina

1. **Resumen Simple** - "Tus datos son tuyos" en lenguaje accesible
2. **Datos que recopilamos** - Lista detallada organizada por categoria:
   - Datos de cuenta (email, nombre, preferencias)
   - Datos financieros (gastos, ingresos, clientes, contratos, kilometraje)
   - Documentos subidos (recibos, facturas via OCR)
   - Datos de uso (funciones usadas, paginas visitadas, feedback beta)
3. **Quien puede ver tus datos** - La seccion mas importante:
   - Tu: Solo tu ves tus datos financieros
   - Otros usuarios: No pueden ver nada tuyo (aislamiento total)
   - El administrador: Solo puede ver datos operativos (feedback, bugs, uso de funciones). NO puede ver gastos, ingresos, clientes ni ningun dato financiero
   - Proveedores de IA: Reciben datos temporalmente para procesamiento (OCR, asistente)
   - Terceros: No vendemos ni compartimos datos personales
4. **Como protegemos tus datos** - Explicacion tecnica accesible:
   - Encriptacion en transito y reposo
   - Aislamiento por usuario (cada cuenta solo accede a sus propios datos)
   - Autenticacion requerida para todo acceso
   - Sin acceso anonimo a datos personales
5. **Cookies y almacenamiento local** - Que se guarda en el navegador
6. **Tus derechos** - Acceso, exportacion, eliminacion, portabilidad
7. **Procesamiento por IA** - Que datos se envian, para que, y que pasa despues
8. **Retencion de datos** - Cuanto tiempo se guardan y que pasa al eliminar cuenta
9. **Contacto** - Como comunicarse para preguntas de privacidad
10. **Actualizaciones** - Como se notifican cambios a esta politica

### Archivos a Modificar

**Archivo nuevo:** `src/pages/Privacy.tsx`
- Pagina completa bilingue con todas las secciones
- Mismo estilo visual que Legal.tsx (Cards, iconos, badges)
- Navegacion de vuelta a la app

**Archivo modificado:** `src/App.tsx`
- Agregar ruta `/privacy` (publica, no requiere autenticacion)
- Importar componente lazy

**Archivos modificados (links):**
- `src/pages/Legal.tsx` - Agregar link a la pagina de privacidad desde la seccion existente
- `src/pages/Auth.tsx` - Actualizar link de "Politica de Privacidad" para apuntar a `/privacy`
- `src/components/CookieConsent.tsx` - Actualizar link de privacidad
- `src/components/Layout.tsx` - Actualizar link del footer
- `src/pages/Landing.tsx` - Actualizar link del footer

### Detalles Tecnicos

- La pagina sera publica (sin ProtectedRoute) ya que cualquier visitante debe poder leerla antes de registrarse
- Se usara el mismo patron de lazy loading con `lazyWithRetry`
- Contenido completamente bilingue usando `useLanguage()`
- Scroll automatico a secciones via hash (`#cookies`, `#rights`, etc.)
- Link de retorno al dashboard o landing segun estado de autenticacion
