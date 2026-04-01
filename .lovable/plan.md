

# Plan: Plantillas de invitación + guía en la página de Códigos Beta

## Qué se construirá

Agregar una tercera pestaña "Invitar" al panel `/admin/beta-codes` con:
1. **Guía paso a paso** de cómo funciona el flujo (crear código → copiar mensaje → enviar → el invitado usa el link)
2. **Generador de mensajes** con plantillas pre-armadas (WhatsApp ES, WhatsApp EN, Email ES, Email EN) que insertan automáticamente el código seleccionado y los links correctos (`https://evofinz.com/auth?beta=CODIGO`)
3. **Selector de código** — dropdown con los códigos activos disponibles
4. **Textarea editable** — el mensaje generado es editable antes de copiar
5. **Botón "Copiar mensaje"** — copia el mensaje completo al clipboard listo para pegar

## Implementación

### Archivo: `src/pages/admin/BetaCodes.tsx`

**Cambios:**

1. Agregar una tercera tab `"invite"` con icono `MessageSquare` al `TabsList` existente (línea ~263-273)

2. Agregar `TabsContent value="invite"` con:

   **Sección "Cómo funciona"** — 3 pasos visuales:
   - Paso 1: Crea códigos en la pestaña "Códigos"
   - Paso 2: Selecciona un código y una plantilla aquí
   - Paso 3: Copia el mensaje y envíalo por WhatsApp/Email

   **Selector de código activo** — `<Select>` filtrado a códigos con usos disponibles

   **Selector de plantilla** — 4 opciones: WhatsApp ES, WhatsApp EN, Email ES, Email EN

   **Textarea** — mensaje pre-generado con el código y link `https://evofinz.com/auth?beta=CODIGO`, editable

   **Botones** — "Copiar mensaje" y "Copiar solo link"

3. Las plantillas son constantes dentro del archivo, cada una es una función `(code: string) => string` que retorna el mensaje completo con:
   - Saludo personalizable
   - Beneficios clave (3-4 bullets)
   - Link directo con el código incluido en query param
   - Instrucciones de uso ("Haz click en el link → regístrate → ¡listo!")

### Plantillas incluidas

**WhatsApp ES:**
```
🔥 ¡Te invito a probar EvoFinz!
... beneficios ...
👉 https://evofinz.com/auth?beta=CODIGO
Tu código: CODIGO
Pasos: click en el link → crea tu cuenta → ¡listo!
```

**WhatsApp EN:**
```
🔥 You're invited to try EvoFinz!
... benefits ...
👉 https://evofinz.com/auth?beta=CODE
Your code: CODE
Steps: click the link → create your account → done!
```

**Email ES/EN:** Versiones más formales con subject line sugerido

## Archivos a modificar

1. **`src/pages/admin/BetaCodes.tsx`** — Agregar tab "Invitar" con generador de mensajes, selector de código, plantillas y guía

