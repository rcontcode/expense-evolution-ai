

# Manual de Usuario Interactivo - EvoFinz

## Resumen

Crear una pagina `/user-guide` como un manual de usuario completo, estatico y visualmente rico. Sin dependencia de highlights ni IA en tiempo real -- solo contenido escrito de alta calidad con emojis, colores, efectos CSS, acordeones, bullet points, paso a paso, y navegacion interna por secciones.

## Estructura del Manual

El manual se dividira en **3 grandes bloques**:

### Bloque 1: Vision General (Hero + Valor)
- Que es EvoFinz y para quien es
- Mision, objetivos, ventaja competitiva vs no usar nada o usar herramientas separadas
- El habito de usarla diariamente
- Facilidad de uso y valor que aporta
- Mejora continua con aportes de usuarios

### Bloque 2: Mapa de Secciones (Guia por Area)
Cada seccion principal de la app con:
- Emoji + titulo + descripcion corta
- Para que sirve y que problema resuelve
- Paso a paso de uso basico
- Tips y preguntas frecuentes por seccion
- Como se conecta con otras secciones

Secciones cubiertas:
1. Dashboard (centro de comando)
2. Gastos (registro, categorias, recibos, deducciones)
3. Ingresos (tipos, clientes asociados)
4. Clientes (gestion, facturacion)
5. Contratos (seguimiento de acuerdos)
6. Presupuesto (metas, pagos fijos, ahorro)
7. Kilometraje (viajes de trabajo, deducciones)
8. Calendario Fiscal (fechas limite, recordatorios)
9. Banking (importacion de estados de cuenta)
10. Patrimonio Neto (activos, deudas, FIRE)
11. Captura Rapida (fotos de recibos)
12. Proyectos y Tags (organizacion avanzada)
13. Reconciliacion (cruce banco vs registros)
14. Archivos (almacenamiento de documentos)
15. Perfil de Negocio
16. Configuracion y Preferencias

### Bloque 3: Interconexiones y FAQ Global
- Como fluye la informacion entre secciones (diagrama visual con emojis)
- Preguntas frecuentes globales
- Consultas tipicas de usuarios

## Detalles Tecnicos

### Archivos a crear/modificar:

1. **`src/pages/UserGuide.tsx`** (nuevo) - Pagina principal del manual
   - Componente grande pero estatico, sin logica de backend
   - Usa `Accordion` para secciones colapsables
   - Usa `Card`, `Badge`, `Button` existentes
   - Navegacion interna con scroll-to-section
   - Barra de busqueda simple (filtro client-side por texto)
   - Tabla de contenidos sticky lateral en desktop
   - Bilingue (ES/EN) usando `useLanguage()`
   - Animaciones con `framer-motion` (fade-in al scroll)

2. **`src/data/user-guide-content.ts`** (nuevo) - Contenido separado del componente
   - Toda la data del manual en objetos tipados
   - Facilita edicion futura sin tocar el componente
   - Estructura: secciones > subsecciones > pasos/tips/faq

3. **`src/App.tsx`** (modificar) - Agregar ruta `/user-guide`
   - Lazy import del componente
   - Ruta protegida (usuarios autenticados)

4. **Acceso desde la app** - Links al manual desde:
   - Menu "More" en mobile
   - Seccion de ayuda en Settings
   - Boton en el Dashboard o sidebar

### Patron visual (consistente con BetaGuide.tsx):
- Cards con gradientes sutiles para secciones hero
- Emojis como iconos primarios de cada seccion
- Badges de colores para categorias
- Acordeones para FAQ y detalles expandibles
- Bullet points con iconos de check para pasos
- Cards con borde de color para tips/alertas
- Progress indicators visuales para flujos paso a paso

### Sin dependencias nuevas
Todo se construye con componentes UI existentes (Card, Badge, Button, Accordion, Tabs, framer-motion).

