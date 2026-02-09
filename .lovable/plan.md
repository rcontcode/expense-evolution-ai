

# Plan: Corregir Error de Clave Duplicada en `user_financial_profile`

## Problema Identificado

Al completar el onboarding, aparece el error:
```
duplicate key value violates unique constraint "user_financial_profile_user_id_key"
```

**Causa raíz:** El hook `useUpsertFinancialProfile` usa el método `upsert()` de Supabase pero **no especifica la columna de conflicto** (`onConflict`). Cuando el usuario ya tiene un perfil financiero existente, Supabase intenta hacer un INSERT en lugar de UPDATE, violando la restricción única en `user_id`.

## Comparativa de Código

**Codigo problemático** (`useFinancialProfile.ts`):
```typescript
.upsert({ 
  ...profile, 
  user_id: user!.id,
  updated_at: new Date().toISOString()
})
// ❌ Falta: { onConflict: 'user_id' }
```

**Código correcto** (`useLifeProfile.ts` - `useMarkSectionComplete`):
```typescript
.upsert({
  user_id: user.id,
  sections_completed: newSections,
}, { onConflict: 'user_id' })
// ✅ Especifica la columna de conflicto
```

## Solución

Modificar `useUpsertFinancialProfile` para especificar `onConflict: 'user_id'`:

```typescript
const { data, error } = await supabase
  .from('user_financial_profile')
  .upsert({ 
    ...profile, 
    user_id: user!.id,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })  // ← AGREGAR ESTO
  .select()
  .single();
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/data/useFinancialProfile.ts` | Agregar `{ onConflict: 'user_id' }` al método `upsert()` |

---

## Detalles Técnicos

El método `upsert` de Supabase tiene esta firma:
```typescript
.upsert(data, { onConflict: 'column_name' })
```

Cuando `onConflict` no está especificado, Supabase usa la clave primaria (`id`) por defecto. Pero dado que el onboarding no conoce el `id` del perfil existente (solo conoce el `user_id`), necesitamos decirle a Supabase que use `user_id` como criterio para detectar conflictos y hacer UPDATE en lugar de INSERT.

