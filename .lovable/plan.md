
# Limpiar Duplicación Legal: /legal como Hub Central

## Problema

La pagina `/legal` contiene 3 secciones que duplican contenido de paginas dedicadas:
- "Terminos de Uso" (seccion 9 de /legal) duplica `/terms`
- "Privacidad y Datos" (seccion 8 de /legal) duplica `/privacy`  
- "Sobre Nuestra Responsabilidad" (seccion 3 de /legal) duplica "Limitacion de Responsabilidad" en `/terms`

Esto confunde al usuario y crea riesgo de inconsistencia si se actualiza un lado pero no el otro.

## Solucion

Convertir `/legal` en un **hub central** que mantiene su contenido unico (disclaimers educativos, IA, fiscal, inversiones) y **reemplaza las secciones duplicadas con tarjetas-enlace** hacia las paginas dedicadas.

### Cambios en `/legal` (Legal.tsx)

**Eliminar estas secciones completas:**
1. Seccion "Terminos de Uso" (id: 'terms') - lineas 554-594
2. Seccion "Privacidad y Datos" (id: 'privacy') - lineas 447-553
3. Seccion "Sobre Nuestra Responsabilidad" (id: 'liability') - lineas 116-159

**Agregar en su lugar** (al final, antes de Contacto) tarjetas de navegacion:

```text
+------------------------------------------+
|  Documentos Legales Completos            |
|                                          |
|  [Terminos de Servicio]  --> /terms      |
|  [Politica de Privacidad] --> /privacy   |
+------------------------------------------+
```

Estas tarjetas tendran icono, titulo, descripcion breve de 1 linea, y flecha para navegar.

### Secciones que se MANTIENEN en /legal (contenido unico)

1. Que es EvoFinz (introduccion educativa)
2. Tu Responsabilidad (disclaimer de usuario)
3. Contenido Generado por IA (disclaimer de alucinaciones/OCR)
4. Informacion Fiscal (disclaimer CRA/SII)
5. Proyecciones de Inversion (disclaimer rendimientos)
6. Contenido Educativo (atribuciones Fair Use)
7. Edad Minima
8. **NUEVO: Tarjetas de navegacion a /terms y /privacy**
9. Contacto (se mantiene al final)

### Resultado

- `/legal` = Hub de disclaimers y avisos educativos (contenido unico) + enlaces a documentos contractuales
- `/terms` = Terminos de Servicio contractuales (suscripciones, pagos, reembolsos, IP, terminacion)
- `/privacy` = Politica de Privacidad detallada

Cero duplicacion. Cada pagina tiene un proposito claro.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Legal.tsx` | Eliminar 3 secciones duplicadas, agregar tarjetas de navegacion a /terms y /privacy |
