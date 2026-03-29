

# Análisis Legal + Más Libros en el Tracker

## Análisis Legal: ¿Estamos seguros mencionando a Kiyosaki, Rohn, Tracy?

### Lo que hacemos actualmente
- **Nombres de autores** como labels de tabs y en 783+ menciones en 53 archivos
- **Títulos de libros** en la biblioteca (Amazon links)
- **Citas textuales** atribuidas en `mentor-quotes.ts` (~50 citas)
- **Metodologías** nombradas: "Cuadrante de Kiyosaki", "7 pasos de Tracy", "método ABCDE de Tracy"

### Evaluación legal

**Lo que es SEGURO (sin riesgo):**
- Mencionar nombres de autores como referencia/recomendación — esto es uso referencial, no comercial de su identidad
- Títulos de libros individuales NO son protegibles por copyright (confirmado por USPTO y case law)
- Links a Amazon para comprar libros — esto es recomendación, no piratería
- Decir "inspirado en los principios de Kiyosaki" — uso descriptivo

**Lo que tiene RIESGO BAJO pero debemos cuidar:**
- **Citas textuales**: frases cortas (1-2 oraciones) con atribución generalmente caen bajo fair use, especialmente en contexto educativo. Pero citas largas o muchas citas del mismo libro podrían ser problemáticas
- **Nombres como features**: "Tab Kiyosaki", "Tracy Goal Wizard" — usar nombres de personas vivas como nombres de features de tu producto puede implicar endorsement falso

**Lo que deberíamos CAMBIAR para estar 100% seguros:**

1. **Renombrar tabs/features**: En vez de "Kiyosaki" como nombre del tab, usar "Cashflow & Assets" con subtítulo "Inspirado en Rich Dad Poor Dad". Igual con Tracy → "Goals & Productivity", Rohn → "Journal & Growth", Atomic → "Habits"
2. **Disclaimer**: Agregar un disclaimer pequeño tipo "Esta app no está afiliada, respaldada ni asociada con los autores mencionados. Los nombres y títulos se usan únicamente con fines educativos y de referencia."
3. **Citas**: Mantener atribución siempre. Las citas cortas con autor son fair use en contexto educativo

### Recomendación
El riesgo actual es **bajo** pero no cero. El cambio más importante es agregar un **disclaimer** y considerar renombrar los tabs para que no parezca que los autores son parte del producto.

---

## Plan de implementación

### Paso 1: Agregar disclaimer legal
**Archivo**: `src/pages/Mentorship.tsx`
- Agregar footer discreto: "Los nombres de autores y obras se mencionan con fines educativos. Esta aplicación no está afiliada ni respaldada por los autores citados."
- También en `src/components/mentorship/FinancialLibrary.tsx`

### Paso 2: Renombrar tabs por conceptos (no por personas)
**Archivo**: `src/pages/Mentorship.tsx`
- "Kiyosaki" → "Activos y Flujo" / "Assets & Cashflow" (subtitle: "Método Kiyosaki")
- "Tracy" → "Metas SMART" / "SMART Goals" (subtitle: "Método Tracy")  
- "Rohn" → "Journal y Lectura" / "Journal & Reading" (subtitle: "Filosofía Rohn")
- "Atomic" → "Hábitos" / "Habits" (subtitle: "Atomic Habits")
- Esto protege legalmente sin perder la referencia educativa

### Paso 3: Agregar más libros al tracker/biblioteca
**Archivo**: `src/components/mentorship/FinancialLibrary.tsx`
- Agregar ~15 libros adicionales que faltan y son relevantes:
  - ES: "El código del dinero" (Raimon Samsó), "Padre Rico Padre Pobre para Jóvenes", "Los Secretos de la Mente Millonaria" (T. Harv Eker), "El hombre más rico de Babilonia" versión ilustrada, "Piense y Hágase Rico" (Napoleon Hill) — ya está pero verificar, "Dinero y Conciencia" (Joan Antoni Melé)
  - EN: "Rich Dad's CASHFLOW Quadrant", "The Barefoot Investor" (Scott Pape), "Unshakeable" (Tony Robbins), "The Richest Man in Babylon" — verificar si ya está, "The Compound Effect" (Darren Hardy), "Profit First" (Mike Michalowicz), "Financial Freedom" (Grant Sabatier)
- Verificar que no haya duplicados antes de agregar

### Paso 4: Sugerir libros del tracker en más lugares
**Archivo**: `src/components/mentorship/LearningPathCard.tsx`
- Cuando el usuario no tiene libros en progreso, sugerir uno aleatorio de la biblioteca como "Libro recomendado esta semana"

---

## Archivos a modificar
1. `src/pages/Mentorship.tsx` — Disclaimer + renombrar tabs por concepto
2. `src/components/mentorship/FinancialLibrary.tsx` — Agregar ~15 libros + disclaimer en footer
3. `src/components/mentorship/LearningPathCard.tsx` — Sugerencia de libro semanal
4. `src/lib/constants/mentor-quotes.ts` — Asegurar que todas las citas tengan atribución correcta

