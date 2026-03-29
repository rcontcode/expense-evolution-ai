

# Agrupar Archivos Multi-Página como Un Solo Contrato

## Problema
Cuando subes un contrato de 3 páginas (ej: 3 fotos), el sistema crea 3 filas independientes en la tabla `contracts`. Esto causa:
1. La tabla muestra 3 contratos separados en vez de 1 contrato de 3 páginas
2. No puedes ver el contrato completo — solo página por página
3. Con varios clientes y contratos multi-página, la vista es un caos
4. El análisis IA se ejecuta por archivo individual en vez del contrato completo

## Solución: `group_id` para agrupar páginas

### 1. Migración DB
Agregar columna `group_id UUID` a `contracts`. Cuando se suben múltiples archivos juntos, todos comparten el mismo `group_id`. Contratos de un solo archivo tienen `group_id = NULL` o su propio UUID.

```sql
ALTER TABLE contracts ADD COLUMN group_id uuid DEFAULT NULL;
ALTER TABLE contracts ADD COLUMN page_order integer DEFAULT 0;
```

### 2. Cambiar lógica de creación (`useContracts.ts`)
**Actualmente**: Loop que crea 1 row por archivo, cada uno con título/fechas/valor duplicados.
**Nuevo**: Generar un `group_id` compartido cuando `files.length > 1`. Solo el primer archivo lleva los metadatos completos (título, valor, fechas). Los demás llevan el mismo `group_id` y `page_order` incremental, sin duplicar metadatos.

### 3. Agrupar visualmente en la tabla (`ContractsTable.tsx`)
- Agrupar contratos por `group_id` antes de renderizar
- Mostrar 1 fila por grupo, con badge "3 páginas" si tiene múltiples archivos
- El título del grupo es el del primer archivo (o el título manual)

### 4. Visor multi-página en `ContractDetailDialog.tsx`
- Cuando el contrato tiene `group_id`, buscar todas las páginas del grupo
- Agregar navegación de páginas (← Pág 1/3 →) en el visor de documentos
- Mostrar thumbnails de todas las páginas en un sidebar o strip inferior

### 5. Agrupar contratos existentes (`ContractsTable.tsx`)
- Agregar acción "Agrupar con..." en el menú de acciones (⋮)
- Permite seleccionar otros contratos del mismo cliente para unificar bajo un `group_id`
- También permitir "Desagrupar" para separar archivos

### 6. Query actualizado (`useContracts.ts`)
- Agregar `page_order` al `ORDER BY`
- Crear helper `useContractGroup(groupId)` que trae todas las páginas de un grupo

## Archivos a modificar
1. **Migración SQL** — Agregar `group_id` y `page_order` a tabla `contracts`
2. **`src/hooks/data/useContracts.ts`** — Asignar `group_id` compartido al subir múltiples archivos, crear hook `useContractGroup`
3. **`src/types/contract.types.ts`** — Agregar `ContractGroup` type
4. **`src/components/tables/ContractsTable.tsx`** — Agrupar filas por `group_id`, mostrar badge de páginas
5. **`src/components/contracts/ContractCard.tsx`** — Badge de páginas en mobile
6. **`src/components/contracts/ContractDetailDialog.tsx`** — Navegación multi-página con todas las páginas del grupo
7. **`src/pages/Contracts.tsx`** — Pasar datos agrupados

