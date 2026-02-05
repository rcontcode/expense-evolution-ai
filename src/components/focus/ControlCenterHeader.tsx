 import { memo } from 'react';
 import { Button } from '@/components/ui/button';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { Settings2, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 
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
 
   return (
     <div className="flex items-center justify-between">
       <div>
         <h2 className="text-xl font-semibold flex items-center gap-2">
           {language === 'es' ? '🎛️ Centro de Control por Áreas' : '🎛️ Control Center by Areas'}
         </h2>
         <p className="text-sm text-muted-foreground">
           {language === 'es'
             ? `${expandedCount}/${totalCount} áreas expandidas • Haz clic para colapsar/expandir`
             : `${expandedCount}/${totalCount} areas expanded • Click to collapse/expand`}
         </p>
       </div>
       <div className="flex items-center gap-2">
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={onToggleGuide}
                 aria-label={language === 'es' ? 'Mostrar guía' : 'Show guide'}
                 aria-pressed={showGuide}
               >
                 <HelpCircle className="h-4 w-4" />
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               {language === 'es' ? 'Mostrar/ocultar guía' : 'Show/hide guide'}
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
 
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={allCollapsed ? onExpandAll : onCollapseAll}
                 aria-label={allCollapsed 
                   ? (language === 'es' ? 'Expandir todo' : 'Expand all')
                   : (language === 'es' ? 'Colapsar todo' : 'Collapse all')
                 }
               >
                 {allCollapsed ? (
                   <ChevronDown className="h-4 w-4" />
                 ) : (
                   <ChevronUp className="h-4 w-4" />
                 )}
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               {allCollapsed 
                 ? (language === 'es' ? 'Expandir todo' : 'Expand all')
                 : (language === 'es' ? 'Colapsar todo' : 'Collapse all')
               }
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
 
         <Button variant="outline" size="sm" onClick={onOpenSettings}>
           <Settings2 className="h-4 w-4 mr-2" />
           <span className="hidden sm:inline">
             {language === 'es' ? 'Elegir Áreas' : 'Choose Areas'}
           </span>
         </Button>
       </div>
     </div>
   );
 });
 
 ControlCenterHeader.displayName = 'ControlCenterHeader';