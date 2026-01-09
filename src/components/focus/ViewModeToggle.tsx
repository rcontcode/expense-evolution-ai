import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/lib/constants/focus-areas';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, setViewMode }: ViewModeToggleProps) => {
  const { language } = useLanguage();

  const isClassic = viewMode === 'classic';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 gap-2",
                isClassic && "bg-background shadow-sm"
              )}
              onClick={() => setViewMode('classic')}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">
                {language === 'es' ? 'Clásica' : 'Classic'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {language === 'es' ? 'Vista con tabs horizontales' : 'Horizontal tabs view'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 gap-2",
                !isClassic && "bg-background shadow-sm"
              )}
              onClick={() => setViewMode('organized')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">
                {language === 'es' ? 'Organizada' : 'Organized'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {language === 'es' ? 'Vista por áreas temáticas' : 'Thematic areas view'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
