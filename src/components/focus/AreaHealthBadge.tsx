 import { memo } from 'react';
 import { FocusAreaId } from '@/lib/constants/focus-areas';
 import { Badge } from '@/components/ui/badge';
 import { AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useLanguage } from '@/contexts/LanguageContext';
 
 interface AreaHealthBadgeProps {
   areaId: FocusAreaId;
   alertCount?: number;
   hasUpdates?: boolean;
 }
 
 // Badge showing health/status of each area
 export const AreaHealthBadge = memo(({ areaId, alertCount = 0, hasUpdates = false }: AreaHealthBadgeProps) => {
   const { language } = useLanguage();
 
   if (alertCount > 0) {
     return (
       <Badge 
         variant="destructive" 
         className="text-xs gap-1 animate-pulse"
       >
         <AlertTriangle className="h-3 w-3" />
         {alertCount}
       </Badge>
     );
   }
 
 if (hasUpdates) {
     return (
       <Badge 
         variant="secondary" 
         className="text-xs gap-1 bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]"
       >
         <Sparkles className="h-3 w-3" />
         {language === 'es' ? 'Nuevo' : 'New'}
       </Badge>
     );
   }
 
   return null;
 });
 
 AreaHealthBadge.displayName = 'AreaHealthBadge';