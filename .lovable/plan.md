## Auditoría del flujo Modo Simple — mejoras de claridad

### Estado actual (lo que ya funciona bien)

- ✅ Welcome dialog al primer login (Simple vs Avanzado, "recomendado para empezar")
- ✅ Toggle visible siempre en header (1 sola ubicación canónica)
- ✅ Onboarding path con quick-add (Clientes + Contratos), "qué falta" en fiscal y celebración dismissible
- ✅ Sparkline de tendencia 6 meses con comparación MoM
- ✅ 3 acciones primarias + 2 secundarias + chips Gastos/Ingresos
- ✅ Tip educativo con disclaimer "consulta a profesional"

### Problemas de claridad detectados (8)

1. **Hero balance sin contexto**: aparece "+$1.200" sin explicar qué significa. Un usuario no sabe si es ahorro, ganancia o disponible.
2. **Income/Expense en hero**: solo iconos + monto sin label "Ingresos" / "Gastos".
3. **Icono inconsistente**: botón "Ingreso" usa `Plus` (genérico) mientras "Gasto" usa `Receipt` (semántico).
4. **Acciones primarias sin descripción**: "Gasto/Ingreso/Capturar" no dice qué hace cada uno (¿abre form? ¿lleva a lista?).
5. **Sparkline ambiguo**: "+15%" en gastos no es obvio que es **malo** para alguien sin alfabetización financiera.
6. **Footer promocional**: invita a Avanzado sin decir qué ganas — debería ser informativo.
7. **Empty state seco**: "Aún no hay movimientos" no sugiere las 3 formas de empezar (foto, voz, manual).
8. **Tip duplicado en empty state**: cuando no hay datos, tip y empty state dicen lo mismo.

---

### Cambios

#### 1. Hero balance — sublínea explicativa

Agregar bajo "Balance del mes":
```
Lo que te queda · ingresos − gastos
```

#### 2. Labels Ingresos/Gastos en hero

Cada cifra del hero llevará su label corto en uppercase:
```
↑ INGRESOS  $4.500    ↓ GASTOS  $3.300
```

#### 3. Barra de gasto con frase completa

Cambiar `"Gastado · 73%"` por:
```
Has gastado 73% de tus ingresos
```

#### 4. Icono coherente para "Ingreso"

Botón "Ingreso" → `TrendingUp` (en vez de `Plus`). "Gasto" mantiene `Receipt`. "Capturar" mantiene `Camera`.

#### 5. Subtexto en las 3 acciones primarias

Cada `ActionButton` muestra ahora 2 líneas:
- Gasto · *"Registrar uno nuevo"*
- Ingreso · *"Sumar al balance"*
- Capturar · *"Foto de recibo"*

Pequeño (text-[10px]) para no romper el ritmo visual.

#### 6. Sparkline — etiqueta semántica del delta

El chip de variación añade texto contextual:
- Si subió: `↑ +15% más que el mes pasado` (rosa)
- Si bajó: `↓ −8% menos que el mes pasado` (verde — ahorraste)
- Si igual: chip oculto

Y debajo del gráfico, una micro-frase:
```
Subir = gastaste más · Bajar = ahorraste
```
(Solo se muestra una vez por sesión vía localStorage `simple_sparkline_legend_seen`.)

#### 7. Empty state — 3 caminos para empezar

Reemplazar el texto plano por 3 chips sugeridos:
```
[📸 Foto de recibo]  [🎤 Por voz]  [✍️ Manual]
```
Cada uno navega a la acción correspondiente. Solo aparece cuando `recent.length === 0`.

#### 8. Footer informativo (no promocional)

Cambiar:
> "Modo Simple activo · Cambia a Avanzado desde el botón en el header."

Por:
> "Estás en Modo Simple. Cuando quieras impuestos, inversiones, contratos o ecosistema, cambia a Avanzado en el header."

#### 9. Tip cuando no hay datos

Cuando no hay movimientos, NO mostrar el tip "empieza registrando..." (ya está en el empty state). Mostrar en su lugar un dato de educación financiera genérico:
```
"Registrar tus movimientos durante 30 días te da una imagen real de tu salud financiera. — Consulta a un profesional antes de tomar decisiones."
```

---

### Archivos a editar

- `src/components/dashboard/SimpleDashboard.tsx` — hero, labels, acciones con subtexto, empty state con 3 chips, footer, tip empty
- `src/components/dashboard/SimpleSparkline.tsx` — texto semántico del delta + leyenda one-time

### Sin cambios

- Welcome dialog (ya está claro)
- UiModeToggle (ya tiene tooltips correctos)
- Onboarding path (recién pulido)
- Estructura general / orden de secciones

### Lo que NO hago

- No agrego tour guiado paso-a-paso (intrusivo, ya hay welcome dialog)
- No cambio rutas ni navegación
- No toco el modo Avanzado

### Resultado esperado

Un usuario completamente nuevo abre Simple Mode y entiende **sin leer documentación**:
- Cuánto le queda este mes y por qué
- Si está mejor o peor que el mes anterior (y si subir/bajar es bueno)
- Las 3 formas de empezar a registrar
- Qué pasos faltan para tener todo configurado
- Dónde y cuándo cambiar a Avanzado
