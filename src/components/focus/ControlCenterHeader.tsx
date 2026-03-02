import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings2, HelpCircle, ChevronsUpDown, Maximize2, Minimize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { BundleActiveBadge } from '@/components/ecosystem/BundleActiveBadge';
import { Badge } from '@/components/ui/badge';

interface ControlCenterHeaderProps {
  showGuide: boolean;
  onToggleGuide: () => void;
  allCollapsed: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenSettings: () => void;
  expandedCount: number;
  totalCount: number;
}

export const ControlCenterHeader = memo(({
  showGuide,
  onToggleGuide,
  allCollapsed,
  onExpandAll,
  onCollapseAll,
  onOpenSettings,
  expandedCount,
  totalCount,
}: ControlCenterHeaderProps) => {
  const { language } = useLanguage();
  const es = language === 'es';

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap">
          <span>🎛️</span>
          <span>{es ? 'Centro de Control' : 'Control Center'}</span>
          <BundleActiveBadge variant="compact" />
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
            {expandedCount}/{totalCount} {es ? 'abiertas' : 'open'}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {es ? 'Clic en cada área para expandir o colapsar' : 'Click each area to expand or collapse'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleGuide}
                aria-label={es ? 'Mostrar guía' : 'Show guide'}
                aria-pressed={showGuide}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {es ? 'Mostrar/ocultar guía' : 'Show/hide guide'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={allCollapsed ? onExpandAll : onCollapseAll}
                aria-label={allCollapsed 
                  ? (es ? 'Expandir todo' : 'Expand all')
                  : (es ? 'Colapsar todo' : 'Collapse all')
                }
              >
                {allCollapsed ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {allCollapsed 
                ? (es ? 'Expandir todas' : 'Expand all')
                : (es ? 'Colapsar todas' : 'Collapse all')
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onOpenSettings}>
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {es ? 'Áreas' : 'Areas'}
          </span>
        </Button>
      </div>
    </div>
  );
});

ControlCenterHeader.displayName = 'ControlCenterHeader';
