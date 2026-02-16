
# Auditoria Completa de Base de Datos e Integridad de Datos

## Resumen Ejecutivo

Despues de analizar en detalle las 70+ tablas, relaciones FK, hooks de datos, cache invalidation, y UX de confirmacion, identifique **19 problemas** organizados en 4 categorias de severidad.

---

## 1. CRITICO: Problemas de Integridad de Datos

### 1.1 Eliminar Cliente BORRA contratos en cascada (sin aviso)
- La FK `contracts_client_id_fkey` tiene regla `CASCADE` -- al eliminar un cliente, TODOS sus contratos se borran automaticamente de la BD
- Sin embargo, el codigo en `useDeleteClient` solo hace `delete().eq('id', id)` sin avisar al usuario que perdera contratos
- El `AlertDialog` de confirmacion solo dice "esta accion no se puede deshacer" pero NO menciona que se perderan contratos asociados
- **Solucion**: Antes de borrar un cliente, consultar cuantos contratos/gastos/ingresos tiene y mostrarlo en el dialogo de confirmacion

### 1.2 Eliminar Proyecto deja gastos/ingresos huerfanos (SET NULL)
- Las FKs `expenses_project_id_fkey` e `income_project_id_fkey` son SET NULL
- Al borrar un proyecto, los gastos e ingresos pierden su `project_id` silenciosamente
- No hay aviso al usuario de cuantos registros quedaran sin proyecto
- **Solucion**: Informar cuantos registros se veran afectados y dar opcion de reasignar

### 1.3 Eliminar Entidad Fiscal -- inconsistencia en reglas
- `budget_rollovers_entity_id_fkey` = NO ACTION (bloqueara la eliminacion si hay datos)
- `recurring_bills_entity_id_fkey` = NO ACTION (bloqueara la eliminacion)
- El resto de tablas = SET NULL
- **Solucion**: Unificar a SET NULL o agregar logica previa de limpieza en el hook `useDeleteFiscalEntity`

### 1.4 Eliminar Tag borra relaciones expense_tags en cascada
- `expense_tags_tag_id_fkey` = CASCADE
- Correcto, pero la UI no advierte cuantos gastos usan ese tag
- **Solucion**: Mostrar "Este tag esta usado en X gastos. Se desvinculara de todos."

---

## 2. IMPORTANTE: Cache Invalidation Incompleta

### 2.1 Crear/eliminar ingreso no invalida `dashboard-stats`
- `useCreateIncome` y `useDeleteIncome` invalidan `['income']` pero NO `['dashboard-stats']`
- El Dashboard muestra `monthlyIncome` que se calcula de la tabla `income`
- Resultado: el dashboard queda desactualizado hasta que el usuario recargue
- **Solucion**: Agregar `invalidateQueries({ queryKey: ['dashboard-stats'] })` en income mutations

### 2.2 Crear/eliminar gasto no invalida `income-summary`
- Aunque no es directo, el savings rate del dashboard depende de ambos
- El `useExpensesRealtime` si invalida `dashboard-stats`, pero las mutations directas no consistentemente

### 2.3 Eliminar cliente no invalida `income`, `expenses`, `mileage`
- `useDeleteClient` solo invalida `['clients']`
- Pero al borrar un cliente: contratos se borran (CASCADE), gastos/ingresos/mileage pierden client_id (SET NULL)
- **Solucion**: Agregar invalidacion de `['expenses']`, `['income']`, `['mileage']`, `['contracts']` al borrar cliente

### 2.4 Eliminar proyecto no invalida `expenses` ni `income`
- `useDeleteProject` invalida `['projects']` y `['projects-with-clients']`
- No invalida `['expenses']` ni `['income']` cuyos `project_id` acaba de volverse NULL
- **Solucion**: Agregar invalidacion cruzada

### 2.5 `useUpdateProject` no invalida `['projects-with-clients']` ni `['client-projects']`
- Solo invalida `['projects']`, pero `useCreateProject` si invalida los tres query keys
- **Solucion**: Unificar invalidaciones

---

## 3. MODERADO: Inconsistencias de UX y Codigo

