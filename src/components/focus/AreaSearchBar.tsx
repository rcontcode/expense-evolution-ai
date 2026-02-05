 import { memo, useState, useCallback } from 'react';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Search, X } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { cn } from '@/lib/utils';
 import { motion, AnimatePresence } from 'framer-motion';
 
 interface AreaSearchBarProps {
   value: string;
   onChange: (value: string) => void;
   className?: string;
 }
 
 export const AreaSearchBar = memo(({ value, onChange, className }: AreaSearchBarProps) => {
   const { language } = useLanguage();
   const [isExpanded, setIsExpanded] = useState(false);
 
   const handleClear = useCallback(() => {
     onChange('');
     setIsExpanded(false);
   }, [onChange]);
 
   return (
     <div className={cn("flex items-center gap-2", className)}>
       <AnimatePresence mode="wait">
         {isExpanded ? (
           <motion.div
             initial={{ width: 0, opacity: 0 }}
             animate={{ width: 200, opacity: 1 }}
             exit={{ width: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="relative"
           >
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               type="text"
               placeholder={language === 'es' ? 'Buscar en áreas...' : 'Search in areas...'}
               value={value}
               onChange={(e) => onChange(e.target.value)}
               className="pl-8 pr-8 h-8 text-sm"
               autoFocus
             />
             {value && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="absolute right-0 top-0 h-8 w-8 p-0"
                 onClick={handleClear}
               >
                 <X className="h-3 w-3" />
               </Button>
             )}
           </motion.div>
         ) : (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           >
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setIsExpanded(true)}
               className="h-8 w-8 p-0"
             >
               <Search className="h-4 w-4" />
             </Button>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   );
 });
 
 AreaSearchBar.displayName = 'AreaSearchBar';