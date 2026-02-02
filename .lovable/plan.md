
# Plan: Rediseño Profesional del Menú Móvil

## Problemas Identificados

1. **Diseño desorganizado**: El menú actual usa múltiples cards con gradientes coloridos que crean un aspecto caótico
2. **EntitySelector muy elaborado**: El componente de jurisdicción tiene animaciones y gradientes excesivos para un menú móvil
3. **LanguageSelector minimalista**: Solo muestra un ícono sin indicación del idioma seleccionado
4. **Secciones con bordes y fondos inconsistentes**: Los cards de sección no siguen un patrón visual coherente
5. **Botón de cerrar sesión poco profesional**: No tiene el estilo correcto
6. **Falta de espaciado y jerarquía**: Los elementos están apilados sin estructura clara

## Soluccion: Menú Móvil Profesional Estilo App Nativa

### Fase 1: Refactorizar SheetContent del Menú (Layout.tsx)

Cambios en el Sheet del menú móvil:
- **Header limpio**: Logo + Título "Menú" + Botón X alineado
- **Selector de jurisdicción simplificado**: Una fila limpia con bandera + nombre + flecha
- **Secciones agrupadas**: Cards con fondo sutil, sin bordes coloridos excesivos
- **Items de navegación limpios**: Fila con ícono + texto + badge (si aplica)
- **Footer organizado**: Selector de idioma visible + Botón cerrar sesión

### Fase 2: Componente MobileMenuEntitySelector

Crear versión simplificada del EntitySelector para móvil:
- Layout horizontal compacto: Bandera | Nombre | Chevron
- Fondo neutro con borde sutil
- Sin animaciones pesadas
- Touch target de 44px

### Fase 3: Componente MobileMenuLanguageSelector

Crear versión mejorada del LanguageSelector para móvil:
- Mostrar bandera + código de idioma actual
- Dropdown con opciones claras
- Indicador visual del idioma seleccionado

### Fase 4: Estilos del Menú (index.css)

Nuevas clases CSS:
- `.mobile-menu-section`: Card con fondo sutil, sin gradientes
- `.mobile-menu-section-title`: Título pequeño con emoji
- `.mobile-menu-item`: Fila de navegación limpia y táctil

---

## Estructura Visual del Nuevo Menú

```text
+----------------------------------+
|  [Logo] Menú                [X]  |
+----------------------------------+
|  [🇨🇱] Mi Empresa Personal    >  |   <- EntitySelector simplificado
+----------------------------------+
|                                  |
|  💰 DÍA A DÍA                    |
|  +------------------------------+|
|  |  [📊] Resumen Financiero     ||
|  |  [💰] Ingresos               ||
|  |  [🧾] Gastos                 ||
|  |  [📥] Centro de Revisión    ||
|  +------------------------------+|
|                                  |
|  🏢 MI NEGOCIO                   |
|  +------------------------------+|
|  |  [👥] Clientes               ||
|  |  [📁] Proyectos              ||
|  |  [📄] Contratos              ||
|  +------------------------------+|
|                                  |
|  (más secciones...)              |
|                                  |
+----------------------------------+
|  [🇪🇸 Español ▼]                 |   <- Selector de idioma
|  [🚪 Cerrar sesión]              |   <- Botón de logout
+----------------------------------+
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Layout.tsx` | Refactorizar el contenido del Sheet móvil con nueva estructura limpia |
| `src/components/mobile/MobileMenuEntitySelector.tsx` | Nuevo componente simplificado para el menú |
| `src/components/mobile/MobileMenuLanguageSelector.tsx` | Nuevo componente con idioma visible |
| `src/index.css` | Nuevas clases para estilos del menú móvil |
| `src/components/mobile/index.ts` | Exportar nuevos componentes |

---

## Detalles Técnicos

### MobileMenuEntitySelector
```text
- Usa useFiscalEntities() para obtener la entidad primaria
- Layout: flex items-center justify-between
- Muestra: Bandera (2xl) | Nombre (font-medium) | ChevronRight
- Click navega a /settings o abre dropdown si hay múltiples entidades
- Background: bg-muted/50 con hover:bg-muted
- Border-radius: rounded-xl
- Min-height: 52px (touch friendly)
```

### MobileMenuLanguageSelector
```text
- Usa useLanguage() para obtener idioma actual
- Muestra: Bandera del idioma + Nombre completo (Español/English)
- DropdownMenu con opciones claras
- Ancho completo con justify-between
- Indicador de check en opción seleccionada
```

### Estructura del Sheet
```text
- SheetContent: w-[300px] p-0 overflow-hidden
- Header: sticky top-0, border-b, bg-background
- Content: flex-1 overflow-y-auto, padding uniforme
- Footer: border-t, bg-background, safe-area-bottom
- Secciones: Cards con bg-card, shadow-sm, rounded-xl
```

---

## Beneficios

1. **Aspecto profesional**: Diseño limpio sin elementos visuales excesivos
2. **Consistencia**: Todos los elementos siguen el mismo patrón visual
3. **Usabilidad**: Touch targets adecuados y jerarquía clara
4. **Performance**: Menos animaciones y gradientes = mejor rendimiento
5. **Mantenibilidad**: Componentes modulares y reutilizables
