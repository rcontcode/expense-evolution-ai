## Objetivo

Pulir el Dashboard Simple en escritorio para que los bloques se vean **homogéneos, ordenados y profesionales**, eliminar la palabra "Conectar" (que sugiere sincronización con APIs) y equilibrar la jerarquía visual.

---

## Cambios

### 1. Renombrar "Conectar banco"

En `src/components/dashboard/SimpleDashboard.tsx` (línea ~582) y donde aparezca en el shell simple:

- ES: `"Conectar banco"` → **`"Subir extracto"`**
- EN: `"Connect bank"` → **`"Upload statement"`**

Razón: la app no se sincroniza vía API; el usuario importa un CSV/foto. El verbo "Subir/Upload" es honesto y directo.

Revisar también `SimpleBanking.tsx` y cualquier copy similar en `src/components/simple/` por consistencia (el botón principal ya dice "Importar extracto", lo dejamos así).

### 2. Reorganizar la grid del Dashboard Simple

Actualmente, en escritorio (≥lg), el contenedor abre un grid de 2 columnas pero las 3 acciones primarias usan `lg:col-span-2` y los demás bloques caen apilados. Resultado: "Próximos pagos" y "Subir extracto" quedan demasiado anchos, y "Educación financiera" ocupa solo media pantalla mientras "Movimientos recientes" se ve desbalanceado.

Nueva estructura en `lg:` (≥1024px):

```text
┌──────────────────────────────────────────────┐
│             HERO BALANCE (full width)        │
└──────────────────────────────────────────────┘
┌──────────────┬──────────────┬──────────────┐
│   Gasto      │   Ingreso    │   Capturar   │   ← 3 acciones primarias (full)
└──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────┐
│ Subir        │ Próximos     │ Mi presup./  │   ← 3 atajos compactos en una sola fila
│ extracto     │ pagos        │ Capturar voz │
└──────────────┴──────────────┴──────────────┘
┌────────────────────────┬────────────────────┐
│  Movimientos recientes │ Educación          │   ← 2 columnas equilibradas
│  (col-span-1)          │ financiera         │
│                        │ (col-span-1, sticky│
│                        │  top, compacta)    │
└────────────────────────┴────────────────────┘
```

Cambios concretos:

- Cambiar el wrapper `lg:grid-cols-2` a una estructura más controlada: dejar el hero fuera del grid (ya está), y crear un único `<div className="grid gap-4 lg:grid-cols-2">` que contenga **solo** "Movimientos recientes" + "Educación financiera".
- Mover los 3 botones primarios y los atajos secundarios **fuera** de ese grid de 2 columnas, a contenedores propios full-width.
- Convertir los atajos secundarios de `grid-cols-2` a `grid-cols-2 lg:grid-cols-3` para que cada chip sea más compacto y no se vean enormes en escritorio.
- Reducir altura de `SecondaryShortcut`: `py-3` → `py-2.5`, añadir `max-w` implícito por la grid.

### 3. Compactar "Educación financiera"

Actualmente la card es alta porque ocupa media pantalla pero su contenido es solo un párrafo. Cambios:

- En el bloque (línea ~707): reducir padding `p-4` → `p-3.5`, `text-sm` del tip → `text-[13px] leading-snug`.
- Limitar el alto visual: el tip raramente excede 3 líneas; al estar en columna junto a "Movimientos recientes" en lg, las alturas se equilibran naturalmente porque las tarjetas dejarán de estirarse en stack.
- Mover el disclaimer "Consulta a un profesional" a un `text-[10px]` más sutil (ya lo está, pero confirmar margen pequeño).

### 4. Equilibrar "Movimientos recientes" + "Próximos pagos"

- Ya no estarán uno debajo del otro a ancho completo. "Próximos pagos" pasa a ser un **chip compacto** (atajo secundario), no una card grande.
- "Movimientos recientes" queda como card a ancho de columna (1/2 pantalla en lg), lo que se siente más profesional y deja respirar a "Educación financiera" al lado.

### 5. Detalles de pulido visual

- Unificar `gap-3` entre todos los bloques superiores y `gap-4` entre las 2 columnas inferiores, para un ritmo vertical consistente.
- Asegurar que las cards usen `h-full` dentro del grid de 2 columnas para que terminen a la misma altura visual.

---

## Archivos a editar

- `src/components/dashboard/SimpleDashboard.tsx` — toda la reestructuración del JSX entre líneas 538–726, y el rename del label en línea 582.
- (Verificar) `src/components/simple/SimplePageShell.tsx` y `SimpleBanking.tsx` por si aparece "Conectar" en algún copy — solo lectura por ahora.

## Fuera de alcance

- No tocar la lógica de datos (hooks, queries).
- No tocar el modo Avanzado.
- No tocar mobile (la estructura actual mobile ya es de 1 columna y se ve bien).
