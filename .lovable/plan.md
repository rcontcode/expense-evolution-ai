# Demo Studio v2 — Cierre completo de gaps

Cerramos los 6 gaps detectados para que el Demo Studio quede listo para grabar profesionalmente, incluyendo Chile y Canadá.

---

## 1. Marcar campos sensibles con `data-pii` (CRÍTICO)

El CSS de REC Mode ya existe pero no enmascara nada hoy. Voy a marcar los puntos donde aparece tu identidad real:

- **Header de usuario** (avatar, nombre, email en dropdown)
- **Página de Settings/Perfil** (campos de nombre, email, teléfono)
- **Sidebar/menú móvil** (saludo "Hola, [nombre]")
- **Badge de email** en facturación/suscripción
- **Avatares con foto real** → blur

Resultado: al activar REC Mode, tu nombre se reemplaza por "Demo User", el email se difumina, los avatares se borronean. Sin tocar lógica, solo atributos.

---

## 2. Validar el seeder contra el schema real (CRÍTICO)

La edge function inserta en 5 tablas con campos que inventé sin verificar. Riesgo alto de que `seed` falle. Voy a:

- Leer el schema real de `expenses`, `income`, `recurring_bills`, `bank_transactions`, `fiscal_entities`
- Ajustar el payload de cada escenario para que coincida 1:1 (tipos enum, columnas opcionales/requeridas, defaults)
- Probar `seed` y `reset` con la cuenta admin
- Confirmar que `status` cuenta correctamente

---

## 3. Indicador visual de grabación

Hoy solo está el FAB rojo. Cuando grabas, es fácil olvidar que está activo. Añado:

- **Borde rojo sutil de 2px** alrededor del viewport cuando REC Mode está ON (estilo OBS)
- **Etiqueta "DEMO MODE"** semitransparente arriba-izquierda (no estorba la grabación pero te recuerda)
- Mejora la consistencia visual del FAB existente

---

## 4. Guiones embebidos en el panel admin

En lugar de tener que abrir el PDF en otra pantalla:

- Embeber los 5 guiones como texto estructurado dentro de `/admin/demo-studio`
- Botones por guion: **"Ver guion"**, **"Copiar voiceover ES"**, **"Copiar voiceover EN"**
- Vista plegable con timestamps + acciones de click + notas de edición
- Útil si grabas en mobile o sin segunda pantalla

---

## 5. Escenario C — "Constructora CA" (Canadá B2B)

Solo tienes escenarios Chile/persona natural. Para grabar bien el video de Tax Hub CRA falta:

- Empresa con HST/GST (Ontario 13%)
- 8 facturas con impuestos canadienses desglosados
- 5 entradas de mileage tracking (km empresariales)
- 3 ingresos de clientes
- 1 entidad fiscal CA con Business Number ficticio
- Moneda CAD

Útil para: video Reports & Tax Hub (sección Canadá) y demos a leads canadienses.

---

## 6. Modo silencioso para gamificación

Streaks, puntos y confetti pueden distraer en videos serios de finanzas. Añado:

- Toggle **"Modo silencioso"** en el panel Demo Studio
- Cuando está ON + REC Mode activo: oculta badges de XP, suprime notificaciones de logros, desactiva confetti
- Solo visual, no toca datos ni progreso real
- Se restaura automáticamente al desactivar REC Mode

---

## Detalle técnico

**Archivos nuevos:**
- (ninguno, todo se integra en archivos existentes)

**Archivos editados (~10):**
- `supabase/functions/manage-demo-data/index.ts` — ajustar payloads tras leer schema + añadir escenario Canadá
- `src/pages/admin/DemoStudio.tsx` — selector de 3 escenarios, sección guiones embebidos, toggle modo silencioso
- `src/components/RecModeFab.tsx` — overlay de borde rojo + etiqueta DEMO MODE
- `src/index.css` — estilos del overlay + reglas modo silencioso (`.rec-mode.quiet [data-gamification]`)
- `src/hooks/useRecMode.ts` — añadir estado `quietMode` persistido
- ~5 componentes con identidad real → añadir `data-pii="..."` (Header, Settings, Sidebar, etc.)
- ~3 componentes de gamificación → añadir `data-gamification` para que el modo silencioso los pueda ocultar

**Sin migración de DB.** Sin nuevas dependencias. Todo gated por `is_admin`. Cero impacto en usuarios reales.

**Datos de los 5 guiones:** los guiones ya generados en `/mnt/documents/demo-studio/*.md` los leo y los importo como constantes TS dentro del panel admin (no duplicación de mantenimiento si actualizas el PDF, solo regeneras desde la misma fuente).

---

## Orden de entrega

1. Validar schema real (item 2) — base para que todo funcione
2. Marcar `data-pii` (item 1) — desbloquea REC Mode visualmente
3. Overlay visual REC (item 3)
4. Escenario Canadá (item 5)
5. Guiones embebidos (item 4)
6. Modo silencioso (item 6)

Te aviso al final con el flujo de prueba end-to-end (cargar → activar REC → ver guion → grabar → limpiar).
