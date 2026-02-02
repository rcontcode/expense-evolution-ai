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
    return <Skeleton className="h-8 w-full rounded-md" />;
  }

  // No entities - show setup prompt
  if (!entities || entities.length === 0) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
          "bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30",
          "transition-colors active:scale-[0.98]"
        )}
      >
        <span className="text-sm">🌍</span>
        <span className="flex-1 text-left text-[11px] font-medium text-primary">
          {language === 'es' ? 'Configurar jurisdicción' : 'Set up jurisdiction'}
        </span>
        <ChevronRight className="h-3 w-3 text-primary" />
      </button>
    );
  }

  const entityType = primaryEntity?.entity_type;
  const typeLabel = entityType ? entityTypeLabels[entityType]?.[language] : null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg",
        "bg-gradient-to-r from-muted/80 to-muted/40 hover:from-muted hover:to-muted/60",
        "border border-border/40 shadow-sm",
        "transition-all active:scale-[0.98]"
      )}
    >
      <span className="text-lg">
        {primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}
      </span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-semibold truncate">
          {primaryEntity?.name || (language === 'es' ? 'Sin configurar' : 'Not set')}
        </p>
        {typeLabel && (
          <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
