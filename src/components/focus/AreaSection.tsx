import { ReactNode, memo } from 'react';
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

// Color configurations for each area with vibrant gradients
const AREA_STYLES: Record<FocusAreaId, {
  gradient: string;
  headerGradient: string;
  iconBg: string;
  shadow: string;
  accent: string;
}> = {
  negocio: {
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    headerGradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  familia: {
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    headerGradient: 'from-emerald-600 to-teal-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/20',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  diadia: {
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    headerGradient: 'from-amber-600 to-orange-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/20',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  crecimiento: {
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    headerGradient: 'from-purple-600 to-pink-500',
    iconBg: 'bg-gradient-to-br from-purple-500 to-pink-400',
    shadow: 'shadow-purple-500/20',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  impuestos: {
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    headerGradient: 'from-rose-600 to-red-500',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-400',
    shadow: 'shadow-rose-500/20',
    accent: 'text-rose-600 dark:text-rose-400',
  },
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
  const styles = AREA_STYLES[areaId];

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
            !isCollapsed && `shadow-lg ${styles.shadow}`,
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
              styles.gradient
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
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg",
                      styles.iconBg
                    )}
                  >
                    <span className="drop-shadow-md">{area.emoji}</span>
                  </motion.div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 
                        className={cn(
                          "font-bold text-xl",
                          styles.accent
                        )}
                      >
                        {area.name[language as 'es' | 'en'] || area.name.es}
                      </h3>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn("p-1 rounded-full", styles.iconBg)}
                        >
                          <Sparkles className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {area.description[language as 'es' | 'en'] || area.description.es}
                    </p>
                  </div>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-10 w-10 p-0 rounded-full",
                      !isCollapsed && styles.iconBg,
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
                        "h-1 w-full rounded-full mb-6 bg-gradient-to-r",
                        styles.headerGradient
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
