 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   Wallet,
   Target,
   TrendingUp,
   TrendingDown,
   PiggyBank,
   AlertTriangle,
   CheckCircle2,
   Sparkles,
   ArrowRight,
   Zap,
   Calculator,
   BarChart3,
   Lightbulb,
   Trophy,
   Flame
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
 import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { useIncome } from '@/hooks/data/useIncome';
 import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
 import { useBudgetSuggestions } from '@/hooks/data/useBudgetSuggestions';
 import { startOfMonth, endOfMonth, format, differenceInDays, subMonths } from 'date-fns';
 import { es, enUS } from 'date-fns/locale';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 import { getCategoryLabel, ExpenseCategory } from '@/lib/constants/expense-categories';
 
 interface FinancialHealthScore {
   score: number;
   level: 'excellent' | 'good' | 'fair' | 'needs_work';
   factors: {
     budgetAdherence: number;
     savingsRate: number;
     goalsProgress: number;
     expenseControl: number;
   };
 }
 
 export function BudgetCommandCenter() {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: budgets } = useCategoryBudgets();
   const { data: settings } = useUserSettings();
   const { data: savingsGoals } = useSavingsGoals();
   const budgetSuggestions = useBudgetSuggestions();
 
   const now = new Date();
   const monthStart = startOfMonth(now);
   const monthEnd = endOfMonth(now);
   const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
   const daysPassed = differenceInDays(now, monthStart) + 1;
   const daysRemaining = daysInMonth - daysPassed;
 
   const { data: currentExpenses } = useExpenses({
     dateRange: { start: monthStart, end: monthEnd },
   });
 
   const { data: lastMonthExpenses } = useExpenses({
     dateRange: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
   });
 
   const { data: income } = useIncome({
     year: now.getFullYear(),
     month: now.getMonth() + 1,
   });
 
   const preferences = (settings?.preferences as UserPreferences) || {};
   const globalBudget = preferences.global_monthly_budget || 0;
   const userName = profile?.full_name?.split(' ')[0] || '';
 
   const l = language === 'es';
 
   // Calculate key metrics
   const totalSpent = currentExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
   const lastMonthSpent = lastMonthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
   const totalIncome = income?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
   const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
   const dailyBudget = globalBudget > 0 ? globalBudget / daysInMonth : 0;
   const idealSpentToDate = dailyBudget * daysPassed;
   const spendingPace = idealSpentToDate > 0 ? (totalSpent / idealSpentToDate) * 100 : 0;
   const projectedMonthEnd = (totalSpent / daysPassed) * daysInMonth;
   const monthOverMonth = lastMonthSpent > 0 ? ((totalSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;
 
   // Spending by category
   const spendingByCategory: Record<string, number> = {};
   currentExpenses?.forEach((expense) => {
     if (expense.category) {
       spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + Number(expense.amount);
     }
   });
 
   // Budget health for each category
   const categoryHealth = useMemo(() => {
     if (!budgets) return [];
     return budgets.map(budget => {
       const spent = spendingByCategory[budget.category] || 0;
       const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
       const dailyLimit = budget.monthly_budget / daysInMonth;
       const idealSpent = dailyLimit * daysPassed;
       const pace = idealSpent > 0 ? (spent / idealSpent) * 100 : 0;
       
       return {
         ...budget,
         spent,
         percentage,
         pace,
         remaining: budget.monthly_budget - spent,
         status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good' as const,
       };
     }).sort((a, b) => b.percentage - a.percentage);
   }, [budgets, spendingByCategory, daysInMonth, daysPassed]);
 
   // Calculate financial health score
   const healthScore = useMemo<FinancialHealthScore>(() => {
     let budgetAdherence = 100;
     if (globalBudget > 0) {
       const globalPercentage = (totalSpent / globalBudget) * 100;
       budgetAdherence = Math.max(0, 100 - Math.max(0, globalPercentage - 100));
     }
 
     const savingsScore = Math.min(100, Math.max(0, savingsRate * 5)); // 20% savings = 100 score
 
     let goalsProgress = 0;
     if (savingsGoals && savingsGoals.length > 0) {
       const avgProgress = savingsGoals.reduce((sum, g) => {
         const progress = g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0;
         return sum + Math.min(100, progress);
       }, 0) / savingsGoals.length;
       goalsProgress = avgProgress;
     }
 
     let expenseControl = 100;
     if (lastMonthSpent > 0 && totalSpent > lastMonthSpent) {
       const increase = ((totalSpent - lastMonthSpent) / lastMonthSpent) * 100;
       expenseControl = Math.max(0, 100 - increase);
     }
 
     const totalScore = (budgetAdherence * 0.3) + (savingsScore * 0.3) + (goalsProgress * 0.2) + (expenseControl * 0.2);
 
     let level: FinancialHealthScore['level'] = 'needs_work';
     if (totalScore >= 80) level = 'excellent';
     else if (totalScore >= 60) level = 'good';
     else if (totalScore >= 40) level = 'fair';
 
     return {
       score: Math.round(totalScore),
       level,
       factors: {
         budgetAdherence: Math.round(budgetAdherence),
         savingsRate: Math.round(savingsScore),
         goalsProgress: Math.round(goalsProgress),
         expenseControl: Math.round(expenseControl),
       },
     };
   }, [globalBudget, totalSpent, savingsRate, savingsGoals, lastMonthSpent]);
 
   // Generate smart recommendations
   const recommendations = useMemo(() => {
     const recs: Array<{ icon: React.ElementType; title: string; description: string; priority: 'high' | 'medium' | 'low'; action?: string }> = [];
 
     // No global budget
     if (globalBudget === 0 && budgetSuggestions.globalSuggestion > 0) {
       recs.push({
         icon: Wallet,
         title: l ? 'Establece tu presupuesto global' : 'Set your global budget',
         description: l 
           ? `Basado en tu historial, te sugerimos $${budgetSuggestions.globalSuggestion.toFixed(0)}/mes`
           : `Based on your history, we suggest $${budgetSuggestions.globalSuggestion.toFixed(0)}/mo`,
         priority: 'high',
         action: l ? 'Configurar ahora' : 'Set up now',
       });
     }
 
     // Overspending categories
     const overCategories = categoryHealth.filter(c => c.percentage >= 100);
     if (overCategories.length > 0) {
       recs.push({
         icon: AlertTriangle,
         title: l ? `${overCategories.length} categoría(s) excedida(s)` : `${overCategories.length} category(ies) exceeded`,
         description: l
           ? `${overCategories.map(c => getCategoryLabel(c.category as ExpenseCategory)).join(', ')} necesitan atención`
           : `${overCategories.map(c => getCategoryLabel(c.category as ExpenseCategory)).join(', ')} need attention`,
         priority: 'high',
       });
     }
 
     // Low savings rate
     if (totalIncome > 0 && savingsRate < 10) {
       recs.push({
         icon: PiggyBank,
         title: l ? 'Mejora tu tasa de ahorro' : 'Improve your savings rate',
         description: l
           ? `Tu tasa actual es ${savingsRate.toFixed(1)}%. El objetivo recomendado es 20%+`
           : `Your current rate is ${savingsRate.toFixed(1)}%. Recommended target is 20%+`,
         priority: 'medium',
       });
     }
 
     // No savings goals
     if (!savingsGoals || savingsGoals.length === 0) {
       recs.push({
         icon: Target,
         title: l ? 'Crea una meta de ahorro' : 'Create a savings goal',
         description: l
           ? 'Las metas te ayudan a mantener el enfoque y la motivación'
           : 'Goals help you stay focused and motivated',
         priority: 'medium',
       });
     }
 
     // Spending increasing
     if (monthOverMonth > 20) {
       recs.push({
         icon: TrendingUp,
         title: l ? 'Gasto en aumento' : 'Spending increasing',
         description: l
           ? `Tus gastos subieron ${monthOverMonth.toFixed(0)}% vs. el mes pasado`
           : `Your spending is up ${monthOverMonth.toFixed(0)}% vs. last month`,
         priority: 'medium',
       });
     }
 
     // Positive: good savings rate
     if (savingsRate >= 20) {
       recs.push({
         icon: Trophy,
         title: l ? '¡Excelente tasa de ahorro!' : 'Excellent savings rate!',
         description: l
           ? `Estás ahorrando el ${savingsRate.toFixed(0)}% de tus ingresos. ¡Sigue así!`
           : `You're saving ${savingsRate.toFixed(0)}% of your income. Keep it up!`,
         priority: 'low',
       });
     }
 
     return recs.sort((a, b) => {
       const priority = { high: 0, medium: 1, low: 2 };
       return priority[a.priority] - priority[b.priority];
     });
   }, [globalBudget, budgetSuggestions, categoryHealth, savingsRate, savingsGoals, totalIncome, monthOverMonth, l]);
 
   const getScoreColor = (score: number) => {
     if (score >= 80) return 'from-emerald-500 to-teal-500';
     if (score >= 60) return 'from-chart-2 to-chart-3';
     if (score >= 40) return 'from-amber-500 to-orange-500';
     return 'from-red-500 to-rose-500';
   };
 
   const getLevelLabel = (level: FinancialHealthScore['level']) => {
     const labels = {
       excellent: { es: 'Excelente', en: 'Excellent', emoji: '🏆' },
       good: { es: 'Bien', en: 'Good', emoji: '👍' },
       fair: { es: 'Regular', en: 'Fair', emoji: '📊' },
       needs_work: { es: 'Mejorable', en: 'Needs Work', emoji: '💪' },
     };
     return labels[level];
   };
 
   const formatCurrency = (amount: number) =>
     new Intl.NumberFormat(l ? 'es-CA' : 'en-CA', {
       style: 'currency',
       currency: 'CAD',
       maximumFractionDigits: 0,
     }).format(amount);
 
   return (
     <div className="space-y-6">
       {/* Hero Section - Financial Health Score */}
       <Card className="relative overflow-hidden border-2 border-primary/20">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-chart-3/10" />
         <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
         
         <CardContent className="relative p-6">
           <div className="flex flex-col lg:flex-row gap-6">
             {/* Score Circle */}
             <div className="flex flex-col items-center justify-center">
               <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                 className="relative"
               >
                 <div className={cn(
                   "w-32 h-32 rounded-full flex items-center justify-center",
                   "bg-gradient-to-br shadow-2xl",
                   getScoreColor(healthScore.score)
                 )}>
                   <div className="w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center">
                     <span className="text-3xl font-black">{healthScore.score}</span>
                     <span className="text-xs text-muted-foreground">/100</span>
                   </div>
                 </div>
                 <motion.div
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="absolute -top-1 -right-1"
                 >
                   <Badge className={cn(
                     "px-2 py-1 text-xs font-bold",
                     `bg-gradient-to-r ${getScoreColor(healthScore.score)} text-white border-0`
                   )}>
                     {getLevelLabel(healthScore.level).emoji} {getLevelLabel(healthScore.level)[language]}
                   </Badge>
                 </motion.div>
               </motion.div>
               <p className="text-sm text-muted-foreground mt-3 text-center">
                 {l ? 'Salud Financiera' : 'Financial Health'}
               </p>
             </div>
 
             {/* Greeting and Quick Stats */}
             <div className="flex-1 space-y-4">
               <div>
                 <h2 className="text-2xl font-bold">
                   {l ? `¡Hola, ${userName}!` : `Hi, ${userName}!`} 👋
                 </h2>
                 <p className="text-muted-foreground">
                   {l 
                     ? `Aquí está tu panorama financiero de ${format(now, 'MMMM', { locale: es })}`
                     : `Here's your financial overview for ${format(now, 'MMMM', { locale: enUS })}`}
                 </p>
               </div>
 
               {/* Quick Metrics Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="p-3 rounded-xl bg-card border">
                   <p className="text-xs text-muted-foreground mb-1">{l ? 'Gastado' : 'Spent'}</p>
                   <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
                   {globalBudget > 0 && (
                     <p className="text-xs text-muted-foreground">
                       {l ? 'de' : 'of'} {formatCurrency(globalBudget)}
                     </p>
                   )}
                 </div>
                 <div className="p-3 rounded-xl bg-card border">
                   <p className="text-xs text-muted-foreground mb-1">{l ? 'Ingresos' : 'Income'}</p>
                   <p className="text-lg font-bold text-chart-4">{formatCurrency(totalIncome)}</p>
                 </div>
                 <div className="p-3 rounded-xl bg-card border">
                   <p className="text-xs text-muted-foreground mb-1">{l ? 'Tasa ahorro' : 'Savings Rate'}</p>
                   <p className={cn(
                     "text-lg font-bold",
                     savingsRate >= 20 ? "text-chart-4" : savingsRate >= 10 ? "text-chart-2" : "text-destructive"
                   )}>
                     {savingsRate.toFixed(0)}%
                   </p>
                 </div>
                 <div className="p-3 rounded-xl bg-card border">
                   <p className="text-xs text-muted-foreground mb-1">{l ? 'Días restantes' : 'Days Left'}</p>
                   <p className="text-lg font-bold">{daysRemaining}</p>
                   <p className="text-xs text-muted-foreground">
                     {l ? 'del mes' : 'this month'}
                   </p>
                 </div>
               </div>
 
               {/* Health Factors */}
               <div className="grid grid-cols-4 gap-2">
                 {Object.entries(healthScore.factors).map(([key, value]) => {
                   const labels: Record<string, { es: string; en: string }> = {
                     budgetAdherence: { es: 'Presupuesto', en: 'Budget' },
                     savingsRate: { es: 'Ahorro', en: 'Savings' },
                     goalsProgress: { es: 'Metas', en: 'Goals' },
                     expenseControl: { es: 'Control', en: 'Control' },
                   };
                   return (
                     <div key={key} className="text-center">
                       <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-1">
                         <motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${value}%` }}
                           transition={{ duration: 1, ease: 'easeOut' }}
                           className={cn(
                             "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                             value >= 80 ? 'from-emerald-500 to-teal-500' :
                             value >= 60 ? 'from-chart-2 to-chart-3' :
                             value >= 40 ? 'from-amber-500 to-orange-500' :
                             'from-red-500 to-rose-500'
                           )}
                         />
                       </div>
                       <p className="text-xs text-muted-foreground">{labels[key]?.[language]}</p>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Recommendations Banner */}
       {recommendations.length > 0 && (
         <Card className={cn(
           "border-2",
           recommendations[0].priority === 'high' ? "border-destructive/30 bg-destructive/5" :
           recommendations[0].priority === 'low' ? "border-chart-4/30 bg-chart-4/5" :
           "border-amber-500/30 bg-amber-500/5"
         )}>
           <CardContent className="p-4">
             <div className="flex items-start gap-4">
               <div className={cn(
                 "p-3 rounded-xl",
                 recommendations[0].priority === 'high' ? "bg-destructive/10" :
                 recommendations[0].priority === 'low' ? "bg-chart-4/10" :
                 "bg-amber-500/10"
               )}>
                 {(() => {
                   const Icon = recommendations[0].icon;
                   return <Icon className={cn(
                     "h-6 w-6",
                     recommendations[0].priority === 'high' ? "text-destructive" :
                     recommendations[0].priority === 'low' ? "text-chart-4" :
                     "text-amber-600"
                   )} />;
                 })()}
               </div>
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-semibold">{recommendations[0].title}</h3>
                   {recommendations.length > 1 && (
                     <Badge variant="secondary" className="text-xs">
                       +{recommendations.length - 1} {l ? 'más' : 'more'}
                     </Badge>
                   )}
                 </div>
                 <p className="text-sm text-muted-foreground">{recommendations[0].description}</p>
               </div>
               {recommendations[0].action && (
                 <Button size="sm" variant="outline">
                   {recommendations[0].action}
                   <ArrowRight className="h-4 w-4 ml-1" />
                 </Button>
               )}
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Spending Pace Indicator */}
       {globalBudget > 0 && (
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-base">
               <Flame className="h-5 w-5 text-chart-5" />
               {l ? 'Ritmo de Gasto' : 'Spending Pace'}
             </CardTitle>
             <CardDescription>
               {l 
                 ? `Día ${daysPassed} de ${daysInMonth} del mes`
                 : `Day ${daysPassed} of ${daysInMonth} this month`}
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="relative">
               {/* Ideal line marker */}
               <div 
                 className="absolute top-0 bottom-0 w-0.5 bg-chart-2 z-10"
                 style={{ left: `${(daysPassed / daysInMonth) * 100}%` }}
               >
                 <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-chart-2 border-2 border-background" />
               </div>
               
               <div className="h-6 bg-muted rounded-full overflow-hidden">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min((totalSpent / globalBudget) * 100, 100)}%` }}
                   transition={{ duration: 1, ease: 'easeOut' }}
                   className={cn(
                     "h-full rounded-full bg-gradient-to-r",
                     spendingPace <= 90 ? "from-chart-4 to-emerald-400" :
                     spendingPace <= 110 ? "from-chart-2 to-chart-3" :
                     spendingPace <= 130 ? "from-amber-500 to-orange-500" :
                     "from-red-500 to-rose-500"
                   )}
                 />
               </div>
             </div>
 
             <div className="flex justify-between text-sm">
               <div>
                 <span className="font-medium">{formatCurrency(totalSpent)}</span>
                 <span className="text-muted-foreground"> {l ? 'gastado' : 'spent'}</span>
               </div>
               <div className="text-right">
                 <span className={cn(
                   "font-medium",
                   spendingPace <= 100 ? "text-chart-4" : "text-destructive"
                 )}>
                   {spendingPace <= 100 
                     ? `${(100 - spendingPace).toFixed(0)}% ${l ? 'bajo el ritmo' : 'under pace'}`
                     : `${(spendingPace - 100).toFixed(0)}% ${l ? 'sobre el ritmo' : 'over pace'}`
                   }
                 </span>
               </div>
             </div>
 
             {/* Projection */}
             <div className="p-3 rounded-xl bg-muted/50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Calculator className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm">{l ? 'Proyección fin de mes:' : 'End of month projection:'}</span>
               </div>
               <span className={cn(
                 "font-bold",
                 projectedMonthEnd <= globalBudget ? "text-chart-4" : "text-destructive"
               )}>
                 {formatCurrency(projectedMonthEnd)}
               </span>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Category Budget Health */}
       {categoryHealth.length > 0 && (
         <Card>
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2 text-base">
                 <BarChart3 className="h-5 w-5 text-chart-3" />
                 {l ? 'Salud por Categoría' : 'Category Health'}
               </CardTitle>
               <Badge variant="outline">
                 {categoryHealth.filter(c => c.status === 'good').length}/{categoryHealth.length} OK
               </Badge>
             </div>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {categoryHealth.map((category, idx) => (
                 <motion.div
                   key={category.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className={cn(
                     "p-3 rounded-xl border transition-all",
                     category.status === 'exceeded' ? "border-destructive/30 bg-destructive/5" :
                     category.status === 'warning' ? "border-amber-500/30 bg-amber-500/5" :
                     "border-chart-4/30 bg-chart-4/5"
                   )}
                 >
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <span className="font-medium text-sm">
                         {getCategoryLabel(category.category as ExpenseCategory)}
                       </span>
                       {category.status === 'exceeded' && (
                         <Badge variant="destructive" className="text-xs">
                           {l ? 'Excedido' : 'Exceeded'}
                         </Badge>
                       )}
                       {category.status === 'warning' && (
                         <Badge className="text-xs bg-amber-500">
                           {l ? 'Alerta' : 'Alert'}
                         </Badge>
                       )}
                     </div>
                     <span className="text-sm font-medium">
                       {formatCurrency(category.spent)} / {formatCurrency(category.monthly_budget)}
                     </span>
                   </div>
                   <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                     <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(category.percentage, 100)}%` }}
                       transition={{ duration: 0.8, ease: 'easeOut' }}
                       className={cn(
                         "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                         category.status === 'exceeded' ? "from-red-500 to-rose-500" :
                         category.status === 'warning' ? "from-amber-500 to-orange-500" :
                         "from-chart-4 to-emerald-400"
                       )}
                     />
                   </div>
                   <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                     <span>{category.percentage.toFixed(0)}%</span>
                     <span>
                       {category.remaining >= 0
                         ? `${formatCurrency(category.remaining)} ${l ? 'disponible' : 'left'}`
                         : `${formatCurrency(Math.abs(category.remaining))} ${l ? 'excedido' : 'over'}`}
                     </span>
                   </div>
                 </motion.div>
               ))}
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Savings Goals Progress */}
       {savingsGoals && savingsGoals.length > 0 && (
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-base">
               <Target className="h-5 w-5 text-primary" />
               {l ? 'Progreso de Metas' : 'Goals Progress'}
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-3 md:grid-cols-2">
               {savingsGoals.slice(0, 4).map((goal) => {
                 const progress = goal.target_amount > 0 
                   ? ((goal.current_amount || 0) / goal.target_amount) * 100 
                   : 0;
                 const isCompleted = progress >= 100;
 
                 return (
                   <div
                     key={goal.id}
                     className={cn(
                       "p-4 rounded-xl border-2 transition-all",
                       isCompleted ? "border-chart-4/50 bg-chart-4/10" : "border-border hover:border-primary/30"
                     )}
                   >
                     <div className="flex items-center gap-2 mb-2">
                       <div
                         className="w-3 h-3 rounded-full"
                         style={{ backgroundColor: goal.color || '#10B981' }}
                       />
                       <span className="font-medium text-sm truncate">{goal.name}</span>
                       {isCompleted && (
                         <CheckCircle2 className="h-4 w-4 text-chart-4 ml-auto flex-shrink-0" />
                       )}
                     </div>
                     <div className="space-y-2">
                       <Progress value={Math.min(progress, 100)} className="h-2" />
                       <div className="flex justify-between text-xs">
                         <span>{formatCurrency(goal.current_amount || 0)}</span>
                         <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }