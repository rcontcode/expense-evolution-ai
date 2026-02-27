

## Plan: Optimizar rendimiento del Dashboard

### Problema principal detectado

`MobileDashboard.tsx` renderiza 12 widgets del ecosistema **sin** el `EcosystemContext.Provider`. Estos widgets usan `useEcosystemData()` que devuelve el contexto vacio por defecto (data: null, isLoading: false). Esto significa que:
1. Los widgets que dependen del contexto reciben datos nulos y no renderizan nada util
2. Widgets como `EcosystemLeaderboard`, `EcosystemPredictiveAlerts` y `EcosystemAICoaching` hacen sus propias queries individuales al montarse
3. Todos se montan simultaneamente al cargar el dashboard, bloqueando el hilo principal

### Cambios propuestos

#### 1. Envolver los widgets del ecosistema con el Provider en MobileDashboard
- Importar `useEcosystemDashboard` y `EcosystemContext` en `MobileDashboard.tsx`
- Envolver los 12 widgets del ecosistema con `<EcosystemContext.Provider>` para que usen la unica llamada consolidada al edge function

#### 2. Lazy load de widgets del ecosistema (below the fold)
- Crear un componente `EcosystemDashboardWidgets` que agrupe los 12 widgets
- Cargarlo con `lazy()` + `Suspense` ya que estan debajo del fold y el usuario no los ve inmediatamente

#### 3. Aumentar staleTime del dashboard stats
- Cambiar `staleTime` de `useDashboardStats` de 30s a 5 minutos (300000ms) para consistencia con el estandar global de cache

#### 4. Reducir queries duplicadas en feature flags
- `useFeatureFlags` se llama dentro de cada uno de los 12 widgets individualmente; mover la verificacion de bundle al nivel del wrapper para evitar 12 llamadas redundantes a `feature_flags` y `user_subscriptions`

### Archivos a editar
- `src/components/dashboard/MobileDashboard.tsx` -- wrapper con Provider + lazy loading
- `src/hooks/data/useDashboardStats.ts` -- aumentar staleTime

