
# Plan: Mejoras al Panel de Leads + Comentarios del Quiz

## Resumen
Vamos a agregar el campo de comentarios al panel de administración y hacer mejoras de usabilidad para facilitar la gestión de leads.

---

## Cambios a Realizar

### 1. Agregar Campo `comments` al Sistema de Leads

**Hook `useLeadsManagement.ts`:**
- Agregar `comments: string | null` a la interface `QuizLead`

**LeadDetail.tsx (Modal de detalle):**
- Mostrar los comentarios del usuario en una sección destacada con icono de mensaje
- Si hay comentarios, mostrarlos en un recuadro amarillo/dorado para que resalte (es info de ventas muy valiosa)

**LeadsTable.tsx:**
- Agregar un indicador visual (icono de mensaje) cuando un lead tiene comentarios
- Esto permite identificar rápidamente leads "calientes" que escribieron algo personal

### 2. Incluir Comentarios en la Exportación

**LeadsExport.tsx:**
- Agregar columna "Comentarios del quiz" a la exportación Excel/CSV
- Esto garantiza que la info llegue si exportas para otro CRM o análisis

### 3. Filtro por Leads con Comentarios

**LeadFilters.tsx:**
- Agregar opción "Con comentarios" al filtro para encontrar rápidamente leads que expresaron necesidades específicas
- Actualizar la interface `LeadFilters` en el hook

---

## Sección Técnica

```text
Archivos a modificar:
├── src/hooks/admin/useLeadsManagement.ts  → Agregar comments a interface + filtro
├── src/components/admin/LeadDetail.tsx    → Mostrar comentarios destacados
├── src/components/admin/LeadsTable.tsx    → Indicador visual de comentarios
├── src/components/admin/LeadsExport.tsx   → Columna de comentarios
└── src/components/admin/LeadFilters.tsx   → Filtro "con comentarios"
```

**Diseño del indicador de comentarios en tabla:**
- Icono `MessageSquare` junto al nombre cuando `lead.comments` existe
- Color ámbar/dorado para destacar

**Diseño del recuadro de comentarios en detalle:**
- Fondo amarillo suave (`bg-amber-50 dark:bg-amber-900/20`)
- Borde dorado
- Título "💬 Mensaje personal del lead"
- Posición prominente (antes del resto de info)

---

## Resultado Final
- Verás un icono de mensaje en la tabla cuando un lead dejó comentarios
- Al hacer clic en "Ver detalles", el comentario aparecerá destacado arriba
- Podrás filtrar solo leads con comentarios
- La exportación incluirá los comentarios
