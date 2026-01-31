import { ReactNode } from 'react';
import { useCountryContext } from '@/hooks/utils/useCountryContext';
import type { CountryCode } from '@/lib/constants/country-tax-config';

interface CountryContentProps {
  /** Content to show for Canada */
  CA?: ReactNode;
  /** Content to show for Chile */
  CL?: ReactNode;
  /** Content to show for any country (fallback) */
  children?: ReactNode;
  /** If true, shows content for ALL active countries, not just current */
  showAll?: boolean;
}

/**
 * Component that renders country-specific content based on current context.
 * 
 * Usage:
 * ```tsx
 * <CountryContent
 *   CA={<CanadaTaxInfo />}
 *   CL={<ChileTaxInfo />}
 * />
 * ```
 * 
 * With showAll, it renders content for all active countries:
 * ```tsx
 * <CountryContent showAll CA={<CAInfo />} CL={<CLInfo />} />
 * ```
 */
export function CountryContent({ 
  CA, 
  CL, 
  children, 
  showAll = false 
}: CountryContentProps) {
  const { currentCountry, activeCountries } = useCountryContext();

  if (showAll) {
    return (
      <>
        {activeCountries.includes('CA') && CA}
        {activeCountries.includes('CL') && CL}
        {children}
      </>
    );
  }

  // Show content for current country only
  if (currentCountry === 'CA' && CA) return <>{CA}</>;
  if (currentCountry === 'CL' && CL) return <>{CL}</>;
  
  return <>{children}</>;
}

interface CountryOnlyProps {
  /** Only show for these countries */
  countries: CountryCode[];
  /** Content to render */
  children: ReactNode;
  /** If true, check any active country, not just current */
  checkAny?: boolean;
}

/**
 * Only renders children if user is in one of the specified countries.
 * 
 * Usage:
 * ```tsx
 * <CountryOnly countries={['CL']}>
 *   <ChileSpecificFeature />
 * </CountryOnly>
 * ```
 */
export function CountryOnly({ 
  countries, 
  children, 
  checkAny = false 
}: CountryOnlyProps) {
  const { currentCountry, activeCountries } = useCountryContext();

  if (checkAny) {
    const hasMatch = countries.some(c => activeCountries.includes(c));
    if (!hasMatch) return null;
  } else {
    if (!countries.includes(currentCountry)) return null;
  }

  return <>{children}</>;
}

interface CountryBadgeContentProps {
  /** Content for each country as badges */
  content: Partial<Record<CountryCode, string>>;
  /** Badge variant */
  variant?: 'default' | 'outline' | 'secondary';
  /** Custom class name */
  className?: string;
}

/**
 * Displays country-specific badges for all active countries.
 * Useful for showing combined info like "CRA + SII compliance"
 */
export function CountryBadgeContent({ 
  content, 
  variant = 'outline',
  className 
}: CountryBadgeContentProps) {
  const { activeCountries } = useCountryContext();

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {activeCountries.map(country => {
        const text = content[country];
        if (!text) return null;
        
        return (
          <span 
            key={country}
            className={`inline-flex items-center px-2 py-1 text-xs rounded-md
              ${variant === 'default' ? 'bg-primary text-primary-foreground' : ''}
              ${variant === 'outline' ? 'border border-input bg-background' : ''}
              ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : ''}
            `}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
