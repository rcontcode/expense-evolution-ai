 import { ReactNode, memo, useMemo } from 'react';
 import { AreaStatsPreview } from './AreaStatsPreview';
 import { AreaHealthBadge } from './AreaHealthBadge';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
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
  }> = {
    negocio: {
      gradientClass: 'from-[hsl(var(--chart-1)/0.2)] via-[hsl(var(--chart-1)/0.1)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-1))]',
      accentClass: 'text-[hsl(var(--chart-1))]',
    },
    familia: {
      gradientClass: 'from-[hsl(var(--chart-2)/0.2)] via-[hsl(var(--chart-2)/0.1)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-2))]',
      accentClass: 'text-[hsl(var(--chart-2))]',
    },
    diadia: {
      gradientClass: 'from-[hsl(var(--chart-3)/0.2)] via-[hsl(var(--chart-3)/0.1)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-3))]',
      accentClass: 'text-[hsl(var(--chart-3))]',
    },
    crecimiento: {
      gradientClass: 'from-[hsl(var(--chart-4)/0.2)] via-[hsl(var(--chart-4)/0.1)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-4))]',
      accentClass: 'text-[hsl(var(--chart-4))]',
    },
    impuestos: {
      gradientClass: 'from-[hsl(var(--chart-5)/0.2)] via-[hsl(var(--chart-5)/0.1)] to-transparent',
      iconBgClass: 'bg-[hsl(var(--chart-5))]',
      accentClass: 'text-[hsl(var(--chart-5))]',
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={cn(
            "border-2 transition-all duration-300 overflow-hidden relative",
            !isCollapsed && "shadow-lg shadow-primary/20",
            isCollapsed && "hover:shadow-md",
            className
          )}
          style={{ 
            borderColor: area.borderColor,
          }}
        >
          {/* Gradient background overlay */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none",
              styles.gradientClass
            )}
          />
          
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-all duration-200 py-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Animated emoji container with gradient background */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg text-white",
                      styles.iconBgClass
                    )}
                  >
                    <span className="drop-shadow-md">{area.emoji}</span>
                  </motion.div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 
                        className={cn(
                          "font-bold text-xl drop-shadow-sm",
                          styles.accentClass
                        )}
                      >
                        {area.name[language as 'es' | 'en'] || area.name.es}
                      </h3>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn("p-1 rounded-full", styles.iconBgClass)}
                        >
                          <Sparkles className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                     <p className="text-sm text-muted-foreground hidden sm:block">
                       {area.description[language as 'es' | 'en'] || area.description.es}
                     </p>
                     {/* Show stats preview when collapsed */}
                     {isCollapsed && (
                       <div className="mt-1">
                         <AreaStatsPreview areaId={areaId} />
                       </div>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <AreaHealthBadge areaId={areaId} />
                   <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-10 w-10 p-0 rounded-full",
                      !isCollapsed && styles.iconBgClass,
                      !isCollapsed && "text-white shadow-md"
                    )}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                     </Button>
                   </motion.div>
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
                  <CardContent className="pt-2 pb-6 relative z-10">
                    {/* Decorative top border */}
                    <div 
                      className={cn(
                        "h-1 w-full rounded-full mb-6",
                        styles.iconBgClass
                      )}
                    />
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
