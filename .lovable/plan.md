

## Análisis y Plan

### Problema actual
La sección de pricing en la Landing de EvoFinz muestra listas de features "no incluidas" (`notIncluded`) con tachado y icono X en los planes Free y Premium, lo que alarga mucho las tarjetas verticalmente. En cambio, Fokuspark (imagen 2) solo muestra lo que SI incluye cada plan -- mucho mas limpio y compacto.

### Plan: Eliminar `notIncluded` de las tarjetas de pricing

1. **Eliminar las propiedades `notIncluded`** de los objetos Free y Premium en `pricingTiers` (lineas ~217-230 y ~283-300 aprox)
2. **Eliminar el bloque JSX** que renderiza los items tachados (lineas 1276-1284)
3. Esto reducira significativamente la altura de las tarjetas, especialmente Free y Premium

### Sobre tener una /pricing separada

**Pros:**
- SEO: una pagina `/pricing` dedicada rankea mejor en Google para busquedas tipo "EvoFinz pricing"
- Linking directo: puedes compartir `evofinz.com/pricing` en emails, ads, etc.
- Mas espacio para detalles: FAQ de precios, comparativa lado a lado, testimonios de cada tier
- La landing queda mas ligera si reduces la seccion de pricing a un resumen con "Ver todos los planes"

**Contras:**
- Duplicacion de contenido que hay que mantener sincronizado
- Para una app en crecimiento temprano, una sola landing con pricing integrado suele ser suficiente
- Mas paginas = mas mantenimiento

**Mi recomendacion:** Por ahora NO es necesario. Tu landing ya tiene todo. Cuando tengas mas trafico o necesites campañas con links directos a pricing, creas la pagina dedicada. Es facil de agregar despues.

### Cambios concretos

- **`src/pages/Landing.tsx`**: Eliminar arrays `notIncluded` de los tiers Free y Premium, y eliminar el bloque de render de `notIncluded` en el JSX (desktop y mobile)

