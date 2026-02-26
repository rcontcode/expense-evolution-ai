

## Plan: Integrar componentes del Ecosistema en el Dashboard de escritorio

### Problema
Los 13 componentes del ecosistema solo están en `MobileDashboard.tsx`. El escritorio (`Dashboard.tsx`) no tiene ninguno. Por eso no ves nada.

### Cambios

**Archivo: `src/pages/Dashboard.tsx`**

1. **Agregar imports** de todos los componentes ecosistema (líneas 1-46):
   - `BundleActiveBadge`, `EcosystemOnboarding`, `EcosystemNotifications`, `EcosystemAICoaching`, `EcosystemCoaching`, `EcosystemPredictiveAlerts`, `EcosystemStreaks`, `EcosystemInlineWidgets`, `EcosystemWeeklyDigest`, `EcosystemHealthScore`, `EcosystemLeaderboard`, `EcosystemAchievements`, `EcosystemMonthlyReport`, `EcosystemInsights`, `EcosystemQuickActions`

2. **Insertar los componentes** después de `<ProgressiveOnboarding />` (aprox. línea 289), antes del timeline. Se colocan en el mismo orden que en móvil:

```text
  <EcosystemOnboarding />
  <BundleActiveBadge variant="full" />

  (después del timeline y month detail, antes del workflow)

  <EcosystemNotifications />
  <EcosystemAICoaching />
  <EcosystemCoaching />
  <EcosystemPredictiveAlerts />
  <EcosystemStreaks />
  <EcosystemInlineWidgets />
  <EcosystemWeeklyDigest />
  <EcosystemHealthScore />
  <EcosystemLeaderboard />
  <EcosystemAchievements />
  <EcosystemMonthlyReport />
  <EcosystemInsights />
  <EcosystemQuickActions />
```

### Resultado esperado
- Con el **Ecosystem Lab activado** (Settings → Administración → Laboratorio Ecosistema → Activar prueba), verás todos los widgets del ecosistema en el dashboard de escritorio
- Con el Lab **desactivado**, no se ve nada (cada componente retorna `null` si no hay acceso)
- Después de verlo, decides si lo apagas con el flag `ecosystem_enabled` o lo dejas

### No se toca
- Ningún componente ecosistema se modifica
- `MobileDashboard.tsx` queda igual
- Lógica de feature flags y admin preview queda igual

