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
    return <Skeleton className="h-10 w-full rounded-lg" />;
  }

  // No entities - show setup prompt
  if (!entities || entities.length === 0) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2",
          "bg-primary/10 hover:bg-primary/20 rounded-lg",
          "border border-dashed border-primary/40",
          "transition-all duration-200",
          "active:scale-[0.98]"
        )}
      >
        <span className="text-lg">🌍</span>
        <span className="flex-1 text-left text-xs font-medium text-primary">
          {language === 'es' ? 'Configurar' : 'Set Up'}
        </span>
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2",
        "bg-gradient-to-r from-primary/5 to-cyan-500/5 hover:from-primary/10 hover:to-cyan-500/10",
        "rounded-lg border border-primary/20",
        "transition-all duration-200",
        "active:scale-[0.98]"
      )}
    >
      <span className="text-lg">
        {primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}
      </span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-semibold truncate">
          {primaryEntity?.name || (language === 'es' ? 'Sin configurar' : 'Not configured')}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
