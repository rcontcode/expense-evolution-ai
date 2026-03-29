

# Corregir Disponibilidad Global: 80+ Países, No 30

## El error
Dije "30+ países" pero los números reales son:
- **Español**: idioma oficial en **21 países** + hablado significativamente en USA (~41M), Brasil, etc.
- **Inglés**: idioma oficial o co-oficial en **67+ países** (USA, UK, India, Nigeria, Australia, South Africa, Philippines, etc.)
- **Total real**: **80+ países** donde la app es útil en su idioma nativo

La distinción clave: la app completa funciona en **80+ países** hispanohablantes y angloparlantes. Solo los **módulos fiscales** son específicos de Canadá y Chile.

## Cambios

### 1. `src/components/landing/AnimatedStats.tsx` (línea 18)
- `"2" / "Países soportados"` → `"80+"` / `"Países disponibles" / "Countries available"`

### 2. `src/components/landing/GuaranteesSection.tsx` (líneas 68-72)
- Trust indicator: `"🇨🇦 🇨🇱" / "Países Soportados"` → `"80+"` / `"Países Disponibles"` con sublabel: `"Impuestos: 🇨🇦🇨🇱 · Más pronto" / "Tax: 🇨🇦🇨🇱 · More soon"`

### 3. `src/components/landing/FAQSection.tsx` (líneas 377-378 y 414-415)
- Reescribir respuesta ES: "EvoFinz está disponible para usuarios en **80+ países** de habla hispana e inglesa. Todas las herramientas de finanzas personales, mentoría, presupuestos, FIRE y patrimonio neto funcionan sin importar tu ubicación. Los **módulos fiscales especializados** (deducciones, calendarios, formularios) están actualmente disponibles para Canadá (CRA) y Chile (SII), con más jurisdicciones próximamente (México, España, Colombia)."
- Misma lógica en EN

### 4. `src/components/landing/TargetAudienceSection.tsx`
- Agregar badge bajo el header: `"Disponible en 20+ países hispanohablantes y 60+ angloparlantes" / "Available in 20+ Spanish-speaking and 60+ English-speaking countries"`

### 5. `src/data/user-guide-content.ts` (líneas 37-39 y 44-50)
- En `whatIs.desc`: agregar mención de disponibilidad global (80+ países)
- En `forWhom.items`: agregar item `"🌎 Usuarios en 20+ países hispanohablantes y 60+ angloparlantes (impuestos: 🇨🇦🇨🇱)"`

## Archivos a modificar
1. `src/components/landing/AnimatedStats.tsx`
2. `src/components/landing/GuaranteesSection.tsx`
3. `src/components/landing/FAQSection.tsx`
4. `src/components/landing/TargetAudienceSection.tsx`
5. `src/data/user-guide-content.ts`

