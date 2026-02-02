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

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
        "bg-muted/50 hover:bg-muted border border-border/30",
        "transition-colors active:scale-[0.98]"
      )}
    >
      <span className="text-sm">
        {primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}
      </span>
      <span className="flex-1 text-left text-[11px] font-medium truncate">
        {primaryEntity?.name || (language === 'es' ? 'Sin configurar' : 'Not set')}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
