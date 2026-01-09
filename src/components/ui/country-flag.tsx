import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  code: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  xs: { classes: 'h-3 w-4', pixels: { w: 20, h: 15 } },
  sm: { classes: 'h-4 w-6', pixels: { w: 24, h: 18 } },
  md: { classes: 'h-5 w-8', pixels: { w: 32, h: 24 } },
  lg: { classes: 'h-7 w-10', pixels: { w: 40, h: 30 } },
  xl: { classes: 'h-8 w-12', pixels: { w: 48, h: 36 } },
};

// Fallback colors for each country
const countryColors: Record<string, { primary: string; secondary: string; tertiary?: string }> = {
  CA: { primary: '#FF0000', secondary: '#FFFFFF' },
  CL: { primary: '#0039A6', secondary: '#FFFFFF', tertiary: '#D52B1E' },
  US: { primary: '#3C3B6E', secondary: '#FFFFFF', tertiary: '#B22234' },
  MX: { primary: '#006847', secondary: '#FFFFFF', tertiary: '#CE1126' },
};

export function CountryFlag({ code, size = 'md', className }: CountryFlagProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const config = sizeConfig[size];
  const colors = countryColors[code.toUpperCase()] || { primary: '#6B7280', secondary: '#E5E7EB' };
  const countryCode = code.toLowerCase();

  // If image failed to load, show CSS fallback
  if (imageError) {
    return (
      <div 
        className={cn(
          config.classes,
          'rounded-sm border border-border/50 flex items-center justify-center overflow-hidden',
          className
        )}
        style={{
          background: colors.tertiary
            ? `linear-gradient(to bottom, ${colors.secondary} 0%, ${colors.secondary} 50%, ${colors.tertiary} 50%, ${colors.tertiary} 100%)`
            : `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} 33%, ${colors.secondary} 33%, ${colors.secondary} 66%, ${colors.primary} 66%, ${colors.primary} 100%)`
        }}
        title={code.toUpperCase()}
      >
        {code === 'CL' && (
          <div 
            className="absolute left-0 top-0 w-1/3 h-1/2 flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <span className="text-white text-[6px]">★</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', config.classes, className)}>
      {/* Placeholder while loading */}
      {!imageLoaded && (
        <div 
          className={cn(
            'absolute inset-0 rounded-sm border border-border/30 animate-pulse',
            'bg-gradient-to-r from-muted via-muted-foreground/10 to-muted'
          )}
        />
      )}
      
      {/* Actual flag image */}
      <img 
        src={`https://flagcdn.com/w${config.pixels.w}/${countryCode}.png`}
        srcSet={`https://flagcdn.com/w${config.pixels.w * 2}/${countryCode}.png 2x`}
        alt={`${code.toUpperCase()} flag`}
        className={cn(
          config.classes,
          'rounded-sm border border-border/30 object-cover shadow-sm',
          !imageLoaded && 'opacity-0',
          imageLoaded && 'opacity-100 transition-opacity duration-200'
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="eager"
      />
    </div>
  );
}
