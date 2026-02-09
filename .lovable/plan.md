
# Plan Integral: Mejoras al Onboarding y Uso de Datos en Toda la App

## Diagnóstico Completo

He identificado varios problemas críticos que impiden que los datos del onboarding se usen correctamente en toda la aplicación:

---

## Problema 1: Incompatibilidad de Work Types con la Base de Datos

**Gravedad: CRÍTICA**

El enum `work_type` en la base de datos solo acepta tres valores:
```
employee | contractor | corporation
```

Pero el onboarding conversacional intenta guardar tipos de Chile que **NO EXISTEN** en el enum:
- `persona_natural` → ❌ Error de base de datos
- `empresa_individual` → ❌ Error de base de datos  
- `sociedad` → ❌ Error de base de datos
- `empleado` → ❌ Error de base de datos

### Solución
1. Mapear los tipos de Chile a los valores del enum existente:
   - `empleado` → `employee`
   - `persona_natural` → `contractor`
   - `empresa_individual` → `contractor`
   - `sociedad` → `corporation`

2. Guardar el tipo específico de Chile en un campo separado (ya existe `tax_regime` que podría usarse, o crear lógica de mapeo)

---

## Problema 2: El Onboarding Tradicional No Pregunta País

**Gravedad: ALTA**

El formulario rápido (`Onboarding.tsx`) NO pregunta país - asume Canadá por defecto:
- Lista de provincias hardcodeada (solo Canadá)
- Work types hardcodeados (solo Canadá)
- No crea entidad fiscal primaria

### Solución
1. Agregar paso de selección de país al inicio
2. Hacer la lista de provincias/regiones dinámica según país
3. Mostrar work types según país
4. Crear entidad fiscal primaria al completar

---

## Problema 3: Campo `name_preference` No Se Guarda

**Gravedad: MEDIA**

El onboarding conversacional pregunta `name_preference` (nombre/apodo), pero:
- No existe columna `name_preference` en la tabla `profiles`
- Existe `nickname` pero no se usa
- El campo se pierde y no se guarda

### Solución
1. Guardar en el campo `nickname` existente cuando el usuario elige "apodo"
2. Actualizar `full_name` si elige "nombre"

---

## Problema 4: `display_currency` No Se Configura

**Gravedad: MEDIA**

Al seleccionar país, el sistema debería configurar automáticamente:
- `display_currency` según país (CAD para Canadá, CLP para Chile)
- Actualmente nunca se configura

### Solución
1. Al guardar perfil, establecer `display_currency` basado en el país
2. Usar `countryConfig.currency` para obtener la moneda correcta

---

## Problema 5: Entidad Fiscal con Nombre Hardcodeado

**Gravedad: BAJA**

La entidad fiscal primaria se crea con nombre `"Mi Entidad Principal"` siempre en español, incluso si el usuario usa inglés.

### Solución
1. Usar el idioma del usuario para el nombre de la entidad

---

## Cambios Técnicos Requeridos

### Archivo 1: `src/hooks/utils/useConversationalOnboarding.ts`

**Cambios:**
1. **Mapear work types de Chile a enum de BD**: Crear función `mapWorkTypeToEnum()`
2. **Guardar name_preference correctamente**: Usar `nickname` o `full_name` según respuesta
3. **Configurar display_currency**: Añadir al objeto `profileUpdate`
4. **Nombre de entidad bilingüe**: Usar idioma del usuario

```typescript
// Mapeo de work types por país al enum de BD
const mapWorkTypeToEnum = (workType: string, country: CountryCode): WorkType => {
  if (country === 'CL') {
    const mapping: Record<string, WorkType> = {
      'empleado': 'employee',
      'persona_natural': 'contractor',
      'empresa_individual': 'contractor',
      'sociedad': 'corporation',
    };
    return mapping[workType] || 'contractor';
  }
  // Para Canadá, los valores ya coinciden con el enum
  return workType as WorkType;
};
```

### Archivo 2: `src/pages/Onboarding.tsx`

**Cambios:**
1. **Agregar estado de país**: `const [country, setCountry] = useState<CountryCode>('CA');`
2. **Paso de selección de país**: Nuevo paso antes de provincia
3. **Provincias dinámicas**: Usar `getCountryConfig(country).regions`
4. **Work types dinámicos**: Usar `getCountryConfig(country).workTypes`
5. **Crear entidad fiscal**: Añadir lógica en `saveProfileData()`
6. **Configurar display_currency**: Añadir al update de perfil

### Archivo 3: `src/lib/constants/country-tax-config.ts`

**Cambios (menor):**
1. Agregar propiedad `enumValue` a cada workType para mapeo explícito

---

## Flujo Corregido del Onboarding Conversacional

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASO 1: Nombre                               │
│ "¿Cómo te llamo?" → Guarda en nickname o full_name              │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 2: País                                 │
│ "¿Dónde pagas impuestos?" → profiles.country                    │
│                           → profiles.display_currency (auto)    │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 3: Provincia/Región                     │
│ Dinámico según país → profiles.province                         │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 4: Tipo de Trabajo                      │
│ Opciones según país → profiles.work_types (mapeado a enum)      │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 5: Situación Personal                   │
│ → user_life_profile.relationship_status                         │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 6: Metas Financieras                    │
│ → user_financial_profile.passions                               │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 7: Nivel de Experiencia                 │
│ → user_financial_profile.financial_education_level              │
├─────────────────────────────────────────────────────────────────┤
│                    AL COMPLETAR:                                │
│ ✓ profiles (country, province, work_types, display_currency)   │
│ ✓ fiscal_entities (entidad primaria con país y moneda)         │
│ ✓ user_life_profile                                             │
│ ✓ user_financial_profile                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo Corregido del Onboarding Tradicional

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASO 1: País + Provincia                     │
│ Selector de país → Lista de provincias dinámica                 │
│ Checkboxes de work type según país                              │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 2: Clientes                             │
│ ¿Tienes clientes? → Lista de clientes                           │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 3: Revisión                             │
│ Mostrar país, provincia, work types seleccionados               │
├─────────────────────────────────────────────────────────────────┤
│                    PASO 4: Sample Data                          │
│ ¿Quieres datos de ejemplo?                                      │
├─────────────────────────────────────────────────────────────────┤
│                    AL COMPLETAR:                                │
│ ✓ profiles (country, province, work_types, display_currency)   │
│ ✓ fiscal_entities (entidad primaria)                            │
│ ✓ clients (si aplica)                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/utils/useConversationalOnboarding.ts` | Mapeo de work types, guardar nickname, display_currency, nombre bilingüe de entidad |
| `src/pages/Onboarding.tsx` | Agregar selector de país, provincias dinámicas, work types dinámicos, crear entidad fiscal |
| `src/lib/constants/country-tax-config.ts` | Agregar `enumValue` a workTypes para mapeo explícito |

---

## Resultado Esperado

Después de implementar estos cambios:

1. **Onboarding Conversacional y Tradicional** preguntan país primero
2. **Work types** se mapean correctamente al enum de la BD
3. **Entidad fiscal primaria** se crea siempre con país, provincia y moneda
4. **display_currency** se configura automáticamente según país
5. **Nombre de usuario** se guarda correctamente (nickname o full_name)
6. **EntityContext y useCountryContext** funcionan con datos reales desde el primer momento
7. **Toda la app** (Tax Calendar, Business Profile, etc.) usa los datos correctos del onboarding
