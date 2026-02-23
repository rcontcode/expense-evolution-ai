
# Plan: Honestidad Pre-Lanzamiento - 3 Correcciones Criticas

## Datos Reales en la Base de Datos
- **2 usuarios** registrados
- **1 pais** (solo Canada)
- **0 testimonios publicados**
- **1 feedback** con rating 5.0

Estos numeros confirman que toda la "social proof" actual es inventada.

---

## Cambio 1: Reemplazar Testimonios Falsos con Seccion de Capacidades Reales

**Archivo:** `src/components/landing/TestimonialsCarousel.tsx`

Eliminar completamente los 9 perfiles ficticios con fotos de stock y reemplazar el componente con una seccion "Casos de Uso Reales" que muestra escenarios verificables de la app (no personas inventadas):

- **Freelancer en Canada**: "Genera tu T2125 automaticamente con categorizacion inteligente"
- **Consultor Multi-Cliente**: "Gestiona gastos por proyecto con reportes individuales por cliente"
- **Emprendedor en Chile**: "Controla tu IVA y deducciones con reglas fiscales chilenas integradas"
- **Profesional Independiente**: "Escanea recibos con OCR y categoriza gastos en segundos"

Cada card tendra: icono relevante, titulo del caso de uso, descripcion de la capacidad real, y un badge con la funcionalidad clave. Sin fotos de personas, sin nombres falsos.

Cuando existan 3+ testimonios reales publicados (de `beta_feedback` con `is_published_testimonial = true`), el componente automaticamente los mostrara en lugar de los casos de uso. La infraestructura de testimonios reales ya existe y seguira funcionando.

---

## Cambio 2: Reemplazar Estadisticas Infladas con Metricas del Producto

**Archivo:** `src/components/landing/AnimatedStats.tsx`

Eliminar los 3 sets de stats falsos ("10,000+ recibos", "847+ libros", "234+ transiciones E->S", "1.2M patrimonio total") y reemplazar con un solo set de **metricas verificables del producto**:

| Actual (falso) | Nuevo (real) |
|---|---|
| 10,000+ Recibos procesados | 30+ Categorias fiscales |
| 847+ Libros trackeados | 2 Paises soportados (CA/CL) |
| 234+ E->S transiciones | 8+ Modulos de mentoria |
| 500+ Usuarios activos | 100% Datos encriptados |
| 15K XP ganados | 5+ Tipos de reporte |
| 1.2M Patrimonio | 3 seg Procesamiento OCR |

Un solo set estatico, sin auto-rotacion entre sets falsos. Las metricas describen capacidades del producto, no uso ficticio.

**Archivo:** `src/components/landing/GuaranteesSection.tsx`

Cambiar los trust indicators falsos:
- "500+ Usuarios Activos" -> "Canada & Chile" (Paises soportados)
- "50K+ Documentos Procesados" -> "30+ Categorias" (Categorias fiscales)
- "4.8/5 Satisfaccion" -> eliminar o cambiar a "Acceso por Invitacion"

**Archivo:** `src/components/landing/LiveSocialProof.tsx`

Eliminar los `MIN_STATS` artificiales (50 usuarios, 5 paises, 10 signups semanales) y el `FALLBACK_STATS` inflado. Mostrar datos reales sin piso artificial. Si hay menos de 5 usuarios reales, ocultar el componente completamente en lugar de mostrar numeros falsos.

---

## Cambio 3: Limpiar Beta Publica y Corregir Validacion

**Archivo:** `src/pages/Landing.tsx`

3 sub-cambios:

a) **Renombrar el boton "Have a beta code?"** a algo como "Have an invitation code?" / "Tienes un codigo de invitacion?" — eliminar la palabra "beta" del texto publico.

b) **Cambiar `validate_beta_invitation_code` a `validate_any_beta_code`** — actualmente la Landing usa una funcion que solo valida codigos de admin, mientras Auth.tsx usa `validate_any_beta_code` que tambien acepta codigos de referidos. Esto causa que codigos de referidos fallen en la Landing pero funcionen en Auth.

c) **Actualizar textos de confirmacion**: "Acceso beta desbloqueado" -> "Acceso desbloqueado" / "Activar Acceso Beta" -> "Activar Acceso Exclusivo"

**Archivo:** `src/components/settings/SubscriptionManager.tsx`

Agregar entrada `pro_beta` al `planConfig` para evitar crash cuando un usuario con ese plan abre Settings:

```
pro_beta: {
  name: 'Pro (Early Access)',
  price: '$0',
  icon: Crown,
  color: 'from-emerald-500 to-teal-600',
  features: [
    'Todo de Pro con limites especiales',
    '20 escaneos OCR/mes',
    'Asistente de voz (15 min/mes)',
    ...
  ],
}
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `TestimonialsCarousel.tsx` | Reemplazar perfiles falsos con casos de uso reales |
| `AnimatedStats.tsx` | Reemplazar stats inventados con metricas del producto |
| `GuaranteesSection.tsx` | Corregir trust indicators inflados |
| `LiveSocialProof.tsx` | Eliminar pisos artificiales, ocultar si <5 usuarios |
| `Landing.tsx` | Renombrar "beta" a "invitacion", fix validacion RPC |
| `SubscriptionManager.tsx` | Agregar config para plan `pro_beta` |
