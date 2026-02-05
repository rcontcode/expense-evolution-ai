 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import {
   Upload,
   TrendingUp,
   PiggyBank,
   AlertTriangle,
   Sparkles,
   ChevronRight,
   CheckCircle2,
   Target,
   Lightbulb,
   ArrowRight,
   FileSpreadsheet,
   Camera,
   Shield,
   Zap
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useBankTransactions } from '@/hooks/data/useBankTransactions';
 import { useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
 import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 
 interface BankingWelcomeExperienceProps {
   onImportClick: () => void;
   onSetupBudget?: () => void;
 }
 
 export function BankingWelcomeExperience({ onImportClick, onSetupBudget }: BankingWelcomeExperienceProps) {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: transactions } = useBankTransactions();
   const { data: budgets } = useCategoryBudgets();
   const { data: settings } = useUserSettings();
   const [dismissed, setDismissed] = useState(false);
 
   const preferences = (settings?.preferences as UserPreferences) || {};
   const hasGlobalBudget = (preferences.global_monthly_budget || 0) > 0;
   const hasCategoryBudgets = (budgets?.length || 0) > 0;
   const hasTransactions = (transactions?.length || 0) > 0;
 
   const userName = profile?.full_name?.split(' ')[0] || '';
 
   // Calculate setup progress
   const steps = [
     { done: hasTransactions, label: { es: 'Importar transacciones', en: 'Import transactions' } },
     { done: hasGlobalBudget, label: { es: 'Definir presupuesto global', en: 'Set global budget' } },
     { done: hasCategoryBudgets, label: { es: 'Crear metas por categoría', en: 'Create category budgets' } },
   ];
 
   const completedSteps = steps.filter(s => s.done).length;
   const progressPercent = (completedSteps / steps.length) * 100;
 
   // If everything is set up and user dismissed, don't show
   if (dismissed && completedSteps === steps.length) return null;
 
   // If nothing set up, show full onboarding
   if (!hasTransactions) {
     return (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
       >
         <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
           {/* Animated background elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-chart-2/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
           
           <CardHeader className="pb-4 relative">
             <div className="flex items-start justify-between">
               <div>
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 0.2, type: 'spring' }}
                   className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mb-4 shadow-lg shadow-primary/25"
                 >
                   <Sparkles className="h-7 w-7 text-white" />
                 </motion.div>
                 <CardTitle className="text-2xl">
                   {userName ? (
                     language === 'es' 
                       ? `¡Hola ${userName}! Transforma tu relación con el dinero` 
                       : `Hi ${userName}! Transform your relationship with money`
                   ) : (
                     language === 'es' 
                       ? '¡Transforma tu relación con el dinero!' 
                       : 'Transform your relationship with money!'
                   )}
                 </CardTitle>
                 <CardDescription className="text-base mt-2 max-w-xl">
                   {language === 'es'
                     ? 'Importa tus estados de cuenta y descubre hacia dónde va cada peso. Te ayudaremos a identificar oportunidades de ahorro, gastos hormiga y patrones que afectan tu economía.'
                     : 'Import your bank statements and discover where every dollar goes. We\'ll help you identify savings opportunities, hidden fees, and patterns affecting your finances.'}
                 </CardDescription>
               </div>
             </div>
           </CardHeader>
 
           <CardContent className="space-y-6 relative">
             {/* Value propositions */}
             <div className="grid gap-3 md:grid-cols-3">
               {[
                 {
                   icon: AlertTriangle,
                   title: { es: 'Detecta cobros sospechosos', en: 'Detect suspicious charges' },
                   desc: { es: 'Alertas de duplicados y aumentos', en: 'Duplicate and increase alerts' },
                   color: 'text-amber-500 bg-amber-500/10'
                 },
                 {
                   icon: Target,
                   title: { es: 'Controla tu presupuesto', en: 'Control your budget' },
                   desc: { es: 'Metas automáticas inteligentes', en: 'Smart automatic goals' },
                   color: 'text-emerald-500 bg-emerald-500/10'
                 },
                 {
                   icon: Lightbulb,
                   title: { es: 'Recibe consejos personalizados', en: 'Get personalized advice' },
                   desc: { es: 'Basados en tus hábitos reales', en: 'Based on your real habits' },
                   color: 'text-primary bg-primary/10'
                 }
               ].map((item, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 + idx * 0.1 }}
                   className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border"
                 >
                   <div className={cn('p-2 rounded-lg', item.color)}>
                     <item.icon className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="font-medium text-sm">
                       {language === 'es' ? item.title.es : item.title.en}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {language === 'es' ? item.desc.es : item.desc.en}
                     </p>
                   </div>
                 </motion.div>
               ))}
             </div>
 
             {/* Import options */}
             <div className="grid gap-3 md:grid-cols-3">
               {[
                 { icon: FileSpreadsheet, label: 'CSV', color: 'text-green-600 bg-green-500/10' },
                 { icon: Camera, label: language === 'es' ? 'Foto' : 'Photo', color: 'text-blue-600 bg-blue-500/10' },
                 { icon: Upload, label: 'PDF', color: 'text-red-600 bg-red-500/10' }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
                   <div className={cn('p-1.5 rounded-md', item.color)}>
                     <item.icon className="h-4 w-4" />
                   </div>
                   <span className="text-sm font-medium">{item.label}</span>
                 </div>
               ))}
             </div>
 
             {/* CTA */}
             <div className="flex flex-col sm:flex-row gap-3 items-center">
               <motion.div
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="w-full sm:w-auto"
               >
                 <Button
                   size="lg"
                   onClick={onImportClick}
                   className="w-full sm:w-auto bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white shadow-lg shadow-primary/25"
                 >
                   <Upload className="h-5 w-5 mr-2" />
                   {language === 'es' ? 'Importar Mi Estado de Cuenta' : 'Import My Bank Statement'}
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </motion.div>
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Shield className="h-4 w-4 text-green-600" />
                 {language === 'es' ? 'Datos 100% privados y seguros' : '100% private and secure data'}
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     );
   }
 
   // Has transactions but missing budgets - show setup progress
   if (!hasGlobalBudget || !hasCategoryBudgets) {
     return (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
       >
         <Card className="border-chart-3/20 bg-gradient-to-r from-chart-3/5 to-transparent">
           <CardContent className="py-4">
             <div className="flex flex-col md:flex-row md:items-center gap-4">
               <div className="flex items-center gap-3 flex-1">
                 <motion.div
                   animate={{ rotate: [0, 10, -10, 0] }}
                   transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                   className="p-2 rounded-xl bg-chart-3/10"
                 >
                   <Zap className="h-5 w-5 text-chart-3" />
                 </motion.div>
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <p className="font-semibold text-sm">
                       {language === 'es' ? '¡Casi listo! Configura tus metas' : 'Almost there! Set up your goals'}
                     </p>
                     <Badge variant="secondary" className="text-xs">
                       {completedSteps}/{steps.length}
                     </Badge>
                   </div>
                   <Progress value={progressPercent} className="h-2" />
                   <div className="flex gap-4 mt-2">
                     {steps.map((step, idx) => (
                       <div key={idx} className="flex items-center gap-1 text-xs">
                         {step.done ? (
                           <CheckCircle2 className="h-3 w-3 text-green-500" />
                         ) : (
                           <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                         )}
                         <span className={step.done ? 'text-muted-foreground line-through' : ''}>
                           {language === 'es' ? step.label.es : step.label.en}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
               <div className="flex gap-2">
                 {!hasGlobalBudget && onSetupBudget && (
                   <Button size="sm" onClick={onSetupBudget} variant="outline">
                     <Target className="h-4 w-4 mr-2" />
                     {language === 'es' ? 'Configurar Presupuesto' : 'Set Up Budget'}
                   </Button>
                 )}
                 <Button size="sm" onClick={() => setDismissed(true)} variant="ghost">
                   {language === 'es' ? 'Después' : 'Later'}
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     );
   }
 
   return null;
 }