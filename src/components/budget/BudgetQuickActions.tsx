 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import {
   Plus,
   Target,
   Sparkles,
   TrendingDown,
   PiggyBank,
   ArrowRight,
   Zap,
   RefreshCw,
   AlertTriangle
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useCategoryBudgets, useUpsertCategoryBudget } from '@/hooks/data/useCategoryBudgets';
 import { useBudgetSuggestions, getCategorySuggestion } from '@/hooks/data/useBudgetSuggestions';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { EXPENSE_CATEGORIES, getCategoryLabel, ExpenseCategory } from '@/lib/constants/expense-categories';
 import { startOfMonth, endOfMonth } from 'date-fns';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 import { Link } from 'react-router-dom';
 
 interface QuickAction {
   id: string;
   icon: React.ElementType;
   title: { es: string; en: string };
   description: { es: string; en: string };
   color: string;
   action: () => void;
   badge?: { es: string; en: string };
 }
 
 export function BudgetQuickActions() {
   const { language } = useLanguage();
   const { data: budgets } = useCategoryBudgets();
   const budgetSuggestions = useBudgetSuggestions();
   const upsertBudget = useUpsertCategoryBudget();
 
   const now = new Date();
   const monthStart = startOfMonth(now);
   const monthEnd = endOfMonth(now);
 
   const { data: expenses } = useExpenses({
     dateRange: { start: monthStart, end: monthEnd },
   });
 
   const l = language === 'es';
 
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
 
   // Find exceeded budgets
   const exceededBudgets = budgets?.filter(b => {
     const spent = spendingByCategory[b.category] || 0;
     return (spent / b.monthly_budget) * 100 >= 100;
   }) || [];
 
   // Auto-apply all suggested budgets
   const handleAutoApplyAll = () => {
     let count = 0;
     categoriesNeedingBudget.forEach(item => {
       if (item.suggestion && item.suggestion.suggestedBudget > 0) {
         upsertBudget.mutate({
           category: item.category,
           monthly_budget: item.suggestion.suggestedBudget,
         });
         count++;
       }
     });
     if (count > 0) {
       toast.success(l 
         ? `${count} presupuestos creados automáticamente`
         : `${count} budgets created automatically`
       );
     }
   };
 
   // Refresh all budgets based on suggestions
   const handleRefreshAll = () => {
     let count = 0;
     budgets?.forEach(budget => {
       const suggestion = getCategorySuggestion(budgetSuggestions, budget.category);
       if (suggestion && suggestion.suggestedBudget > 0) {
         upsertBudget.mutate({
           category: budget.category,
           monthly_budget: suggestion.suggestedBudget,
         });
         count++;
       }
     });
     if (count > 0) {
       toast.success(l 
         ? `${count} presupuestos actualizados`
         : `${count} budgets updated`
       );
     }
   };
 
   // Build quick actions dynamically
   const quickActions: QuickAction[] = [];
 
   if (categoriesNeedingBudget.length > 0) {
     quickActions.push({
       id: 'auto-apply',
       icon: Zap,
       title: { es: 'Auto-crear presupuestos', en: 'Auto-create budgets' },
       description: { 
         es: `${categoriesNeedingBudget.length} categorías sin presupuesto`,
         en: `${categoriesNeedingBudget.length} categories without budget`
       },
       color: 'from-amber-500 to-orange-500',
       action: handleAutoApplyAll,
       badge: { es: 'Sugerido', en: 'Suggested' },
     });
   }
 
   if (budgets && budgets.length > 0) {
     quickActions.push({
       id: 'refresh',
       icon: RefreshCw,
       title: { es: 'Ajustar todos', en: 'Adjust all' },
       description: { 
         es: 'Actualizar según historial reciente',
         en: 'Update based on recent history'
       },
       color: 'from-chart-2 to-chart-3',
       action: handleRefreshAll,
     });
   }
 
   if (exceededBudgets.length > 0) {
     quickActions.push({
       id: 'exceeded',
       icon: AlertTriangle,
       title: { es: 'Revisar excedidos', en: 'Review exceeded' },
       description: { 
         es: `${exceededBudgets.length} presupuesto(s) excedido(s)`,
         en: `${exceededBudgets.length} budget(s) exceeded`
       },
       color: 'from-red-500 to-rose-500',
       action: () => document.querySelector('[data-section="budget-list"]')?.scrollIntoView({ behavior: 'smooth' }),
       badge: { es: 'Urgente', en: 'Urgent' },
     });
   }
 
   if (quickActions.length === 0) {
     return null;
   }
 
   return (
     <div className="grid gap-3 md:grid-cols-3">
       {quickActions.map((action, idx) => {
         const Icon = action.icon;
         return (
           <motion.div
             key={action.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
           >
             <Card
               className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
               onClick={action.action}
             >
               <CardContent className="p-4 relative">
                 <div className={cn(
                   "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                   `bg-gradient-to-br ${action.color}`
                 )} style={{ opacity: 0.05 }} />
                 
                 <div className="flex items-start gap-3 relative">
                   <div className={cn(
                     "p-2 rounded-xl bg-gradient-to-br text-white shadow-lg",
                     action.color
                   )}>
                     <Icon className="h-5 w-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-semibold text-sm truncate">
                         {action.title[language]}
                       </span>
                       {action.badge && (
                         <Badge variant="secondary" className="text-xs flex-shrink-0">
                           {action.badge[language]}
                         </Badge>
                       )}
                     </div>
                     <p className="text-xs text-muted-foreground">
                       {action.description[language]}
                     </p>
                   </div>
                   <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                 </div>
               </CardContent>
             </Card>
           </motion.div>
         );
       })}
     </div>
   );
 }