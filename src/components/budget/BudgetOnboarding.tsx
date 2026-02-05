 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import {
   Sparkles,
   Target,
   Wallet,
   PiggyBank,
   ArrowRight,
   Check,
   Lightbulb,
   TrendingUp,
   Gift,
   Rocket
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useBudgetSuggestions } from '@/hooks/data/useBudgetSuggestions';
 import { useUpdateUserPreferences, UserPreferences, useUserSettings } from '@/hooks/data/useUserSettings';
 import { useUpsertCategoryBudget, useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
 import { getCategoryLabel, ExpenseCategory } from '@/lib/constants/expense-categories';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 
 interface OnboardingStep {
   id: string;
   title: { es: string; en: string };
   description: { es: string; en: string };
   icon: React.ElementType;
 }
 
 const STEPS: OnboardingStep[] = [
   {
     id: 'welcome',
     title: { es: '¡Bienvenido al Control de Presupuesto!', en: 'Welcome to Budget Control!' },
     description: { es: 'En 2 minutos configuraremos tu sistema personalizado', en: 'In 2 minutes we\'ll set up your personalized system' },
     icon: Sparkles,
   },
   {
     id: 'global',
     title: { es: 'Tu Presupuesto Global', en: 'Your Global Budget' },
     description: { es: '¿Cuánto quieres gastar al mes?', en: 'How much do you want to spend per month?' },
     icon: Wallet,
   },
   {
     id: 'categories',
     title: { es: 'Metas por Categoría', en: 'Category Goals' },
     description: { es: 'Te sugerimos límites basados en tu historial', en: 'We suggest limits based on your history' },
     icon: Target,
   },
   {
     id: 'complete',
     title: { es: '¡Listo para empezar!', en: 'Ready to go!' },
     description: { es: 'Tu sistema de presupuesto está configurado', en: 'Your budget system is set up' },
     icon: Rocket,
   },
 ];
 
 export function BudgetOnboarding({ onComplete }: { onComplete: () => void }) {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: settings } = useUserSettings();
   const { data: existingBudgets } = useCategoryBudgets();
   const budgetSuggestions = useBudgetSuggestions();
   const updatePreferences = useUpdateUserPreferences();
   const upsertBudget = useUpsertCategoryBudget();
 
   const [currentStep, setCurrentStep] = useState(0);
   const [globalBudget, setGlobalBudget] = useState('');
   const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
 
   const preferences = (settings?.preferences as UserPreferences) || {};
   const userName = profile?.full_name?.split(' ')[0] || '';
   const l = language === 'es';
 
   // Get top spending categories from suggestions
   const topCategories = Object.entries(budgetSuggestions.categorySuggestions)
     .sort((a, b) => b[1].averageSpent - a[1].averageSpent)
     .slice(0, 6);
 
   const handleSetGlobalBudget = () => {
     const amount = parseFloat(globalBudget);
     if (amount > 0) {
       updatePreferences.mutate({
         global_monthly_budget: amount,
         global_budget_alert_threshold: 80,
       });
     }
     setCurrentStep(2);
   };
 
   const handleApplySuggestion = () => {
     if (budgetSuggestions.globalSuggestion > 0) {
       setGlobalBudget(budgetSuggestions.globalSuggestion.toString());
       toast.success(l 
         ? `Sugerido: $${budgetSuggestions.globalSuggestion.toFixed(0)}/mes`
         : `Suggested: $${budgetSuggestions.globalSuggestion.toFixed(0)}/mo`
       );
     }
   };
 
   const handleToggleCategory = (category: string) => {
     const newSelected = new Set(selectedCategories);
     if (newSelected.has(category)) {
       newSelected.delete(category);
     } else {
       newSelected.add(category);
     }
     setSelectedCategories(newSelected);
   };
 
   const handleApplyCategories = async () => {
     for (const category of selectedCategories) {
       const suggestion = budgetSuggestions.categorySuggestions[category];
       if (suggestion) {
         upsertBudget.mutate({
           category,
           monthly_budget: suggestion.suggestedBudget,
         });
       }
     }
     setCurrentStep(3);
   };
 
   const handleComplete = () => {
     toast.success(l 
       ? '¡Tu sistema de presupuesto está listo!'
       : 'Your budget system is ready!'
     );
     onComplete();
   };
 
   const step = STEPS[currentStep];
   const StepIcon = step.icon;
 
   return (
     <Card className="relative overflow-hidden border-2 border-primary/30">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-chart-2/10" />
       
       {/* Progress indicator */}
       <div className="relative flex gap-1 p-4 pb-0">
         {STEPS.map((_, idx) => (
           <div
             key={idx}
             className={cn(
               "flex-1 h-1.5 rounded-full transition-all",
               idx <= currentStep ? "bg-primary" : "bg-muted"
             )}
           />
         ))}
       </div>
 
       <CardHeader className="relative text-center pb-2">
         <motion.div
           key={step.id}
           initial={{ scale: 0, rotate: -10 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: 'spring', stiffness: 200 }}
           className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-xl shadow-primary/30"
         >
           <StepIcon className="h-8 w-8 text-white" />
         </motion.div>
         <CardTitle className="text-xl">{step.title[language]}</CardTitle>
         <CardDescription>{step.description[language]}</CardDescription>
       </CardHeader>
 
       <CardContent className="relative space-y-6">
         <AnimatePresence mode="wait">
           {/* Step 0: Welcome */}
           {currentStep === 0 && (
             <motion.div
               key="welcome"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-4"
             >
               <div className="p-4 rounded-xl bg-card border-2 border-dashed border-primary/30">
                 <p className="text-center text-muted-foreground">
                   {l 
                     ? `${userName}, vamos a crear un sistema que te ayude a controlar tus gastos de forma inteligente.`
                     : `${userName}, let's create a system that helps you control your spending intelligently.`}
                 </p>
               </div>
 
               <div className="grid grid-cols-3 gap-3">
                 <div className="p-3 rounded-xl bg-primary/10 text-center">
                   <Wallet className="h-6 w-6 mx-auto mb-2 text-primary" />
                   <p className="text-xs font-medium">{l ? 'Presupuesto Global' : 'Global Budget'}</p>
                 </div>
                 <div className="p-3 rounded-xl bg-chart-2/10 text-center">
                   <Target className="h-6 w-6 mx-auto mb-2 text-chart-2" />
                   <p className="text-xs font-medium">{l ? 'Metas por Categoría' : 'Category Goals'}</p>
                 </div>
                 <div className="p-3 rounded-xl bg-chart-4/10 text-center">
                   <TrendingUp className="h-6 w-6 mx-auto mb-2 text-chart-4" />
                   <p className="text-xs font-medium">{l ? 'Alertas Inteligentes' : 'Smart Alerts'}</p>
                 </div>
               </div>
 
               <Button onClick={() => setCurrentStep(1)} className="w-full" size="lg">
                 {l ? 'Comenzar' : 'Get Started'}
                 <ArrowRight className="h-4 w-4 ml-2" />
               </Button>
             </motion.div>
           )}
 
           {/* Step 1: Global Budget */}
           {currentStep === 1 && (
             <motion.div
               key="global"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-4"
             >
               {budgetSuggestions.globalSuggestion > 0 && (
                 <div className="p-4 rounded-xl border-2 border-dashed border-chart-2/50 bg-chart-2/10">
                   <div className="flex items-center gap-3 mb-2">
                     <Lightbulb className="h-5 w-5 text-chart-2" />
                     <span className="font-medium">{l ? 'Sugerencia inteligente' : 'Smart suggestion'}</span>
                   </div>
                   <p className="text-sm text-muted-foreground mb-3">
                     {l 
                       ? `Basado en tu promedio de $${budgetSuggestions.globalAverage.toFixed(0)}/mes, te sugerimos:`
                       : `Based on your average of $${budgetSuggestions.globalAverage.toFixed(0)}/mo, we suggest:`}
                   </p>
                   <div className="flex items-center justify-between">
                     <span className="text-2xl font-bold text-chart-2">
                       ${budgetSuggestions.globalSuggestion.toFixed(0)}/mes
                     </span>
                     <Button variant="outline" size="sm" onClick={handleApplySuggestion}>
                       <Check className="h-4 w-4 mr-1" />
                       {l ? 'Usar' : 'Use'}
                     </Button>
                   </div>
                 </div>
               )}
 
               <div className="space-y-2">
                 <label className="text-sm font-medium">
                   {l ? 'O ingresa tu propio presupuesto:' : 'Or enter your own budget:'}
                 </label>
                 <div className="flex gap-2">
                   <div className="relative flex-1">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                     <Input
                       type="number"
                       value={globalBudget}
                       onChange={(e) => setGlobalBudget(e.target.value)}
                       placeholder="0.00"
                       className="pl-7 text-lg"
                     />
                   </div>
                   <span className="flex items-center text-muted-foreground">/mes</span>
                 </div>
               </div>
 
               <div className="flex gap-2">
                 <Button variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                   {l ? 'Atrás' : 'Back'}
                 </Button>
                 <Button 
                   onClick={handleSetGlobalBudget} 
                   className="flex-1"
                   disabled={!globalBudget || parseFloat(globalBudget) <= 0}
                 >
                   {l ? 'Continuar' : 'Continue'}
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
 
               <Button variant="ghost" onClick={() => setCurrentStep(2)} className="w-full">
                 {l ? 'Omitir por ahora' : 'Skip for now'}
               </Button>
             </motion.div>
           )}
 
           {/* Step 2: Category Budgets */}
           {currentStep === 2 && (
             <motion.div
               key="categories"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-4"
             >
               {topCategories.length > 0 ? (
                 <>
                   <p className="text-sm text-muted-foreground text-center">
                     {l 
                       ? 'Selecciona las categorías que quieres controlar:'
                       : 'Select the categories you want to control:'}
                   </p>
                   <div className="grid grid-cols-2 gap-2">
                     {topCategories.map(([category, data]) => {
                       const isSelected = selectedCategories.has(category);
                       return (
                         <button
                           key={category}
                           onClick={() => handleToggleCategory(category)}
                           className={cn(
                             "p-3 rounded-xl border-2 text-left transition-all",
                             isSelected
                               ? "border-primary bg-primary/10"
                               : "border-border hover:border-primary/50"
                           )}
                         >
                           <div className="flex items-center justify-between mb-1">
                             <span className="font-medium text-sm">
                               {getCategoryLabel(category as ExpenseCategory)}
                             </span>
                             {isSelected && (
                               <Check className="h-4 w-4 text-primary" />
                             )}
                           </div>
                           <p className="text-xs text-muted-foreground">
                             {l ? 'Sugerido:' : 'Suggested:'} ${data.suggestedBudget}
                           </p>
                         </button>
                       );
                     })}
                   </div>
                 </>
               ) : (
                 <div className="text-center py-6">
                   <PiggyBank className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                   <p className="text-sm text-muted-foreground">
                     {l 
                       ? 'Aún no hay suficiente historial para sugerencias. Puedes agregar manualmente después.'
                       : 'Not enough history for suggestions yet. You can add manually later.'}
                   </p>
                 </div>
               )}
 
               <div className="flex gap-2">
                 <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                   {l ? 'Atrás' : 'Back'}
                 </Button>
                 <Button 
                   onClick={handleApplyCategories} 
                   className="flex-1"
                 >
                   {selectedCategories.size > 0 
                     ? `${l ? 'Aplicar' : 'Apply'} (${selectedCategories.size})`
                     : l ? 'Continuar' : 'Continue'}
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </motion.div>
           )}
 
           {/* Step 3: Complete */}
           {currentStep === 3 && (
             <motion.div
               key="complete"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-6"
             >
               <motion.div
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-chart-4 to-emerald-400 flex items-center justify-center shadow-xl shadow-chart-4/40"
               >
                 <Gift className="h-10 w-10 text-white" />
               </motion.div>
 
               <div>
                 <h3 className="text-xl font-bold mb-2">
                   {l ? '¡Felicidades, ' : 'Congratulations, '}{userName}! 🎉
                 </h3>
                 <p className="text-muted-foreground">
                   {l 
                     ? 'Tu sistema de presupuesto está configurado. Ahora recibirás alertas inteligentes cuando te acerques a tus límites.'
                     : 'Your budget system is set up. You\'ll now receive smart alerts when you approach your limits.'}
                 </p>
               </div>
 
               <div className="p-4 rounded-xl bg-chart-4/10 border border-chart-4/30">
                 <p className="text-sm font-medium text-chart-4">
                   {l ? '💡 Consejo Pro:' : '💡 Pro Tip:'}
                 </p>
                 <p className="text-sm text-muted-foreground">
                   {l 
                     ? 'Revisa tus presupuestos cada semana para mantener el control.'
                     : 'Review your budgets weekly to stay in control.'}
                 </p>
               </div>
 
               <Button onClick={handleComplete} className="w-full" size="lg">
                 {l ? 'Ver mi Dashboard' : 'View my Dashboard'}
                 <Rocket className="h-4 w-4 ml-2" />
               </Button>
             </motion.div>
           )}
         </AnimatePresence>
       </CardContent>
     </Card>
   );
 }