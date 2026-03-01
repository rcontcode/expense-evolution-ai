

## Plan: Hacer las tarjetas de pricing mas anchas

El grid principal de pricing (linea 1136) usa `max-w-6xl` y el compacto (linea 1292) usa `max-w-5xl`. Para que las tarjetas sean mas anchas y usen menos espacio vertical (como Fokuspark), hay que:

### Cambios en `src/pages/Landing.tsx`

1. **Grid principal (linea 1136)**: Cambiar `max-w-6xl` a `max-w-7xl` y reducir `gap-6` a `gap-5`
2. **Grid compacto (linea 1292)**: Cambiar `max-w-5xl` a `max-w-7xl`
3. Ambos cambios permiten que las 4 columnas tengan mas ancho disponible, reduciendo el wrap de texto y la altura vertical de cada tarjeta

