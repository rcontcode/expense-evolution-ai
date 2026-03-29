

# Mejorar Visibilidad de Botones en PageContextGuide

## Problema
Los badges de goals y los botones de acciones se ven como texto plano. Necesitan más volumen visual 3D candy para que sean evidentemente clickeables.

## Cambios en `src/components/guidance/PageContextGuide.tsx`

### 1. Goal badges (línea 178)
Agregar padding más generoso, fondo más sólido con gradiente, y efecto de botón 3D:
```
"text-xs cursor-pointer font-semibold px-3 py-1.5 
 bg-gradient-to-b from-primary/20 to-primary/10 
 border-2 border-primary/40 rounded-xl
 shadow-[0_3px_0_0] shadow-primary/25
 hover:bg-primary/25 hover:shadow-[0_4px_0_0] hover:shadow-primary/30 
 hover:-translate-y-1 hover:border-primary/60 
 active:translate-y-0.5 active:shadow-[0_1px_0_0] active:shadow-primary/20
 transition-all duration-200"
```

### 2. Action buttons (línea 225)
Agregar sombra 3D con offset vertical para efecto de "botón levantado":
```
"group p-3 rounded-xl border-2 border-primary/30 
 bg-gradient-to-b from-card via-card to-muted/30
 shadow-[0_4px_0_0] shadow-primary/20
 hover:border-primary/50 hover:shadow-[0_6px_0_0] hover:shadow-primary/30 
 hover:-translate-y-1.5 hover:bg-primary/5
 active:translate-y-1 active:shadow-[0_1px_0_0] active:shadow-primary/15
 transition-all duration-200 text-left"
```

### 3. Icon containers (línea 228)
Más vibrantes con sombra offset:
```
"w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 
 border-2 border-primary/30 
 shadow-[0_2px_0_0] shadow-primary/20
 flex items-center justify-center 
 group-hover:from-primary/35 group-hover:to-primary/20 
 group-hover:border-primary/50 transition-all duration-200"
```

## Archivo a modificar
1. `src/components/guidance/PageContextGuide.tsx` — líneas 178, 225, 228

