import { useState } from 'react';
import { Check, ChevronDown, Globe2, Building2, User, Briefcase, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalEntities, useSetPrimaryEntity, type FiscalEntity } from '@/hooks/data/useFiscalEntities';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface EntitySelectorProps {
  collapsed?: boolean;
}

const entityTypeIcons: Record<string, React.ReactNode> = {
  personal: <User className="h-3.5 w-3.5" />,
  freelancer: <Briefcase className="h-3.5 w-3.5" />,
  business: <Building2 className="h-3.5 w-3.5" />,
  corporation: <Building2 className="h-3.5 w-3.5" />,
};

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

export function EntitySelector({ collapsed = false }: EntitySelectorProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: entities, isLoading } = useFiscalEntities();
  const setPrimary = useSetPrimaryEntity();
  const [open, setOpen] = useState(false);

  const primaryEntity = entities?.find(e => e.is_primary);
  const activeEntities = entities?.filter(e => e.is_active !== false) || [];

  const handleSelectEntity = (entity: FiscalEntity) => {
    if (!entity.is_primary) {
      setPrimary.mutate(entity.id);
    }
    setOpen(false);
  };

  const getEntityLabel = (entity: FiscalEntity) => {
    const flag = countryFlags[entity.country] || '🌍';
    return `${flag} ${entity.name}`;
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      personal: { es: 'Personal', en: 'Personal' },
      freelancer: { es: 'Freelancer', en: 'Freelancer' },
      business: { es: 'Negocio', en: 'Business' },
      corporation: { es: 'Corporación', en: 'Corporation' },
    };
    return labels[type]?.[language] || type;
  };

  if (isLoading) {
    return (
      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <Skeleton className={cn("h-10 rounded-lg", collapsed ? "w-10" : "w-full")} />
      </div>
    );
  }

  // Don't show if no entities exist
  if (!entities || entities.length === 0) {
    return (
      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
          className={cn(
            "w-full border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors",
            collapsed && "w-10 h-10 p-0"
          )}
        >
          {collapsed ? (
            <Plus className="h-4 w-4" />
          ) : (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe2 className="h-4 w-4" />
              {language === 'es' ? 'Configurar Jurisdicción' : 'Set Up Jurisdiction'}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // If only one entity, show static display
  if (activeEntities.length === 1 && primaryEntity) {
    return (
      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50",
          collapsed && "w-10 h-10 justify-center p-0"
        )}>
          {collapsed ? (
            <span className="text-base">{countryFlags[primaryEntity.country] || '🌍'}</span>
          ) : (
            <>
              <span className="text-base">{countryFlags[primaryEntity.country] || '🌍'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{primaryEntity.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {getEntityTypeLabel(primaryEntity.entity_type)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("px-2", collapsed && "flex justify-center")}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between border-border/50 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all",
              collapsed && "w-10 h-10 p-0 justify-center"
            )}
          >
            {collapsed ? (
              <span className="text-base">{primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}</span>
            ) : (
              <>
                <span className="flex items-center gap-2 text-xs truncate">
                  <span className="text-base">{primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}</span>
                  <span className="truncate">{primaryEntity?.name || (language === 'es' ? 'Seleccionar' : 'Select')}</span>
                </span>
                <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-64 z-[100]" 
          align={collapsed ? "start" : "center"}
          side={collapsed ? "right" : "bottom"}
        >
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            {language === 'es' ? '🌍 Jurisdicciones Fiscales' : '🌍 Fiscal Jurisdictions'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {activeEntities.map((entity) => (
            <DropdownMenuItem
              key={entity.id}
              onClick={() => handleSelectEntity(entity)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-lg">{countryFlags[entity.country] || '🌍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{entity.name}</span>
                    {entity.is_primary && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                        {language === 'es' ? 'Activa' : 'Active'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getEntityTypeLabel(entity.entity_type)} • {entity.default_currency || 'CAD'}
                  </span>
                </div>
                {entity.is_primary && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
            className="cursor-pointer text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {language === 'es' ? 'Gestionar Jurisdicciones' : 'Manage Jurisdictions'}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
