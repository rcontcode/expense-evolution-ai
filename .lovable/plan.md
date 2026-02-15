

# Revision Legal: Simplificar y Proteger sin Intimidar

## Problema Identificado

La pagina legal actual tiene lenguaje excesivamente agresivo y corporativo que **no corresponde** a lo que EvoFinz realmente es: una herramienta educativa de organizacion financiera personal. Especificamente:

1. **"Tribunales competentes"** - Mencionar tribunales y procedimientos legales es innecesario e intimidante para una app educativa gratuita/de bajo costo
2. **Indemnizacion agresiva** - Pedir a usuarios que "indemnicen y defiendan" suena a contrato corporativo, no a app de ayuda
3. **Tono general** - Demasiado legalista para el publico objetivo (personas con nivel bajo de educacion financiera)

## Riesgos Latentes Reales (los que SI importan)

| Riesgo | Estado Actual | Solucion |
|--------|--------------|----------|
| Usuario toma decision financiera mala basandose en la app | Disclaimer existe pero podria ser mas claro | Reforzar que es herramienta de ORGANIZACION, no de consejo |
| Contenido de autores (Kiyosaki, etc.) genera reclamo de copyright | Atribucion existe, Fair Use mencionado | Agregar que las citas son breves y con fines educativos transformativos |
| IA (Phoenix) da informacion incorrecta | Disclaimer de IA existe | Reforzar que el asistente es orientativo, no profesional |
| Usuario menor de edad | Requisito 18+ existe | OK, esta bien |
| Datos personales financieros | Politica de privacidad existe | Aclarar mejor que los datos son del usuario y puede eliminarlos |

## Que Vamos a Cambiar

### 1. Eliminar seccion "Jurisdiccion/Tribunales"
Reemplazar con una seccion simple de **"Resolucion de Dudas"** que diga: si tienes un problema, contactanos primero. Sin mencionar tribunales, abogados, ni procedimientos legales.

### 2. Suavizar la seccion "Indemnizacion"  
Reemplazarla con **"Responsabilidad del Usuario"** - un texto amigable que simplemente diga: tu eres responsable de tus decisiones financieras, esta app te ayuda a organizar informacion, no te dice que hacer.

### 3. Reforzar la identidad correcta de la app
En el disclaimer principal, cambiar el enfoque de "NO somos asesores" (negativo) a "SOMOS una herramienta de organizacion y educacion" (positivo). Dejar claro que:
- Organiza gastos, ingresos y documentos
- Ofrece contenido educativo inspirado en expertos
- Proporciona estimaciones aproximadas como referencia
- NO reemplaza a un profesional

### 4. Simplificar el lenguaje general
- Quitar jerga legal innecesaria ("en la maxima medida permitida por la ley aplicable")
- Usar lenguaje accesible para el publico objetivo
- Mantener la proteccion legal real pero con palabras simples

### 5. Agregar seccion de "Contacto"
Una seccion simple con email de contacto para que los usuarios tengan un canal directo si hay algun problema, en vez de amenazar con tribunales.

## Seccion Tecnica

### Archivo a modificar
- `src/pages/Legal.tsx` - Reescribir las secciones problematicas

### Cambios especificos en secciones:

**Eliminar completamente:**
- Seccion `jurisdiction` (tribunales/ley aplicable)
- Seccion `indemnification` (indemnizacion agresiva)

**Reemplazar con:**
- Seccion `user-responsibility` - "Tu eres responsable de tus decisiones. Esta app organiza informacion, no da ordenes."
- Seccion `contact` - "Si tienes alguna duda o problema, escribenos a [email]"

**Modificar:**
- Seccion `disclaimer` - Cambiar tono de "NO hacemos X" a "Somos una herramienta de organizacion y educacion"
- Seccion `liability` - Simplificar lenguaje, quitar jerga legal
- Seccion `terms` - Simplificar, hacerlo mas conversacional

**Mantener sin cambios:**
- Seccion `ai-content` - Esta bien
- Seccion `tax` - Esta bien  
- Seccion `investment` - Esta bien
- Seccion `education` / atribuciones - Esta bien
- Seccion `age` - Esta bien
- Seccion `privacy` - Esta bien
- Checkbox de aceptacion en signup - Ya existe y funciona correctamente

### Iconos a ajustar
- Quitar `Gavel` (martillo de juez) y `MapPin` de los imports
- Agregar `Mail` o `MessageCircle` para la seccion de contacto
- Cambiar `ShieldAlert` por algo menos agresivo

## Resultado Final
Una pagina legal que **protege a EvoFinz** de responsabilidad real pero con un tono **amigable y accesible**, acorde con una app que busca **ayudar** a personas con poca educacion financiera a organizarse mejor.