### 3.1 Dos sistemas de Toast diferentes
- Algunos hooks usan `toast()` de `@/hooks/use-toast` (Radix toast): `useExpenses`, `useClients`, `useContracts`, `useMileage`, `useTags`
- Otros usan `toast.success()` de `sonner`: `useIncome`, `useProjects`, `useFiscalEntities`, `useRecurringBills`, `useUserSettings`
- Mezclar ambos puede mostrar toasts en posiciones distintas o con estilos inconsistentes
- **Solucion**: Migrar todo a un solo sistema (sonner es mas moderno y simple)

### 3.2 Idioma inconsistente en mensajes
- `useExpenses`: mensajes en ingles ("Expense created", "Expense deleted")
- `useIncome`: mensajes en espanol ("Ingreso registrado", "Ingreso eliminado")
- `useMileage`: mensajes en espanol ("Viaje registrado")
- `useClients`: mensajes en ingles ("Client created")
- `useFiscalEntities`: usa `useLanguage()` para i18n dinamico
- **Solucion**: Estandarizar usando `useLanguage()` o `t()` en todos los hooks

### 3.3 Falta confirmacion al eliminar en algunas secciones
- Paginas con confirmacion AlertDialog: Expenses, Income, Clients, Projects, Tags, Contracts, Mileage -- OK
- Secciones SIN confirmacion encontrada: `useDeleteFiscalEntity`, `useDeleteBill` (recurring bills), varios widgets del presupuesto
- **Solucion**: Agregar AlertDialog de confirmacion en cada accion de eliminacion

### 3.4 `useDeleteClientTestData` borra datos sin validar relaciones completas
- Borra expenses, income, mileage, contracts del cliente
- Pero NO borra `project_clients`, `expense_tags`, `bill_payments`, ni `documents` asociados
- **Solucion**: Agregar limpieza de tablas intermedias

---

## 4. MEJORAS PROFESIONALES

### 4.1 Sin Audit Log generalizado
- Solo existe `useBudgetAuditLog` para cambios de presupuesto
- No hay registro de quien edito/elimino gastos, ingresos, clientes, etc.
- **Solucion**: Crear un trigger de audit log general o expandir el existente

### 4.2 Sin Soft Delete
- Todas las eliminaciones son permanentes (`DELETE FROM`)
- Un error del usuario = datos perdidos para siempre
- **Solucion**: Agregar columna `deleted_at` (soft delete) en tablas principales (expenses, income, clients, projects, contracts) con opcion de "papelera" para recuperar

### 4.3 Sin validacion de datos huerfanos
- No hay chequeo periodico de gastos con `client_id` que apunta a un cliente que ya no existe
- No hay vista para encontrar gastos sin proyecto, sin cliente, sin entidad
- **Solucion**: Crear un "Health Check" de datos que detecte registros huerfanos

### 4.4 Optimistic Updates ausentes
- Todas las mutations esperan respuesta del servidor antes de actualizar la UI
- Para operaciones simples (marcar pagado, cambiar status), se podria usar optimistic updates
- **Solucion**: Implementar `onMutate` con rollback en `onError` para operaciones frecuentes

### 4.5 Sin limite de 1000 filas protegido
- Ninguna query tiene proteccion contra el limite de 1000 filas de la BD
- Un usuario con muchos datos podria ver datos incompletos sin saberlo
- **Solucion**: Implementar paginacion o `.limit()` explicito con indicador "mostrando X de Y"

---

## Plan de Implementacion (Priorizado)

### Fase 1 -- Integridad (Critico)
1. Corregir dialogo de eliminacion de cliente para mostrar datos afectados
2. Agregar invalidacion cruzada en todas las mutations de delete
3. Unificar FK delete rules en fiscal_entities
4. Agregar advertencia al eliminar tags con gastos asociados

### Fase 2 -- Consistencia
5. Migrar todos los hooks a un solo sistema de toast (sonner)
6. Estandarizar idioma usando `useLanguage()` en todos los hooks
7. Agregar AlertDialog de confirmacion donde falte
8. Corregir `useDeleteClientTestData` para limpiar tablas intermedias

### Fase 3 -- Profesionalizacion
9. Implementar soft delete en tablas principales
10. Crear audit log generalizado
11. Agregar health check de datos huerfanos
12. Implementar paginacion con contadores

Cada fase es independiente y puede implementarse progresivamente sin romper funcionalidad existente.
