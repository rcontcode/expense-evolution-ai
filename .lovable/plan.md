
# Plan: Corregir Botón "Obtener Premium" → "Obtener Pro" para Usuarios Premium

## Problema Identificado

Cuando un usuario tiene plan **Premium**, el botón de checkout dice "Obtener Premium" en lugar de "Obtener Pro". Esto es confuso porque:

1. El usuario **ya tiene** Premium
2. La única opción de upgrade visible es **Pro**
3. Pero el botón sigue mostrando el texto incorrecto

## Causa Técnica

En `src/components/settings/SubscriptionManager.tsx`:

- **Línea 84:** El estado `selectedPlan` siempre se inicializa como `'premium'` 
- **Líneas 229-230:** El filtro de tarjetas funciona correctamente (solo muestra Pro para usuarios Premium)
- **Líneas 297-298:** El botón usa `planConfig[selectedPlan].name` - que sigue siendo "Premium" aunque la tarjeta visible sea Pro

## Solución

Modificar la inicialización del estado `selectedPlan` para que sea dinámico basado en el plan actual del usuario:

```text
Antes:  useState<'premium' | 'pro'>('premium')
Después: useState<'premium' | 'pro'>(planType === 'premium' ? 'pro' : 'premium')
```

Además, añadir un `useEffect` para actualizar el estado si `planType` cambia después del montaje inicial (por ejemplo, después de refrescar la suscripción).

## Cambios Específicos

| Archivo | Cambio |
|---------|--------|
| `src/components/settings/SubscriptionManager.tsx` | Inicializar `selectedPlan` dinámicamente + agregar `useEffect` de sincronización |

## Resultado Esperado

- Usuario **Free** → Ve ambas cards → Botón dice "Obtener Premium" o "Obtener Pro" según selección
- Usuario **Premium** → Ve solo card Pro → Botón dice "Obtener Pro"
- Usuario **Pro** → No ve sección de upgrade (ya funciona)
