 import { memo } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Lightbulb, Keyboard } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { motion } from 'framer-motion';
 
 export const ContextualGuide = memo(() => {
   const { language } = useLanguage();
 
   const tips = language === 'es' ? [
     { icon: '👆', text: 'Haz clic en el encabezado de cada área para expandir o colapsar' },
     { icon: '⚙️', text: 'Usa "Elegir Áreas" para personalizar qué secciones ver' },
     { icon: '⚡', text: 'Las áreas colapsadas no cargan contenido, mejorando el rendimiento' },
   ] : [
     { icon: '👆', text: 'Click on each area header to expand or collapse' },
     { icon: '⚙️', text: 'Use "Choose Areas" to customize which sections to see' },
     { icon: '⚡', text: 'Collapsed areas don\'t load content, improving performance' },
   ];
 
   return (
     <motion.div
       initial={{ opacity: 0, height: 0 }}
       animate={{ opacity: 1, height: 'auto' }}
       exit={{ opacity: 0, height: 0 }}
     >
       <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
         <CardContent className="py-4">
           <div className="flex items-start gap-3">
             <div className="p-2 rounded-lg bg-primary/10">
               <Lightbulb className="h-5 w-5 text-primary" />
             </div>
             <div className="space-y-2 flex-1">
               <h4 className="font-medium flex items-center gap-2">
                 {language === 'es' ? '¿Cómo usar el Centro de Control?' : 'How to use the Control Center?'}
               </h4>
               <ul className="text-sm text-muted-foreground space-y-1">
                 {tips.map((tip, index) => (
                   <li key={index} className="flex items-start gap-2">
                     <span>{tip.icon}</span>
                     <span>{tip.text}</span>
                   </li>
                 ))}
               </ul>
               <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground border-t border-border/50 mt-2">
                 <Keyboard className="h-3 w-3" />
                 <span>
                   {language === 'es' 
                     ? 'Usa Tab para navegar entre áreas' 
                     : 'Use Tab to navigate between areas'}
                 </span>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 });
 
 ContextualGuide.displayName = 'ContextualGuide';