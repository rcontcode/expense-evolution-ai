

# Mejora Legal: Consistencia en Referencias a Autores

## Diagnóstico

Revisé 46 archivos con menciones. La app ya tiene buena base legal (página `/legal` con Fair Use, `LegalDisclaimer`, tooltips "No afiliado"). Pero hay **inconsistencias de riesgo**:

### Nivel de Riesgo por Zona

| Zona | Riesgo | Problema |
|------|--------|----------|
| **Hooks de datos** (useCashflowQuadrant, useDebtClassification) | Alto | Usan `Kiyosaki: "cita"` en recomendaciones como si fuera asesoría directa del autor |
| **AssetDialog** | Alto | `Robert Kiyosaki dice:` como si la app tuviera su endoso |
| **UpgradePrompt** (ventas) | Alto | Usa nombres en copy de venta: "Principios Kiyosaki", "Metas Tracy" — implica afiliación comercial |
| **FAQSection / info-tooltip** | Medio | Nombres en descripciones de features como selling point |
| **MentorshipLevelBanner** | Bajo | Contexto educativo con atribución — OK bajo Fair Use |
| **mentor-quotes.ts** | Bajo | Catálogo educativo con atribución — OK |
| **Badges "📖 Kiyosaki*"** | Bajo | Ya tienen tooltip "No afiliado" — OK |

### Principio Legal

- **Sección de Mentoría** (contexto educativo explícito): nombres con atribución y disclaimer = OK
- **Fuera de Mentoría** (hooks, ventas, tooltips, landing): nombres deben ser genéricos o reformulados

## Cambios

### 1. `src/hooks/data/useCashflowQuadrant.ts` — Eliminar nombre de recomendación

```
// ANTES:
'Kiyosaki: "Los ricos no trabajan por dinero..."'
// DESPUÉS:
'"Los ricos no trabajan por dinero, hacen que el dinero trabaje para ellos"'
```

Quitar el prefijo "Kiyosaki:" — la cita se mantiene como sabiduría financiera general sin atribuir como si fuera consejo del autor.

### 2. `src/hooks/data/useDebtClassification.ts` — Igual

```
// ANTES:
'Kiyosaki: "La deuda mala te hace más pobre..."'
// DESPUÉS:
'"La deuda mala te hace más pobre, la buena te hace más rico"'
```

### 3. `src/components/net-worth/AssetDialog.tsx` — Reformular tip

```
// ANTES:
'Robert Kiyosaki dice: "Un activo pone dinero en tu bolsillo..."'
// DESPUÉS:
'Principio clave: "Un activo pone dinero en tu bolsillo, un pasivo saca dinero." Tu auto personal saca dinero cada mes.'
```

### 4. `src/components/UpgradePrompt.tsx` — Despersonalizar copy de venta

```
// ANTES: 'Principios Kiyosaki', 'Metas Tracy'
// DESPUÉS: 'Principios de libertad financiera', 'Metodología de metas SMART'

// ANTES: 'Los principios de Kiyosaki, Tracy y los grandes han transformado...'
// DESPUÉS: 'Los principios de finanzas personales han transformado millones de vidas...'
```

### 5. `src/components/landing/FAQSection.tsx` — Despersonalizar descripciones

```
// ANTES: 'principios de Kiyosaki, hábitos de James Clear, metas de Brian Tracy'
// DESPUÉS: 'principios de libertad financiera, hábitos inteligentes, metas SMART'
```

### 6. `src/components/ui/info-tooltip.tsx` — Despersonalizar

```
// ANTES: 'Aprende de los mejores: Kiyosaki, Brian Tracy, Jim Rohn'
// DESPUÉS: 'Aprende de los mejores: hábitos, estrategias y bienestar financiero'
```

### 7. `src/components/gamification/StreakCounter.tsx` — Quitar nombres de autores

Las citas motivacionales en el streak counter no están en contexto educativo. Cambiar atribuciones a genérico o quitar el campo author de las que no son universalmente conocidas.

## Lo que NO se toca (ya está bien)

- `MentorshipLevelBanner` — contexto educativo explícito, tiene disclaimer
- `mentor-quotes.ts` — catálogo educativo interno
- `CashflowQuadrantCard` / `DebtClassificationCard` / `FinancialFreedomCard` — badges con tooltip "No afiliado" + `LegalDisclaimer`
- `FinancialEducationResources` — referencias bibliográficas legítimas
- Página `/legal` — Fair Use bien explicado
- `WeeklyChallengesCard` — dentro de mentoría

## Archivos a modificar (7)

1. `src/hooks/data/useCashflowQuadrant.ts` — Quitar prefijo "Kiyosaki:"
2. `src/hooks/data/useDebtClassification.ts` — Quitar prefijo "Kiyosaki:"
3. `src/components/net-worth/AssetDialog.tsx` — Reformular tip
4. `src/components/UpgradePrompt.tsx` — Despersonalizar copy de venta
5. `src/components/landing/FAQSection.tsx` — Despersonalizar descripciones
6. `src/components/ui/info-tooltip.tsx` — Despersonalizar tooltip
7. `src/components/gamification/StreakCounter.tsx` — Quitar nombres de autores

