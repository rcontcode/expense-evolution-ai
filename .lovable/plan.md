## Objetivo

Crear un bloque tipo carrusel inspirado en UniversMind que golpee **emocionalmente** primero con un dolor humano profundo, y luego revele una **promesa transformacional** (no una feature de la app). Menos "qué hace EvoFinz", más "en quién te conviertes".

## Filosofía del contenido

Cada par sigue esta fórmula:

```text
[FASE 1 - DOLOR] (4s, frío, gris, cursiva)
  Pregunta o escena humana, íntima, que duele.
  Ej: "¿Y si mi hijo me pregunta cuánto tenemos ahorrado... y no sé qué responder?"

[FASE 2 - TRANSFORMACIÓN] (7s, cálido, gradiente EvoFinz, bold)
  Promesa de identidad / paz / poder, NO feature.
  Ej: "Eres el padre que construye certezas, no el que esconde dudas."
```

NO se mencionan: recibos, OCR, bancos conectados, dashboards, deducciones, categorías. Eso ya está en otras secciones.

SÍ se evocan: tranquilidad, control, dignidad, legado, libertad, claridad mental, dormir tranquilo, mirar a los ojos, decidir sin miedo.

## 12 pares transformacionales propuestos

1. Hijo pregunta cuánto hay ahorrado → "Eres quien responde con certeza, no con silencio."
2. Despertar a las 3am pensando en dinero → "Vuelves a dormir como antes de que el dinero te robara la paz."
3. Pareja pregunta "¿podemos?" y no sabes → "Decides juntos con datos, no con miedo."
4. Fin de año sin saber a dónde se fue todo → "Cierras el año mirando atrás con orgullo, no con vergüenza."
5. Sentir que trabajas mucho y no avanzas → "Tu esfuerzo por fin tiene una huella visible."
6. Miedo a abrir la app del banco → "Abres tus finanzas con la misma calma con la que abres una ventana."
7. Comparación con otros que "sí saben" → "Dejas de admirar a quien tiene control. Te conviertes en esa persona."
8. Postergar decisiones grandes (casa, viaje, estudio) → "Dices 'sí' a la vida que estabas aplazando."
9. Vergüenza de no saber cuánto ganas realmente → "Conoces tus números como conoces tu nombre."
10. Heredar caos a tu familia → "Dejas orden, no un rompecabezas."
11. Sensación de que el dinero te controla → "Tú llevas el timón. El dinero rema."
12. Llegar a fin de mes sin entender por qué no alcanza → "El mes termina y tú entiendes exactamente por qué."

## Implementación técnica

- **Nuevo componente**: `src/components/landing/EvoTransformationBlock.tsx`
  - Replica la lógica de UniversMind: `useState<'fear' | 'hope'>`, `useEffect` con timeouts (4s dolor, 7s esperanza), `AnimatePresence` para transición.
  - Fase dolor: `bg-slate-900`, `text-slate-400 italic`, sin CTA.
  - Fase esperanza: gradiente cálido EvoFinz (cyan→emerald o el primary del proyecto), `text-white font-bold`, CTA suave al `/quiz` ("Empieza tu transformación").
  - Indicador de progreso entre los 12 pares (puntos discretos, no números).
  - Pausable al hover en desktop, swipe manual en mobile.

- **Nuevo data file**: `src/data/landing/transformationPairs.ts` con los 12 pares (estructura `{ id, fear: string, hope: string }`).

- **Integración en Landing**: insertarlo justo después del Hero, antes del resto del flujo.

- **Preservación**: `PainPointsSection` y `TransformationCarousel` actuales se conservan en el código pero se quitan del render activo (comentados en `Landing.tsx` con nota).

## Lo que NO se hace

- No se crean imágenes (es puro texto + color + tipografía, como UniversMind).
- No se mencionan features de la app en este bloque.
- No se elimina ningún componente existente.
- No se cambia el routing del root `/` en este paso (eso lo dejamos como está).

## ¿Procedo así?
