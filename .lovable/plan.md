

# Plan: Corregir Onboarding Conversacional - Preguntas Faltantes Críticas

## 🚨 Problema Identificado

El onboarding conversacional NO pregunta datos **fiscales críticos** que son esenciales para el funcionamiento de la aplicación:

| Dato Faltante | Por Qué Es Crítico | Estado Actual |
|---------------|---------------------|---------------|
| **País** (CA/CL) | Determina leyes fiscales, moneda, formularios | ❌ No se pregunta |
| **Provincia/Región** | Tasas de impuestos provinciales | ❌ Salta a esto sin país |
| **Tipo de trabajo fiscal** | Define qué deducciones aplican | ❌ Pregunta genérica, no fiscal |
| **Entidad fiscal primaria** | Requerido por gastos/ingresos | ❌ Nunca se crea |

## 📋 Flujo Actual vs Flujo Correcto

### ❌ Flujo Actual (Problemático)
```
1. ¿Cómo te llamo? (nombre)
2. ¿Situación personal? (single/partnered/family)  ← SALTA A ESTO
3. ¿Cómo generas dinero? (empleado/freelance)      ← Muy genérico
4. ¿Metas financieras?
5. ¿Experiencia con finanzas?
```

### ✅ Flujo Corregido (Propuesto)
```
1. ¿Cómo te llamo? (nombre)
2. ¿Dónde pagas tus impuestos? (🇨🇦 Canadá / 🇨🇱 Chile)     ← NUEVO
3. ¿En qué provincia/región? (dinámico según país)          ← NUEVO
4. ¿Cuál es tu situación laboral? (opciones fiscales según país) ← MEJORADO
5. ¿Situación personal? (single/partnered/family)
6. ¿Metas financieras?
7. ¿Experiencia con finanzas?
```

## 🔧 Cambios Técnicos Requeridos

### 1. Agregar Nuevas Preguntas Esenciales

**Pregunta 2: País** (después del nombre)
```typescript
{
  id: 'country',
  question: { es: '¿Dónde pagas tus impuestos?', en: 'Where do you pay your taxes?' },
  phoenixIntro: { 
    es: '¡Perfecto! 🌎 Ahora, algo SÚPER importante. Para darte consejos fiscales precisos, necesito saber:',
    en: "Perfect! 🌎 Now, something SUPER important. To give you accurate tax advice, I need to know:"
  },
  options: [
    { id: 'CA', label: { es: 'Canadá', en: 'Canada' }, value: 'CA', icon: '🇨🇦' },
    { id: 'CL', label: { es: 'Chile', en: 'Chile' }, value: 'CL', icon: '🇨🇱' },
  ],
  field: 'country',
  table: 'profile',
  stage: 'essential',
}
```

**Pregunta 3: Provincia/Región** (dinámica según país)
```typescript
{
  id: 'province',
  question: { 
    es: '¿En qué provincia o región vives?', 
    en: 'Which province or region do you live in?' 
  },
  phoenixIntro: { 
    es: '¡Excelente! 📍 Las tasas de impuestos varían según tu ubicación. Esto me ayuda a calcular todo correctamente:',
    en: "Excellent! 📍 Tax rates vary by location. This helps me calculate everything correctly:"
  },
  options: [], // Se cargarán dinámicamente según el país
  field: 'province',
  table: 'profile',
  stage: 'essential',
  dynamicOptions: true, // Nueva bandera para indicar opciones dinámicas
}
```

