

# Acelerar el Asistente Phoenix (Version Simple)

## Que vamos a hacer

Cambiar el modelo de inteligencia artificial de `openai/gpt-5` a `google/gemini-3-flash-preview` en el backend. Es literalmente cambiar el nombre del modelo en 2 lineas de codigo.

## Por que esto funciona

| | gpt-5 (actual) | gemini-3-flash (nuevo) |
|---|---|---|
| Velocidad | Lento | 3-5x mas rapido |
| Costo | El mas caro | Mucho mas barato |
| Inteligencia | Excelente | Muy buena (suficiente para Phoenix) |
| Tool calling | Si | Si |
| Riesgo de error | - | Cero (mismo formato de API) |

## Que NO cambia

- La interfaz del chat sigue igual
- Los comandos de voz siguen igual  
- Las herramientas (crear gasto, navegar, etc.) siguen igual
- El historial de conversacion sigue igual
- Nada se rompe porque la API es compatible

## Detalle tecnico

Un solo archivo cambia: `supabase/functions/app-assistant/index.ts`

- Linea 1184: cambiar `"openai/gpt-5"` por `"google/gemini-3-flash-preview"`
- Linea 1278: cambiar `"openai/gpt-5"` por `"google/gemini-3-flash-preview"`

Eso es todo. Dos lineas. Si no te gusta el resultado, se cambia de vuelta en 10 segundos.

