 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import {
   Target,
   TrendingUp,
   TrendingDown,
   Sparkles,
   ChevronRight,
   CheckCircle2,
   AlertTriangle,
   PiggyBank,
   Wallet,
   Plus,
   Lightbulb,
   ArrowUpRight
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useCategoryBudgets, useUpsertCategoryBudget } from '@/hooks/data/useCategoryBudgets';
 import { useUserSettings, UserPreferences, useUpdateUserPreferences } from '@/hooks/data/useUserSettings';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { useBudgetSuggestions, getCategorySuggestion } from '@/hooks/data/useBudgetSuggestions';
 import { useBankInsights } from '@/hooks/data/useBankAnalysis';
 import { CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
 import { EXPENSE_CATEGORIES, getCategoryLabel, ExpenseCategory } from '@/lib/constants/expense-categories';
 import { startOfMonth, endOfMonth, format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 import { Link } from 'react-router-dom';
 
 export function SmartBudgetIntegration() {
   const { language } = useLanguage();
   const { data: budgets, isLoading } = useCategoryBudgets();
   const { data: settings } = useUserSettings();
   const upsertBudget = useUpsertCategoryBudget();
   const updatePreferences = useUpdateUserPreferences();
   const budgetSuggestions = useBudgetSuggestions();
   const bankInsights = useBankInsights();
 
   const now = new Date();
   const monthStart = startOfMonth(now);
   const monthEnd = endOfMonth(now);
 
   const { data: expenses } = useExpenses({
     dateRange: { start: monthStart, end: monthEnd },
   });
 
   const preferences = (settings?.preferences as UserPreferences) || {};
   const globalBudget = preferences.global_monthly_budget || 0;
 
   // Calculate spending by category
   const spendingByCategory: Record<string, number> = {};
   expenses?.forEach((expense) => {
     if (expense.category) {
       spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + Number(expense.amount);
     }
   });
 
   // Find categories without budgets but with spending
   const categoriesNeedingBudget = Object.entries(spendingByCategory)
     .filter(([cat]) => !budgets?.some(b => b.category === cat))
     .map(([category, spent]) => ({
       category,
       spent,
       suggestion: getCategorySuggestion(budgetSuggestions, category)
     }))
     .sort((a, b) => b.spent - a.spent)
     .slice(0, 3);
 
   // Quick apply suggestion
   const handleQuickApply = (category: string, amount: number) => {
     upsertBudget.mutate({ category, monthly_budget: amount });
   };
 
   // Auto-create global budget
   const handleAutoGlobalBudget = () => {
     if (budgetSuggestions.globalSuggestion > 0) {
       updatePreferences.mutate({
         global_monthly_budget: budgetSuggestions.globalSuggestion,
         global_budget_alert_threshold: 80
       });
       toast.success(language === 'es' 
         ? `Presupuesto de $${budgetSuggestions.globalSuggestion} configurado`
         : `Budget of $${budgetSuggestions.globalSuggestion} set`
       );
     }
   };
 
   const l = language === 'es';
 
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5" />
       
       <CardHeader className="pb-2 relative">
         <CardTitle className="flex items-center justify-between text-base">
           <div className="flex items-center gap-3">
             <motion.div
               whileHover={{ scale: 1.1, rotate: 5 }}
               className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center shadow-lg shadow-chart-3/25"
             >
               <Target className="h-5 w-5 text-white" />
             </motion.div>
             <div>
               <span className="font-bold">{l ? 'Control de Presupuesto' : 'Budget Control'}</span>
               <p className="text-xs text-muted-foreground font-normal">
                 {l ? 'Integrado con tu análisis bancario' : 'Integrated with your bank analysis'}
               </p>
             </div>
           </div>
           <Link to="/budget">
             <Button size="sm" variant="outline">
               {l ? 'Ver todo' : 'View all'}
               <ChevronRight className="h-3 w-3 ml-1" />
             </Button>
           </Link>
         </CardTitle>
       </CardHeader>
 
       <CardContent className="space-y-4 relative">
         {/* Quick global budget setup */}
         {globalBudget === 0 && budgetSuggestions.globalSuggestion > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5"
           >
             <div className="flex items-start gap-3">
               <div className="p-2 rounded-lg bg-primary/10">
                 <Sparkles className="h-4 w-4 text-primary" />
               </div>
               <div className="flex-1">
                 <p className="font-medium text-sm">
                   {l ? '✨ Presupuesto sugerido basado en tu historial' : '✨ Suggested budget based on your history'}
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   {l 
                     ? `Basado en tu promedio de $${budgetSuggestions.globalAverage.toFixed(0)}/mes, te sugerimos $${budgetSuggestions.globalSuggestion.toFixed(0)}/mes (+10% de margen)`
                     : `Based on your average of $${budgetSuggestions.globalAverage.toFixed(0)}/mo, we suggest $${budgetSuggestions.globalSuggestion.toFixed(0)}/mo (+10% buffer)`}
                 </p>
               </div>
               <Button
                 size="sm"
                 onClick={handleAutoGlobalBudget}
                 className="bg-gradient-to-r from-primary to-chart-2"
               >
                 <CheckCircle2 className="h-4 w-4 mr-1" />
                 {l ? 'Aplicar' : 'Apply'}
               </Button>
             </div>
           </motion.div>
         )}
 
         {/* Categories needing budget */}
         {categoriesNeedingBudget.length > 0 && (
           <div className="space-y-2">
             <p className="text-sm font-medium flex items-center gap-2">
               <Lightbulb className="h-4 w-4 text-chart-1" />
               {l ? 'Categorías sin presupuesto' : 'Categories without budget'}
             </p>
             <div className="grid gap-2">
               {categoriesNeedingBudget.map((item, idx) => (
                 <motion.div
                   key={item.category}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border hover:border-primary/30 transition-colors"
                 >
                   <div className="flex-1">
                     <div className="flex items-center gap-2">
                       <span className="font-medium text-sm">
                         {getCategoryLabel(item.category as ExpenseCategory)}
                       </span>
                       <Badge variant="secondary" className="text-xs">
                         ${item.spent.toFixed(0)} {l ? 'gastado' : 'spent'}
                       </Badge>
                     </div>
                     {item.suggestion && item.suggestion.suggestedBudget > 0 && (
                       <p className="text-xs text-muted-foreground mt-0.5">
                         {l ? 'Sugerido:' : 'Suggested:'} ${item.suggestion.suggestedBudget}
                       </p>
                     )}
                   </div>
                   {item.suggestion && item.suggestion.suggestedBudget > 0 && (
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => handleQuickApply(item.category, item.suggestion!.suggestedBudget)}
                       disabled={upsertBudget.isPending}
                     >
                       <Plus className="h-3 w-3 mr-1" />
                       {l ? 'Agregar' : 'Add'}
                     </Button>
                   )}
                 </motion.div>
               ))}
             </div>
           </div>
         )}
 
         {/* Existing budgets summary */}
         {budgets && budgets.length > 0 && (
           <div className="space-y-2">
             <p className="text-sm font-medium">{l ? 'Tus presupuestos activos' : 'Your active budgets'}</p>
             <div className="grid gap-2">
               {budgets.slice(0, 3).map((budget, idx) => {
                 const spent = spendingByCategory[budget.category] || 0;
                 const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
                 const isOver = percentage >= 100;
                 const isWarning = percentage >= 80;
 
                 return (
                   <div key={budget.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                     <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-sm font-medium">
                           {getCategoryLabel(budget.category as ExpenseCategory)}
                         </span>
                         <span className={cn(
                           'text-xs font-medium',
                           isOver ? 'text-destructive' : isWarning ? 'text-chart-5' : 'text-chart-4'
                         )}>
                           {percentage.toFixed(0)}%
                         </span>
                       </div>
                       <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                     </div>
                   </div>
                 );
               })}
             </div>
             {budgets.length > 3 && (
               <Link to="/budget">
                 <Button variant="ghost" size="sm" className="w-full">
                   {l ? `Ver ${budgets.length - 3} más` : `View ${budgets.length - 3} more`}
                   <ArrowUpRight className="h-3 w-3 ml-1" />
                 </Button>
               </Link>
             )}
           </div>
         )}
 
         {/* Empty state */}
         {(!budgets || budgets.length === 0) && categoriesNeedingBudget.length === 0 && globalBudget === 0 && (
           <div className="text-center py-6">
             <motion.div
               animate={{ y: [0, -5, 0] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-chart-3/20 to-chart-4/20 flex items-center justify-center"
             >
               <PiggyBank className="h-8 w-8 text-chart-3" />
             </motion.div>
             <p className="text-sm text-muted-foreground">
               {l 
                 ? 'Importa transacciones para recibir sugerencias de presupuesto'
                 : 'Import transactions to get budget suggestions'}
             </p>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }