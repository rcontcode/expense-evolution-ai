

## Plan: Corregir país del perfil y asegurar coherencia jurisdiccional

### Problema
Tu perfil tiene `country = 'CL'` (Chile) pero toda tu información indica que estás en Canadá (British Columbia, CAD). No tienes entidades fiscales creadas, así que el sistema cae al fallback del perfil y muestra Chile incorrectamente.

### Cambios necesarios

#### 1. Corregir dato en base de datos
- Actualizar `profiles.country` de `'CL'` a `'CA'` para tu usuario

#### 2. Agregar validación de coherencia en BudgetContextBar
- Detectar si `country` y `province` no coinciden y mostrar un aviso sutil
- Si el país es CL pero la provincia es de Canadá (o viceversa), alertar al usuario

#### 3. Hacer el país editable desde el BudgetContextBar
- Agregar un selector de país (CA/CL) clickeable junto al chip de moneda que ya es editable
- Al cambiar país, actualizar `profiles.country` y ajustar automáticamente la moneda por defecto (CA->CAD, CL->CLP)

#### 4. Mejorar el fallback en EntityContext
- Si no hay entidades fiscales Y el perfil tiene un país incoherente con la provincia, usar la provincia como fuente de verdad para inferir el país correcto
- Agregar un log de advertencia en consola cuando se detecta inconsistencia

### Secciones técnicas

**Base de datos:**
- SQL: `UPDATE profiles SET country = 'CA' WHERE id = '...' AND country = 'CL'`

**BudgetContextBar.tsx:**
- Agregar `Popover` para selector de país similar al de moneda existente
- Al cambiar país: actualizar `profiles.country` + `profiles.display_currency` en cascada

**EntityContext.tsx:**
- Agregar validación cruzada `province` vs `country` en el `useMemo`
- Log warning si hay discrepancia

### Resultado esperado
- Verás 🇨🇦 Canada en la barra de contexto
- Podrás cambiar país y moneda directamente desde la vista de presupuesto
- Si hay inconsistencia entre país y provincia, el sistema te avisará
