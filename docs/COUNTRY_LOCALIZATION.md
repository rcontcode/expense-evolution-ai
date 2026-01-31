# Sistema de Localización por País

## Arquitectura

EvoFinz soporta múltiples jurisdicciones fiscales (actualmente Canadá y Chile). Este documento describe cómo funciona el sistema de localización por país.

## Conceptos Clave

### 1. Entidades Fiscales (`fiscal_entities`)
Cada usuario puede tener una o más entidades fiscales, cada una asociada a un país específico:
- Una persona con negocio en Chile
- Una corporación en Canadá
- Ambas simultáneamente

### 2. EntityContext
El contexto central que provee:
- `currentEntity`: La entidad actualmente seleccionada
- `currentCountry`: El país de la entidad actual
- `activeCountries`: Lista de países únicos del usuario
- `isMultiCountry`: Si el usuario opera en múltiples países

### 3. useCountryContext Hook
Hook especializado para contenido específico por país:
```typescript
const { 
  currentCountry,      // 'CA' | 'CL'
  isMultiCountry,      // true si tiene entidades en ambos países
  countryConfig,       // Configuración completa del país
  taxAuthority,        // 'CRA' o 'SII'
  primaryCurrency,     // 'CAD' o 'CLP'
} = useCountryContext();
```

## Componentes

### CountrySelector
Selector de país que solo aparece cuando el usuario tiene entidades en múltiples países:
```tsx
<CountrySelector
  value={selectedCountry}
  onChange={setSelectedCountry}
  variant="select" | "badge" | "dialog"
/>
```

### CountryContent
Renderiza contenido diferente según el país:
```tsx
<CountryContent
  CA={<CanadianTaxInfo />}
  CL={<ChileanTaxInfo />}
/>
```

### CountryOnly
Solo renderiza si el usuario está en el país especificado:
```tsx
<CountryOnly countries={['CL']}>
  <ChileOnlyFeature />
</CountryOnly>
```

## Hooks Disponibles

### useCountryText
Para obtener texto localizado por país:
```typescript
const { getText, getTooltip } = useCountryText();
const label = getText(TAX_AUTHORITY_LABELS); // "CRA" o "SII"
```

### useCountryPlaceholders
Para placeholders y ejemplos específicos del país:
```typescript
const { 
  taxIdPlaceholder,  // "123456789" o "12.345.678-9"
  taxIdLabel,        // "Business Number" o "RUT"
  currencySymbol,    // "$"
} = useCountryPlaceholders();
```

## Contenido Predefinido

En `src/lib/country-content.ts` hay contenido común:
- `TAX_AUTHORITY_LABELS`: Nombres de autoridades fiscales
- `TAX_ID_LABELS`: Etiquetas de ID fiscal
- `REGION_LABELS`: Provincia vs Región
- `SALES_TAX_LABELS`: GST/HST vs IVA
- `TAX_DISCLAIMERS`: Disclaimers legales por país

## Flujo de Decisión

```
┌─────────────────────────────────────────────────────────┐
│                    Usuario ingresa                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  ¿Tiene entidades fiscales? │
              └─────────────────────────────┘
                     │           │
                    Sí           No
                     │           │
                     ▼           ▼
         ┌───────────────┐    Usar país
         │ ¿Multi-país?  │    del perfil
         └───────────────┘    (fallback: CA)
              │       │
             Sí       No
              │       │
              ▼       ▼
    Mostrar selector    Usar país de
    de país en UI       entidad única
```

## Agregar Nuevos Países

1. **Agregar código de país** en `CountryCode` type
2. **Agregar configuración** en `country-tax-config.ts`:
   - Regiones
   - Brackets de impuestos
   - Reglas de deducción
   - Fechas límite
3. **Agregar contenido** en `country-content.ts`
4. **Actualizar componentes** que usan `CountryContent`

Ejemplo para agregar México:
```typescript
// En country-tax-config.ts
export type CountryCode = 'CA' | 'CL' | 'MX';

export const MEXICO_CONFIG: CountryConfig = {
  code: 'MX',
  name: { es: 'México', en: 'Mexico' },
  currency: 'MXN',
  taxAuthority: { name: 'SAT', website: 'https://www.sat.gob.mx' },
  // ... resto de configuración
};

// En country-content.ts
export const TAX_AUTHORITY_LABELS: CountryLocalizedText = {
  CA: { es: '...', en: '...' },
  CL: { es: '...', en: '...' },
  MX: { es: 'Servicio de Administración Tributaria (SAT)', en: 'Tax Administration Service (SAT)' },
};
```