**Pregunta 4: Tipo de Trabajo Fiscal** (opciones según país)
```typescript
{
  id: 'work_type',
  question: { es: '¿Cuál es tu situación laboral principal?', en: 'What is your main work situation?' },
  phoenixIntro: { 
    es: '💼 Esto es CLAVE para optimizar tus impuestos. Cada tipo de trabajo tiene diferentes deducciones:',
    en: "💼 This is KEY to optimizing your taxes. Each work type has different deductions:"
  },
  // CANADÁ:
  options_CA: [
    { id: 'employee', label: { es: 'Empleado (T4)', en: 'Employee (T4)' }, value: 'employee', icon: '💼' },
    { id: 'sole_proprietor', label: { es: 'Sole Proprietor', en: 'Sole Proprietor' }, value: 'sole_proprietor', icon: '🚀' },
    { id: 'contractor', label: { es: 'Contratista', en: 'Contractor' }, value: 'contractor', icon: '📝' },
    { id: 'corporation', label: { es: 'Corporation', en: 'Corporation' }, value: 'corporation', icon: '🏢' },
  ],
  // CHILE:
  options_CL: [
    { id: 'empleado', label: { es: 'Empleado (contrato)', en: 'Employee (contract)' }, value: 'empleado', icon: '💼' },
    { id: 'persona_natural', label: { es: 'Persona Natural (boletas)', en: 'Individual (invoices)' }, value: 'persona_natural', icon: '📝' },
    { id: 'empresa_individual', label: { es: 'EIRL', en: 'EIRL' }, value: 'empresa_individual', icon: '🏢' },
    { id: 'sociedad', label: { es: 'SpA / Ltda.', en: 'SpA / LLC' }, value: 'sociedad', icon: '🏛️' },
  ],
  field: 'work_types',
  table: 'profile',
  allowMultiple: true, // Pueden tener empleo + freelance
  stage: 'essential',
}
```

### 2. Actualizar Lógica de Guardado

En `saveProfile()`, agregar:

```typescript
// Crear entidad fiscal primaria con los datos del onboarding
const country = responses.country as string;
const province = responses.province as string;

if (country && province) {
  const countryConfig = getCountryConfig(country as CountryCode);
  
  await supabase.from('fiscal_entities').upsert({
    user_id: user.id,
    name: lang === 'es' ? 'Mi Entidad Principal' : 'My Primary Entity',
    country: country,
    province: province,
    entity_type: 'personal',
    is_primary: true,
    is_active: true,
    default_currency: countryConfig.currency,
  }, { onConflict: 'user_id,is_primary' }); // Evita duplicados
}

// Guardar work_types en profiles
if (responses.work_types) {
  await supabase.from('profiles').update({
    country: country,
    province: province,
    work_types: Array.isArray(responses.work_types) ? responses.work_types : [responses.work_types],
  }).eq('id', user.id);
}
```

### 3. Manejar Preguntas Dinámicas

Modificar el hook para soportar opciones dinámicas:

```typescript
// Obtener opciones actuales según el país seleccionado
const getOptionsForQuestion = useCallback((question: OnboardingQuestion) => {
  if (question.id === 'province') {
    const country = state.responses.country as CountryCode;
    if (!country) return [];
    const config = getCountryConfig(country);
    return config.regions.map(r => ({
      id: r.code,
      label: { es: r.name, en: r.name },
      value: r.code,
      icon: country === 'CA' ? '🍁' : '🌄',
    }));
  }
  
  if (question.id === 'work_type') {
    const country = state.responses.country as CountryCode;
    if (!country) return [];
    const config = getCountryConfig(country);
    return config.workTypes.map(w => ({
      id: w.value,
      label: w.label,
      description: w.description,
      value: w.value,
      icon: w.value.includes('employ') ? '💼' : '🚀',
    }));
  }
  
  return question.options;
}, [state.responses]);
```

---

## 📁 Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/utils/useConversationalOnboarding.ts` | Agregar preguntas de país, provincia, work_types. Actualizar `saveProfile()` para crear `fiscal_entity` |
| `src/components/onboarding/ConversationalOnboarding.tsx` | Usar `getOptionsForQuestion()` para manejar opciones dinámicas |

---

## 🎯 Resultado Esperado

Después de completar el onboarding, el usuario tendrá:

1. ✅ **País y provincia** guardados en `profiles`
2. ✅ **Work types** fiscales guardados en `profiles.work_types`
3. ✅ **Entidad fiscal primaria** creada en `fiscal_entities` con país, provincia y moneda
4. ✅ **Contexto completo** para que Phoenix dé consejos fiscales personalizados
5. ✅ **Sistema listo** para mostrar formularios correctos (CRA vs SII)

