import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  code: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  xs: { classes: 'h-3 w-4', pixels: 16 },
  sm: { classes: 'h-4 w-6', pixels: 24 },
  md: { classes: 'h-5 w-8', pixels: 32 },
  lg: { classes: 'h-7 w-10', pixels: 40 },
  xl: { classes: 'h-8 w-12', pixels: 48 },
};

// Fallback with actual flag colors for CSS rendering
const countryFallbacks: Record<string, { bg: string; content: React.ReactNode }> = {
  CA: { 
    bg: 'linear-gradient(to right, #ff0000 0%, #ff0000 25%, #ffffff 25%, #ffffff 75%, #ff0000 75%, #ff0000 100%)',
    content: <span className="text-red-600 text-xs font-bold">🍁</span>
  },
  CL: { 
    bg: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #d52b1e 50%, #d52b1e 100%)',
    content: <div className="absolute left-0 top-0 w-[35%] h-1/2 bg-[#0039a6] flex items-center justify-center"><span className="text-white text-[8px]">★</span></div>
  },
  US: { 
    bg: 'repeating-linear-gradient(to bottom, #b22234 0px, #b22234 3px, #ffffff 3px, #ffffff 6px)',
    content: <div className="absolute left-0 top-0 w-2/5 h-[54%] bg-[#3c3b6e]" />
  },
  MX: { 
    bg: 'linear-gradient(to right, #006847 0%, #006847 33%, #ffffff 33%, #ffffff 66%, #ce1126 66%, #ce1126 100%)',
    content: null
  },
};

export function CountryFlag({ code, size = 'md', className }: CountryFlagProps) {
  const [imageError, setImageError] = useState(false);
  
  const config = sizeConfig[size];
  const countryCode = code.toLowerCase();
  const fallback = countryFallbacks[code.toUpperCase()];

  // If image failed to load, show CSS fallback
  if (imageError && fallback) {
    return (
      <div 
        className={cn(
          config.classes,
          'rounded-sm border border-border/50 overflow-hidden relative',
          className
        )}
        style={{ background: fallback.bg }}
        title={code.toUpperCase()}
      >
        {fallback.content}
      </div>
    );
  }

  // Simple fallback for unknown countries
  if (imageError) {
    return (
      <div 
        className={cn(
          config.classes,
          'rounded-sm border border-border/50 bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground',
          className
        )}
        title={code.toUpperCase()}
      >
        {code.toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={`https://flagcdn.com/${countryCode}.svg`}
      alt={`${code.toUpperCase()} flag`}
      className={cn(
        config.classes,
        'rounded-sm border border-border/30 object-cover shadow-sm',
        className
      )}
      onError={() => setImageError(true)}
      loading="eager"
    />
  );
}
