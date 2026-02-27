

## Evo App Switcher — Implementado

### Archivos creados
- `src/lib/ecosystem/app-switcher-spec.ts` — Spec compartible con URLs, metadata y UTM params
- `src/components/ecosystem/EcoAppSwitcher.tsx` — Componente visual con dos cards lado a lado

### Archivos modificados
- `src/components/ecosystem/EcosystemSection.tsx` — AppSwitcher reemplaza QuickActions como primer elemento

### Para Fokuspark
Copiar ambos archivos nuevos a Fokuspark y usar `<EcoAppSwitcher currentApp="fokuspark" />`. El componente invierte automáticamente cuál app es "activa" y cuál es el link de salida.
