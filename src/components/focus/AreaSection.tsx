import { ReactNode, memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FOCUS_AREAS, FocusAreaId } from '@/lib/constants/focus-areas';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AreaSectionProps {
  areaId: FocusAreaId;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: ReactNode;
  className?: string;
}

export const AreaSection = memo(({ 
  areaId, 
  isCollapsed, 
  onToggleCollapse, 
  children,
  className 
}: AreaSectionProps) => {
  const { language } = useLanguage();
  const area = FOCUS_AREAS[areaId];

  if (!area) return null;

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse()}>
      <Card 
        className={cn(
          "border-2 transition-all duration-200",
          className
        )}
        style={{ 
          borderColor: area.borderColor,
          backgroundColor: isCollapsed ? area.bgColor : undefined
        }}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{area.emoji}</span>
                <div>
                  <h3 
                    className="font-semibold text-lg"
                    style={{ color: area.color }}
                  >
                    {area.name[language as 'es' | 'en'] || area.name.es}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {area.description[language as 'es' | 'en'] || area.description.es}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

AreaSection.displayName = 'AreaSection';
