

## Plan: Sistema de Testimonios + Correccion de Triggers + Guia de Lanzamiento

### Diagnostico Confirmado

1. **Triggers AUSENTES**: La base de datos tiene las 6 funciones necesarias pero CERO triggers activos. Los puntos NO se estan otorgando automaticamente.
2. **Sin sistema de testimonios**: No hay columnas ni UI para consentimiento de uso de feedback como testimonio.

---

### Cambios a Implementar

#### 1. Migracion SQL (una sola migracion que hace todo)

**Agregar columnas de testimonios a `beta_feedback`:**
- `allow_as_testimonial` (boolean, default false) - consentimiento del usuario
- `display_name_override` (text, nullable) - nombre personalizado para mostrar
- `is_published_testimonial` (boolean, default false) - admin lo publica
- `testimonial_approved_by` (uuid, nullable) - quien lo aprobo
- `testimonial_approved_at` (timestamptz, nullable) - cuando

**Nuevas RLS policies:**
- Admins pueden actualizar feedback (para publicar testimonios)
- Cualquiera puede leer testimonios publicados (para la landing)

**Recrear los 6 triggers faltantes** (uno por accion):
- `award_feedback_points_trigger` en `beta_feedback`
- `award_bug_report_points_trigger` en `beta_bug_reports`
- `init_beta_points_on_activation` en `profiles`
- `generate_referral_on_beta_activation` en `profiles`
- `check_beta_expiration_trigger` en `profiles`
- `convert_referral_lead_on_profile` en `profiles`

**Eliminar funciones huerfanas** que ya no se usan.

#### 2. Actualizar `src/hooks/data/useBetaFeedback.ts`

- Agregar `allow_as_testimonial` y `display_name_override` a `BetaFeedback` interface y `CreateFeedbackParams`
- Agregar query `publishedTestimonials` para la landing page (filtra `is_published_testimonial = true`)
- Agregar mutation `toggleTestimonialPublish` para que el admin publique/despublique

#### 3. Actualizar `src/pages/BetaFeedback.tsx`

Despues de la seccion "Would recommend" (linea ~613), agregar:
- Checkbox de consentimiento (solo visible cuando rating >= 4): "Autorizo que mi opinion pueda ser usada como testimonio en la pagina de EvoFinz"
- Campo opcional de nombre para mostrar (display_name_override)
- Pasar los nuevos campos al mutation `submitFeedback`

#### 4. Actualizar `src/pages/admin/BetaDashboard.tsx`

Agregar nueva tab "Testimonios" (6ta tab) que muestra:
- Lista de feedback con `allow_as_testimonial = true`
- Rating, comentario, nombre del usuario
- Boton "Publicar" / "Despublicar" por testimonio
- Badge indicando estado actual

#### 5. Actualizar `src/components/landing/TestimonialsCarousel.tsx`

- Importar `supabase` y `useQuery`
- Fetch de testimonios reales aprobados (`is_published_testimonial = true`)
- Si hay 3+ reales, usar solo esos; si no, mezclar con hardcoded
- Agregar badge "Beta Tester Verificado" en testimonios reales

---

### Seccion Tecnica: Estructura de Datos

```text
beta_feedback (columnas nuevas)
+---------------------------+----------+---------+
| Columna                   | Tipo     | Default |
+---------------------------+----------+---------+
| allow_as_testimonial      | boolean  | false   |
| display_name_override     | text     | null    |
| is_published_testimonial  | boolean  | false   |
| testimonial_approved_by   | uuid     | null    |
| testimonial_approved_at   | timestamptz | null |
+---------------------------+----------+---------+
```

### Flujo Completo

```text
1. Beta tester da feedback 4-5 estrellas
2. Ve checkbox: "Autorizo como testimonio"
3. Opcionalmente elige como aparecer su nombre
4. Admin ve en tab "Testimonios" los feedback con consentimiento
5. Admin click "Publicar" -> aparece en landing page
6. Visitantes ven testimonios REALES con badge verificado
```

### Resultado Final

- Triggers corregidos: puntos se otorgan correctamente (una sola vez)
- Sistema de testimonios con consentimiento legal (opt-in, GDPR/PIPEDA compliant)
- Admin tiene control total de que se publica
- Landing page muestra testimonios reales gradualmente
- 6 tabs en BetaDashboard: Testers, Feedback, Bugs, Premios, Testimonios, Uso

