

# Mejorar Estilo de Botones en PageContextGuide

## Problema
Los botones de "goals" (Badge) y "actions" (grid de botones) en el componente `PageContextGuide` se ven como texto plano sin identidad visual de botón. Necesitan el estilo 3D candy del sistema de diseño.

## Cambios

### 1. Goals badges (línea 169)
Cambiar de `Badge variant="outline"` plano a botones con fondo, sombra y efecto 3D:
```
// De:
<Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">

// A:
<Badge variant="outline" className="text-xs cursor-pointer bg-primary/10 border-primary/30 shadow-sm shadow-primary/10 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/15 hover:-translate-y-0.5 hover:border-primary/50 transition-all duration-200 active:translate-y-0 active:shadow-inner">
```

### 2. Action cards (línea 213-231)
Reforzar el estilo 3D candy con fondo visible, sombras más pronunciadas y efecto de profundidad:
```
// De:
"group p-3 rounded-xl border-2 border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all text-left"

// A:
"group p-3 rounded-xl border-2 border-border/60 bg-card/80 shadow-md shadow-black/5 hover:border-primary/40 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/15 hover:-translate-y-1 active:translate-y-0 active:shadow-inner transition-all duration-200 text-left"
```

También mejorar el icon container:
```
// De:
"w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"

// A:
"w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 shadow-sm shadow-primary/10 flex items-center justify-center group-hover:bg-primary/25 group-hover:shadow-md group-hover:shadow-primary/15 transition-all duration-200"
```

## Archivo a modificar
1. `src/components/guidance/PageContextGuide.tsx` — líneas 169, 213-231

