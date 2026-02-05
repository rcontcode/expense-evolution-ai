 import { memo } from 'react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Settings2, Sparkles } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { motion } from 'framer-motion';
 
 interface EmptyAreaStateProps {
   onOpenSettings: () => void;
 }
 
 export const EmptyAreaState = memo(({ onOpenSettings }: EmptyAreaStateProps) => {
   const { language } = useLanguage();
 
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ duration: 0.3 }}
     >
       <Card className="border-dashed border-2 border-muted-foreground/20">
         <CardContent className="py-12 text-center">
           <motion.div 
             className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4"
             animate={{ rotate: [0, 5, -5, 0] }}
             transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
           >
             <Settings2 className="h-8 w-8 text-primary" />
           </motion.div>
           <h3 className="font-semibold text-lg mb-2">
             {language === 'es' ? 'No hay áreas seleccionadas' : 'No areas selected'}
           </h3>
           <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
             {language === 'es' 
               ? 'Personaliza tu centro de control eligiendo las áreas que más te interesan para tener todo a la vista'
               : 'Customize your control center by choosing the areas that interest you most to have everything at a glance'}
           </p>
           <Button onClick={onOpenSettings} className="gap-2">
             <Sparkles className="h-4 w-4" />
             {language === 'es' ? 'Elegir Áreas' : 'Choose Areas'}
           </Button>
         </CardContent>
       </Card>
     </motion.div>
   );
 });
 
 EmptyAreaState.displayName = 'EmptyAreaState';