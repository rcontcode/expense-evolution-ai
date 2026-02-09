
# Plan de Mejoras Adicionales al Onboarding

## Problemas Identificados

### 1. Falta Validación en el Formulario Tradicional
**Gravedad: ALTA**

El botón "Siguiente" en Step 1 del onboarding tradicional NO valida que:
- ❌ Se haya seleccionado una provincia
- ❌ Se haya seleccionado al menos un tipo de trabajo

El usuario puede avanzar dejando campos críticos vacíos, lo que causará datos incompletos en la BD.

```typescript
// Actualmente (línea 570-574):
{step < 3 ? (
  <Button onClick={() => setStep(step + 1)} className="ml-auto">
    {t('onboarding.next')}  // ← SIN VALIDACIÓN
  </Button>
```

### 2. Falta Validación en el Onboarding Conversacional
**Gravedad: MEDIA**

Las preguntas dinámicas (province, work_type) no validan si el país fue seleccionado antes. Si por algún bug el país está vacío, las opciones quedan vacías y el usuario se queda atrapado.

### 3. No Hay Feedback Visual de Campos Requeridos
**Gravedad: MEDIA**

El usuario no tiene indicación visual de cuáles campos son obligatorios (*) ni mensajes de error cuando intenta avanzar sin completarlos.

### 4. El Campo `nickname` Nunca Se Captura
**Gravedad: MEDIA**

Aunque el usuario puede elegir "nickname" como preferencia de nombre, **nunca se le pide escribir el nickname**. El flujo actual solo guarda `preferred_name_type = 'nickname'` pero no hay un Input para que escriba su apodo.

### 5. No Se Pregunta el Nombre Completo
**Gravedad: MEDIA**

Si el usuario viene de signup social (Google), puede que `full_name` esté vacío. El onboarding no pregunta esto y el sistema asume que el email tiene el nombre.

---

## Cambios Propuestos

### Archivo 1: `src/pages/Onboarding.tsx`

**A) Agregar validación antes de avanzar al Step 2:**
```typescript
const canProceedToStep2 = province.trim() !== '' && workTypes.length > 0;

// En el botón "Siguiente":
<Button 
  onClick={() => setStep(step + 1)} 
  disabled={!canProceedToStep2}  // ← NUEVA VALIDACIÓN
  className="ml-auto"
>
```

**B) Agregar indicadores visuales de campos requeridos:**
```typescript
<Label className="flex items-center gap-2">
  📍 {language === 'es' ? 'Provincia / Región' : 'Province / Region'}
  <span className="text-destructive">*</span>  {/* Indicador requerido */}
</Label>
```

**C) Agregar mensaje de error si no se seleccionaron campos:**
```typescript
{!province && step === 1 && (
  <p className="text-xs text-destructive">
    {language === 'es' ? 'Por favor selecciona una provincia' : 'Please select a province'}
  </p>
)}
```

---

### Archivo 2: `src/hooks/utils/useConversationalOnboarding.ts`

**A) Agregar pregunta de nombre/nickname después de la preferencia:**
```typescript
{
  id: 'user_name_input',
  question: {
    es: '¿Cómo te llamo entonces?',
    en: 'What should I call you then?'
  },
  phoenixIntro: {
    es: '¡Me encanta! 💫 Escríbeme tu nombre o apodo:',
    en: 'Love it! 💫 Write your name or nickname:'
  },
  options: [], // No options - this is a text input question
  field: 'display_name',
  table: 'profile',
  stage: 'essential',
  allowCustom: true, // Permite input de texto libre
  isTextInput: true, // Nueva bandera para indicar que es input de texto
}
```

**B) Guardar el nombre ingresado correctamente:**
```typescript
// En saveProfile():
const displayName = responses.display_name as string;
const namePreference = responses.name_preference as string;

if (displayName) {
  if (namePreference === 'nickname') {
    profileUpdate.nickname = displayName;
  } else {
    profileUpdate.full_name = displayName;
  }
}
```

---

### Archivo 3: `src/components/onboarding/ConversationalOnboarding.tsx`

**A) Agregar soporte para preguntas de texto libre:**
```typescript
{/* Text Input for name/nickname */}
{currentQuestion.isTextInput && (
  <div className="space-y-2">
    <Input
      value={customTextValue}
      onChange={(e) => setCustomTextValue(e.target.value)}
      placeholder={lang === 'es' ? 'Escribe aquí...' : 'Type here...'}
      className="text-lg"
      autoFocus
    />
    <Button 
      onClick={() => {
        selectOption(customTextValue);
        nextStep();
      }}
      disabled={!customTextValue.trim()}
    >
      {lang === 'es' ? 'Continuar' : 'Continue'}
    </Button>
  </div>
)}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Onboarding.tsx` | Agregar validación de campos obligatorios, indicadores visuales (*), mensajes de error |
| `src/hooks/utils/useConversationalOnboarding.ts` | Agregar pregunta de nombre/nickname, guardar en campo correcto (nickname o full_name) |
| `src/components/onboarding/ConversationalOnboarding.tsx` | Agregar soporte para preguntas tipo `isTextInput` con Input de texto libre |

---

## Resultado Esperado

1. **Formulario tradicional** no permite avanzar sin provincia y work type
2. **Onboarding conversacional** captura el nombre real/apodo del usuario
3. **Indicadores visuales** claros de campos requeridos
4. **Nombre guardado** en el campo correcto (`full_name` o `nickname`)
5. **UX mejorada** con feedback inmediato al usuario
