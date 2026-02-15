

## Plan: Presupuesto Multi-Entidad con Onboarding Inteligente

### El Problema Actual
- Los presupuestos por categoria (`category_budgets`) NO tienen `entity_id` - son globales por usuario
- No hay forma de separar presupuesto familiar vs empresarial
- La seccion de Presupuesto esta en el sidebar pero no es lo suficientemente prominente
- No hay onboarding que explique como funciona ni pregunte al usuario que necesita

### La Solucion: 3 Modos de Presupuesto

```text
+---------------------------------------------+
|  Como quieres manejar tu presupuesto?       |
+---------------------------------------------+
|                                             |
|  [1] UNIFICADO (Sole Proprietorship)        |
|      Una sola bolsa de dinero               |
|      Personal + Negocio juntos              |
|      Ideal para freelancers                 |
|                                             |
|  [2] SEPARADO (Empresa constituida)         |
|      Un presupuesto por entidad             |
|      Familia aparte de Inc/SA/Ltd           |
|      Ideal para empresas formales           |
|                                             |
|  [3] SOLO FAMILIAR                          |
|      Presupuesto personal/hogar             |
|      Sin componente empresarial             |
|      Ideal para empleados asalariados       |
|                                             |
+---------------------------------------------+
```

### Cambios en Base de Datos

1. **Agregar `entity_id` a `category_budgets`**: Para poder asignar presupuestos por entidad
2. **Agregar `budget_mode` a tabla `user_settings`** (o en `preferences` JSON): Para guardar la preferencia del usuario (`unified`, `separated`, `family_only`)

### Cambios en el Frontend

#### 1. Onboarding de Presupuesto (`BudgetSetupWizard`)
- Aparece la primera vez que el usuario entra a `/budget`
- Tarjetas grandes con iconos y explicaciones claras de cada modo
- Detecta automaticamente las entidades existentes y sugiere el modo apropiado
- Se puede cambiar despues desde configuracion

#### 2. Presupuesto mas Prominente en Navegacion
- Mover "Presupuesto" mas arriba en el sidebar con icono mas grande y un indicador visual (badge pulsante o barra de progreso mini)
- En mobile, reemplazar uno de los iconos del bottom bar (o agregar Wallet al grid)
- Agregar un banner/card en el Dashboard que invite a configurar el presupuesto si no esta hecho

#### 3. Selector de Entidad en la Pagina de Presupuesto
- Si modo es `separated`: mostrar tabs o selector para cambiar entre "Familia", "Mi Empresa Inc", etc.
- Si modo es `unified`: todo junto, sin selector
- Si modo es `family_only`: interfaz simplificada enfocada en hogar

#### 4. Filtrado por Entidad en `useMonthlyPlanData`
- El hook recibe `entityId` opcional
- Filtra gastos, ingresos, pagos fijos y presupuestos por la entidad seleccionada
- En modo unificado, no filtra (muestra todo)

### Detalle Tecnico

**Migracion SQL:**
- `ALTER TABLE category_budgets ADD COLUMN entity_id uuid REFERENCES fiscal_entities(id) ON DELETE SET NULL`
- El constraint unico cambia de `(user_id, category)` a `(user_id, category, entity_id)` para permitir presupuestos por categoria por entidad

**Archivos a modificar/crear:**
- `supabase/migrations/` - Nueva migracion para `entity_id` en `category_budgets`
- `src/components/budget/BudgetSetupWizard.tsx` - Nuevo: wizard de configuracion inicial
- `src/components/budget/BudgetEntitySelector.tsx` - Nuevo: selector de entidad dentro de presupuesto
- `src/hooks/data/useCategoryBudgets.ts` - Agregar soporte para `entity_id`
- `src/hooks/data/useMonthlyPlanData.ts` - Filtrar por entidad
- `src/hooks/data/useUserSettings.ts` - Agregar `budget_mode` a preferences
- `src/pages/Budget.tsx` - Integrar wizard, selector, y hacer la pagina mas explicativa
- `src/components/Layout.tsx` - Hacer presupuesto mas prominente en sidebar y mobile
- `src/components/budget/MonthlyPlanCard.tsx` - Adaptar al modo seleccionado

**Flujo del usuario:**
1. Usuario entra a Presupuesto por primera vez
2. Ve el wizard con las 3 opciones explicadas visualmente
3. Selecciona su modo (ej: "Solo Familiar")
4. El sistema configura la vista apropiada
5. Si tiene multiples entidades y elige "Separado", ve tabs para cambiar entre ellas
6. Cada entidad tiene su propio conjunto de presupuestos por categoria, pagos fijos, y proyecciones

