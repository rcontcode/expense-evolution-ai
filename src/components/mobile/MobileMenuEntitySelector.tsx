import { ChevronRight, Globe2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalEntities } from '@/hooks/data/useFiscalEntities';
import { Skeleton } from '@/components/ui/skeleton';

const countryFlags: Record<string, string> = {
  CA: '🇨🇦',
  CL: '🇨🇱',
  US: '🇺🇸',
  MX: '🇲🇽',
  ES: '🇪🇸',
  AR: '🇦🇷',
  CO: '🇨🇴',
  PE: '🇵🇪',
  BR: '🇧🇷',
};

const entityTypeLabels: Record<string, { es: string; en: string }> = {
  personal: { es: 'Personal', en: 'Personal' },
  freelancer: { es: 'Freelancer', en: 'Freelancer' },
  business: { es: 'Negocio', en: 'Business' },
  corporation: { es: 'Corporación', en: 'Corporation' },
};

interface MobileMenuEntitySelectorProps {
  onNavigate?: () => void;
}

export function MobileMenuEntitySelector({ onNavigate }: MobileMenuEntitySelectorProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: entities, isLoading } = useFiscalEntities();

  const primaryEntity = entities?.find(e => e.is_primary);

  const handleClick = () => {
    navigate('/settings');
    onNavigate?.();
  };

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-xl" />;
  }

  // No entities - show setup prompt
  if (!entities || entities.length === 0) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3",
          "bg-muted/50 hover:bg-muted rounded-xl",
          "border-2 border-dashed border-primary/30 hover:border-primary/50",
          "transition-all duration-200 min-h-[52px]",
          "active:scale-[0.98]"
        )}
      >
        <span className="text-2xl">🌍</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-muted-foreground">
            {language === 'es' ? 'Configurar Jurisdicción' : 'Set Up Jurisdiction'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    );
  }

  const entityTypeLabel = primaryEntity 
    ? entityTypeLabels[primaryEntity.entity_type]?.[language] || primaryEntity.entity_type
    : '';

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "bg-muted/50 hover:bg-muted rounded-xl",
        "border border-border/50",
        "transition-all duration-200 min-h-[52px]",
        "active:scale-[0.98]"
      )}
    >
      <span className="text-2xl">
        {primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}
      </span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold truncate">
          {primaryEntity?.name || (language === 'es' ? 'Sin configurar' : 'Not configured')}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {entityTypeLabel}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </button>
  );
}
