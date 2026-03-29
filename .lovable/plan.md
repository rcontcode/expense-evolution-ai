

# Mejoras UX de Mentoría — Ronda 2

## Hallazgos

### 1. Componentes duplicados entre tabs
- `PayYourselfFirstCard` aparece en Atomic Y Rohn
- `FinancialHabitsCard` aparece en Atomic Y Tracy
- `FinancialEducationCard` aparece en Rohn Y Tracy
- Esto confunde al usuario y hace las tabs más largas sin razón

### 2. Weekly Challenges enterrados en Library
- Solo visibles en la tab Library, pero aplican a TODAS las tabs (retos de Kiyosaki, Rohn, Tracy, Atomic)
- Deberían estar en el área superior, visibles siempre

### 3. Progress Summary sin "score" unificado
- Muestra 4 métricas aisladas sin una puntuación global
- No hay tendencia (sube/baja vs semana pasada)
- No hay color dinámico según salud del progreso

### 4. Learning Path desaparece cuando hay actividad
- Si el usuario ya tiene journal, hábitos, metas y libros, retorna `null`
- Debería mostrar sugerencias avanzadas en vez de desaparecer

### 5. Tab banners solo decorativos
- Los gradient headers de cada tab repiten info del nombre sin aportar valor contextual
- Podrían incluir un micro-tip del mentor relevante

---

## Plan de cambios

### Paso 1: Desduplicar componentes entre tabs
- **Atomic tab**: Quitar `PayYourselfFirstCard` (ya está en Rohn)
- **Tracy tab**: Quitar `FinancialHabitsCard` y `FinancialEducationCard` (ya están en Atomic/Rohn)
- Dejar cada herramienta en SU tab nativa

### Paso 2: Mover Weekly Challenges al área superior
- Sacar `WeeklyChallengesCard` de la tab Library
- Colocarlo debajo del grid `ProgressSummary + LearningPath`
- Visible en todas las tabs

### Paso 3: Mejorar Progress Summary con score global
- Calcular un "Mentorship Score" (0-100) basado en: libros leídos, racha hábitos, journal entries, metas activas
- Agregar indicador visual circular o barra con el score
- Color dinámico: rojo (<30), amarillo (30-60), verde (60-80), dorado (80+)
- Agregar badge con nivel textual ("Comenzando", "En camino", "Avanzado", "Maestro")

### Paso 4: Learning Path con sugerencias avanzadas
- Cuando el usuario tiene actividad en todo, en vez de retornar `null`:
  - "Aumenta tu racha a 7 días" → atomic
  - "Completa 5 recursos de la biblioteca" → library
  - "Escribe en tu journal 3 veces esta semana" → rohn
  - "Revisa tu % de libertad financiera" → kiyosaki
- Siempre mostrar al menos 2 sugerencias

### Paso 5: Tab banners con micro-tips contextuales
- Agregar una frase corta del mentor relevante debajo de la descripción existente
- Rotar entre 3-4 tips por tab, cambiando cada vez que se entra
- Ejemplo Kiyosaki: "💡 Tip: Pregúntate hoy ¿este gasto es un activo o un pasivo?"

---

## Archivos a modificar

1. `src/pages/Mentorship.tsx` — Mover challenges arriba, quitar duplicados de tabs
2. `src/components/mentorship/MentorshipProgressSummary.tsx` — Agregar score global + color dinámico
3. `src/components/mentorship/LearningPathCard.tsx` — Sugerencias avanzadas cuando no hay básicas

