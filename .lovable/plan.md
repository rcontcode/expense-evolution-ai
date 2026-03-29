

# Mejorar Mensajes del Quiz para País "Otro"

## Problema

Cuando alguien selecciona "🌍 Otro" en el quiz, los mensajes `default` son genéricos y no aclaran que:
- EvoFinz funciona para **todo** (gastos, presupuesto, patrimonio, deudas, metas, mentoría, IA)
- Solo la parte de **impuestos/taxes** es exclusiva de Chile y Canadá por ahora
- Pronto se incorporarán más países

## Cambios

### 1. `src/components/quiz/QuizResults.tsx` — Mejorar todos los mensajes `default`

**12 mensajes** a actualizar (6 ES + 6 EN) en `getPersonalizedMessage`:

**High score (≥80) — 4 defaults (freelancer, employee, business, general):**
```
// ANTES (ES freelancer default):
"EvoFinz no es para arreglarte – es para potenciarte. Automatiza tareas repetitivas..."

// DESPUÉS:
"¡Felicitaciones por tu disciplina! EvoFinz funciona en cualquier país: 
control de gastos con IA, presupuestos, patrimonio neto, metas FIRE y mentoría 
financiera. La optimización fiscal está disponible para Chile y Canadá, 
y pronto se sumarán más países."
```

**Regular score (<80) — 4 defaults + 2 generales:**
```
// ANTES (ES freelancer default):
"Como freelancer, tu control de gastos es clave. EvoFinz automatiza este proceso."

// DESPUÉS:
"Como freelancer, EvoFinz es tu copiloto financiero sin importar el país: 
captura gastos con foto o voz, controla presupuestos, rastrea deudas y patrimonio. 
El módulo de impuestos está optimizado para Chile y Canadá por ahora — 
pronto llegarán más jurisdicciones."
```

Patrón para todos: **"EvoFinz funciona globalmente para [lista features]. La parte fiscal es actualmente para Chile y Canadá, pronto más países."**

### 2. `src/components/quiz/QuizModal.tsx` — Agregar nota bajo opción "Otro"

Cuando el usuario selecciona "🌍 Otro", mostrar un pequeño texto informativo debajo de las opciones:

```
// ES: "✨ EvoFinz funciona en cualquier país. Solo las herramientas fiscales son exclusivas de Chile y Canadá por ahora."
// EN: "✨ EvoFinz works in any country. Only tax tools are currently exclusive to Chile and Canada."
```

## Archivos a modificar (2)

1. **`src/components/quiz/QuizResults.tsx`** — Reescribir 12 mensajes `default` con propuesta de valor global + aclaración fiscal
2. **`src/components/quiz/QuizModal.tsx`** — Agregar nota informativa al seleccionar "Otro/Other"

