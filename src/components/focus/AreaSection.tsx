import { ReactNode, memo, useMemo } from 'react';
import { AreaStatsPreview } from './AreaStatsPreview';
import { AreaHealthBadge } from './AreaHealthBadge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FOCUS_AREAS, FocusAreaId } from '@/lib/constants/focus-areas';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AreaSectionProps {
  areaId: FocusAreaId;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: ReactNode;
  className?: string;
}

// Area styling using semantic chart tokens from the design system
const getAreaStyles = (areaId: FocusAreaId) => {
  const styleMap: Record<FocusAreaId, {
    gradientClass: string;
    iconBgClass: string;
    accentClass: string;
    borderActiveClass: string;
  }> = {
    negocio: {
      gradientClass: 'from-[hsl(var(--chart-1)/0.15)] via-[hsl(var(--chart-1)/0.05)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-1))]',
      accentClass: 'text-[hsl(var(--chart-1))]',
      borderActiveClass: 'border-[hsl(var(--chart-1)/0.4)]',
    },
    familia: {
      gradientClass: 'from-[hsl(var(--chart-2)/0.15)] via-[hsl(var(--chart-2)/0.05)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-2))]',
      accentClass: 'text-[hsl(var(--chart-2))]',
      borderActiveClass: 'border-[hsl(var(--chart-2)/0.4)]',
    },
    diadia: {
      gradientClass: 'from-[hsl(var(--chart-3)/0.15)] via-[hsl(var(--chart-3)/0.05)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-3))]',
      accentClass: 'text-[hsl(var(--chart-3))]',
      borderActiveClass: 'border-[hsl(var(--chart-3)/0.4)]',
    },
    crecimiento: {
      gradientClass: 'from-[hsl(var(--chart-4)/0.15)] via-[hsl(var(--chart-4)/0.05)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-4))]',
      accentClass: 'text-[hsl(var(--chart-4))]',
      borderActiveClass: 'border-[hsl(var(--chart-4)/0.4)]',
    },
    impuestos: {
      gradientClass: 'from-[hsl(var(--chart-5)/0.15)] via-[hsl(var(--chart-5)/0.05)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-5))]',
      accentClass: 'text-[hsl(var(--chart-5))]',
      borderActiveClass: 'border-[hsl(var(--chart-5)/0.4)]',
    },
  };
  return styleMap[areaId];
};

export const AreaSection = memo(({ 
  areaId, 
  isCollapsed, 
  onToggleCollapse, 
  children,
  className 
}: AreaSectionProps) => {
  const { language } = useLanguage();
  const area = FOCUS_AREAS[areaId];
  const styles = useMemo(() => getAreaStyles(areaId), [areaId]);

  if (!area) return null;

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse()}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card 
          className={cn(
            "border transition-all duration-300 overflow-hidden relative",
            !isCollapsed && "shadow-lg",
            !isCollapsed && styles.borderActiveClass,
            isCollapsed && "border-border/60 hover:shadow-sm",
            className
          )}
        >
          {/* Subtle gradient background */}
          {!isCollapsed && (
            <div 
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
                styles.gradientClass
              )}
            />
          )}
          
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 transition-all duration-200 py-3.5 px-4 sm:px-6 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Emoji icon */}
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl shadow-md text-white shrink-0",
                      styles.iconBgClass
                    )}
                  >
                    <span>{area.emoji}</span>
                  </motion.div>
                  
                  <div className="min-w-0">
                    <h3 className={cn("font-bold text-base sm:text-lg leading-tight", styles.accentClass)}>
                      {area.name[language as 'es' | 'en'] || area.name.es}
                    </h3>
                    {isCollapsed ? (
                      <div className="mt-0.5">
                        <AreaStatsPreview areaId={areaId} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                        {area.description[language as 'es' | 'en'] || area.description.es}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <AreaHealthBadge areaId={areaId} />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-8 w-8 p-0 rounded-full transition-colors",
                      !isCollapsed && "bg-muted/50"
                    )}
                  >
                    <motion.div
                      animate={{ rotate: isCollapsed ? 0 : 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </motion.div>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <AnimatePresence>
            {!isCollapsed && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 pb-5 px-4 sm:px-6 relative z-10">
                    {/* Thin accent divider */}
                    <div className={cn("h-0.5 w-full rounded-full mb-5 opacity-60", styles.iconBgClass)} />
                    {children}
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </Collapsible>
  );
});

AreaSection.displayName = 'AreaSection';
