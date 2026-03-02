

## Problema actual

Cada area del Centro de Control muestra TODOS sus componentes en una lista vertical larga sin jerarquia interna. El resultado: scroll infinito cuando varias areas estan expandidas. No hay forma de navegar DENTRO de un area.

---

## 3 Propuestas de mejor visualizacion (sin eliminar nada)

### Propuesta 1: "Sub-tabs dentro de cada area" (Recomendada)

Cada area expandida muestra **tabs internas** que agrupan sus componentes por tema. Solo se ve el contenido del tab activo.

```text
┌─ 📈 Crecimiento ──────────────────────────┐
│ [Inversiones] [Mentoría] [Metas] [Educación] │
│                                               │
│  (solo se muestra el tab activo)              │
│  FIRECalculator + Portfolio + Tips            │
│                                               │
│  → Página de Mentoría                         │
└───────────────────────────────────────────────┘
```

**Agrupaciones por area:**
- **Negocio**: Gráficos | Kilometraje
- **Familia**: Análisis | Presupuesto | Deudas | Suscripciones
- **Día a Día**: (solo 1 grupo, sin tabs)
- **Crecimiento**: Inversiones | Mentoría | Metas | Educación
- **Impuestos**: Optimización | Resumen

**Ventajas:** Reduce el scroll drasticamente. Cada tab carga lazy. Familiar para el usuario.
**Desventajas:** Un click extra para cambiar de sub-tab.

---

### Propuesta 2: "Acordeones internos"

Dentro de cada area, los componentes se agrupan en **acordeones colapsables** con titulo. El usuario expande solo lo que necesita.

```text
┌─ 👨‍👩‍👧 Familia ───────────────────────────┐
│ ▶ Análisis Mensual                          │
│ ▼ Presupuesto                               │
│   [GlobalBudgetCard] [CategoryBudgetsCard]  │
│   [BudgetAlertsCard]                        │
│ ▶ Deudas y Suscripciones                    │
└─────────────────────────────────────────────┘
```

**Ventajas:** Maxima granularidad. El usuario decide exactamente que ver.
**Desventajas:** Demasiados clicks. Puede sentirse "escondido".

---

### Propuesta 3: "Vista compacta con MiniCards + expandir"

Cada area muestra un **resumen compacto** (mini-cards con KPIs clave) por defecto. Un boton "Ver detalle" expande el contenido completo debajo.

```text
┌─ 📈 Crecimiento ──────────────────────────┐
│ [🔥 FIRE: 30 años] [💼 Portfolio: $203K]    │
│ [📊 4 metas activas] [📖 2 en progreso]     │
│                                              │
│         [ ▼ Ver detalle completo ]           │
│                                              │
│  (expandido: todos los componentes actuales) │
└──────────────────────────────────────────────┘
```

**Ventajas:** Vista inicial ultra-rapida. El usuario ve los KPIs sin scroll.
**Desventajas:** Un click extra para ver herramientas completas. Necesita extraer KPIs de cada componente.

---

## Comparacion

| Criterio | Sub-tabs | Acordeones | MiniCards |
|---|:---:|:---:|:---:|
| Reduce scroll | 9/10 | 8/10 | 7/10 |
| Facilidad de uso | 9/10 | 6/10 | 8/10 |
| Esfuerzo de implementar | 6/10 | 8/10 | 5/10 |
| Nada se elimina | 10/10 | 10/10 | 10/10 |
| Rendimiento | 9/10 | 7/10 | 9/10 |

---

## Plan de implementacion (Propuesta 1 si se aprueba)

1. Crear componente `AreaTabsLayout` generico que recibe tabs con label + contenido lazy
2. Refactorizar cada `*AreaContent.tsx` para agrupar componentes en tabs usando `AreaTabsLayout`
3. Persistir el tab activo por area en localStorage para que el usuario vuelva donde estaba
4. Dia a Dia no cambia (solo tiene un grupo)

**Archivos a modificar:** 1 nuevo componente + 4 area content files. Cero eliminaciones.

