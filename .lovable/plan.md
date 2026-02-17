

# Centro de Archivos Subidos - Vista Unificada

## Situacion Actual

Los archivos subidos estan dispersos en dos lugares:
- **Recibos/Fotos** -> tabla `documents`, visibles parcialmente en `/chaos` (solo los pendientes de revision)
- **Contratos** -> tabla `contracts`, visibles en `/contracts`

No existe un lugar donde puedas ver **todo lo que has subido** de forma centralizada con informacion de: fecha, estado de procesamiento, seccion destino, tipo de archivo, etc.

## Solucion Propuesta

Crear una pagina **"/files"** (Centro de Archivos / File Center) accesible desde el menu lateral, que muestre una tabla/lista unificada de todos los archivos subidos.

### Informacion que mostrara cada archivo

| Campo | Fuente |
|-------|--------|
| Nombre del archivo | `file_name` |
| Fecha de subida | `created_at` |
| Tipo de archivo | `file_type` (PDF, JPG, PNG) |
| Seccion/Origen | "Recibo" o "Contrato" (segun la tabla de origen) |
| Estado de procesamiento | `status` / `review_status` |
| Cliente asociado | `client_id` -> nombre del cliente |
| Vinculado a gasto | `expense_id` (si fue aprobado) |
| Tamano | `file_size` (solo documents) |

### Funcionalidades

1. **Lista unificada** con filtros por:
   - Tipo (Recibos / Contratos / Todos)
   - Estado (Pendiente / Procesado / Aprobado / Rechazado)
   - Rango de fechas

2. **Acciones rapidas** por archivo:
   - Ver/previsualizar
   - Descargar
   - Ir a la seccion correspondiente (abrir en Chaos Inbox o en Contratos)

3. **Estadisticas resumidas** en la parte superior:
   - Total de archivos subidos
   - Pendientes de revision
   - Procesados exitosamente

### Cambios a Realizar

1. **Nuevo archivo**: `src/pages/Files.tsx` - Pagina principal del centro de archivos
2. **Nuevo archivo**: `src/hooks/data/useAllFiles.ts` - Hook que combina datos de `documents` y `contracts` en una lista unificada
3. **Modificar**: `src/App.tsx` - Agregar ruta `/files`
4. **Modificar**: `src/components/Layout.tsx` - Agregar enlace en el menu de navegacion lateral
5. **Modificar**: `src/lib/i18n.ts` - Traducciones bilingues (es/en)
6. **Modificar**: `src/components/PageHeader.tsx` - Agregar configuracion de ruta

### Detalles Tecnicos

- El hook `useAllFiles` ejecutara dos queries paralelas (a `documents` y `contracts`) y las combinara en un formato comun
- Se usaran signed URLs del storage para previsualizacion (bucket `expense-documents` para recibos, bucket de contratos para contratos)
- La tabla usara paginacion o scroll virtual si hay muchos archivos
- Filtros implementados con estado local (useState) para respuesta inmediata
- Reutilizara componentes existentes: `Badge` para estados, `Button` para acciones, `Card` para el layout
- Responsive: en mobile mostrara tarjetas compactas, en desktop una tabla completa

