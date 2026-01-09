import { Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEntity } from '@/contexts/EntityContext';
import { cn } from '@/lib/utils';

interface EntityViewToggleProps {
  showAllEntities: boolean;
  onToggle: (showAll: boolean) => void;
  className?: string;
}

export function EntityViewToggle({
  showAllEntities,
  onToggle,
  className,
}: EntityViewToggleProps) {
  const { language } = useLanguage();
  const { isMultiEntity, currentEntity, activeEntities } = useEntity();

  // Only show if user has multiple entities
  if (!isMultiEntity) return null;

  const labels = {
    consolidated: language === 'es' ? 'Vista Consolidada' : 'Consolidated View',
    singleEntity: language === 'es' ? 'Vista por Entidad' : 'Entity View',
    consolidatedDesc: language === 'es' 
      ? `Ver datos de todas las ${activeEntities.length} jurisdicciones` 
      : `View data from all ${activeEntities.length} jurisdictions`,
    singleEntityDesc: language === 'es'
      ? `Ver solo ${currentEntity?.name || 'entidad actual'}`
      : `View only ${currentEntity?.name || 'current entity'}`,
  };

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted/50 rounded-lg", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={!showAllEntities ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onToggle(false)}
            className={cn(
              "h-8 px-3 gap-2 transition-all",
              !showAllEntities && "shadow-sm"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">
              {currentEntity?.name || (language === 'es' ? 'Entidad' : 'Entity')}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{labels.singleEntity}</p>
          <p className="text-xs text-muted-foreground">{labels.singleEntityDesc}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showAllEntities ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onToggle(true)}
            className={cn(
              "h-8 px-3 gap-2 transition-all",
              showAllEntities && "shadow-sm"
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">
              {language === 'es' ? 'Todas' : 'All'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{labels.consolidated}</p>
          <p className="text-xs text-muted-foreground">{labels.consolidatedDesc}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
