

# Mejorar Estilo 3D Candy en Botones de PageContextGuide

## Cambios

### 1. Goals badges (línea 178)
Más fondo, borde más fuerte, sombra 3D:
```
"text-xs cursor-pointer font-semibold bg-primary/15 border-2 border-primary/40 
 shadow-md shadow-primary/15 hover:bg-primary/25 hover:shadow-lg hover:shadow-primary/25 
 hover:-translate-y-1 hover:border-primary/60 transition-all duration-200 
 active:translate-y-0.5 active:shadow-inner"
```

### 2. Action buttons grid (línea 225)
Más contraste, borde grueso, sombra más pronunciada, efecto 3D con gradiente sutil:
```
"group p-3 rounded-xl border-2 border-primary/30 bg-gradient-to-b from-card to-card/80 
 shadow-lg shadow-primary/10 hover:border-primary/50 hover:bg-primary/10 
 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1.5 
 active:translate-y-0.5 active:shadow-inner transition-all duration-200 text-left"
```

Icon container (línea 228) — más vibrante:
```
"w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 
 border-2 border-primary/25 shadow-md shadow-primary/15 
 flex items-center justify-center 
 group-hover:from-primary/30 group-hover:to-primary/15 
 group-hover:shadow-lg group-hover:shadow-primary/25 
 group-hover:border-primary/40 transition-all duration-200"
```

## Archivo a modificar
1. `src/components/guidance/PageContextGuide.tsx` — líneas 178, 225, 228

