

## Propuesta Estrategica: Homogeneizacion de Botones

### Diagnostico

Tras analizar 241+ archivos con `variant="outline"`, 191+ con `variant="ghost"`, 101+ con `variant="secondary"`, y 12 archivos con `<button className>` nativo, estos son los problemas encontrados:

**Problema principal**: El variante `outline` (usado en 241 archivos, ~2870 instancias) se ve "vacio" - solo tiene borde sin color de fondo. Es el boton mas usado en la app y el que peor se ve. Esto genera una sensacion de inconsistencia general.

**Problemas especificos**:
1. **`outline`** - Border transparente sin relleno, se ve plano y sin vida
2. **`ghost`** - Demasiado invisible, sin ninguna pista visual de que es un boton interactivo
3. **`secondary`** - Aceptable pero carece del "punch" 3D candy que tienen los otros
4. **Botones `<button>` nativos** - ~12 archivos usan `<button className>` directo sin el componente `Button`, saltandose todo el sistema de variantes

### Estrategia: Mejora Centralizada (Solo `button.tsx`)

La belleza de tener un sistema de variantes centralizado es que **modificando SOLO el archivo `src/components/ui/button.tsx`**, todos los ~4500+ botones de la app mejoran instantaneamente. No hay que tocar los 241 archivos individuales.

### Cambios propuestos en `button.tsx`

| Variante | Estado actual | Mejora |
|----------|--------------|--------|
| `default` | Ya bien - 3D con sombra primaria | Sin cambios |
| `destructive` | Ya bien - 3D con sombra roja | Sin cambios |
| `success` | Ya bien - 3D con sombra verde | Sin cambios |
| `gradient` | Ya bien - gradiente con sombra | Sin cambios |
| **`outline`** | Solo borde, fondo transparente | Agregar `bg-primary/8` de fondo sutil + borde mas definido + `text-primary` por defecto + sombra suave. En hover: relleno mas visible |
| **`ghost`** | Totalmente invisible hasta hover | Agregar `bg-muted/40` muy sutil de fondo + borde `border border-transparent` para que al hacer hover aparezca estructura |
| **`secondary`** | Plano, sin profundidad | Agregar sombra interna sutil + borde mas definido + efecto hover con elevacion |
| **`link`** | OK como esta | Sin cambios |

### Ademas: Nuevo variante `outline-filled`

Para CTAs secundarios importantes (como "Descargar", "Agregar", "Crear"), agregar un variante intermedio entre `outline` y `default`:
- Fondo con color primario al 15%
- Texto primario
- Borde primario visible
- Sombra media
- Hover con elevacion

### Archivos a modificar

1. **`src/components/ui/button.tsx`** - Unica modificacion central: mejorar `outline`, `ghost`, `secondary`, agregar `outline-filled`

### Lo que NO se toca

- Los 241 archivos que usan `variant="outline"` - se benefician automaticamente
- Los 191 archivos con `variant="ghost"` - mejoran solos
- Los variantes que ya se ven bien (`default`, `destructive`, `success`, `gradient`)

### Resultado esperado

Todos los botones de la app tendran presencia visual, profundidad y coherencia con la estetica 3D candy ya establecida, sin perder la jerarquia visual (primary > outline-filled > outline > secondary > ghost > link).

