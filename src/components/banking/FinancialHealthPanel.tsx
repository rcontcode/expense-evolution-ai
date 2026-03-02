 import { useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import {
   TrendingUp,
   TrendingDown,
   AlertTriangle,
   CheckCircle2,
   Target,
   Lightbulb,
   ArrowRight,
   PiggyBank,
   Wallet,
   RefreshCw,
   Sparkles,
   ChevronRight
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useBankTransactions } from '@/hooks/data/useBankTransactions';
 import { useBankInsights } from '@/hooks/data/useBankAnalysis';
 import { useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
 import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { motion } from 'framer-motion';
 import { cn } from '@/lib/utils';
 import { Link } from 'react-router-dom';
 
 interface Insight {
   type: 'success' | 'warning' | 'info' | 'tip';
   icon: React.ElementType;
   title: string;
   description: string;
   action?: { label: string; to?: string; onClick?: () => void };
 }
 
 export function FinancialHealthPanel() {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: transactions } = useBankTransactions();
   const bankInsights = useBankInsights();
   const { data: budgets } = useCategoryBudgets();
   const { data: settings } = useUserSettings();
 
   const now = new Date();
   const monthStart = startOfMonth(now);
   const monthEnd = endOfMonth(now);
 
   const { data: expenses } = useExpenses({
     dateRange: { start: monthStart, end: monthEnd },
   });
 
   const preferences = (settings?.preferences as UserPreferences) || {};
   const globalBudget = preferences.global_monthly_budget || 0;
   const userName = profile?.full_name?.split(' ')[0] || '';
 
   // Calculate key metrics
   const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
   const budgetUsage = globalBudget > 0 ? (totalSpent / globalBudget) * 100 : 0;
   const remainingBudget = globalBudget - totalSpent;
 
   // Recurring payments total
   const recurringTotal = bankInsights.recurringPayments.reduce((sum, p) => sum + p.amount, 0);
 
   // Generate personalized insights
   const insights = useMemo<Insight[]>(() => {
     const result: Insight[] = [];
     const l = language === 'es';
 
     // Budget status insight
     if (globalBudget > 0) {
       if (budgetUsage >= 100) {
         result.push({
           type: 'warning',
           icon: AlertTriangle,
           title: l ? '⚠️ Presupuesto excedido' : '⚠️ Budget exceeded',
           description: l
             ? `Has gastado $${Math.abs(remainingBudget).toFixed(0)} más de tu presupuesto de $${globalBudget.toFixed(0)}`
             : `You've spent $${Math.abs(remainingBudget).toFixed(0)} more than your $${globalBudget.toFixed(0)} budget`,
           action: { label: l ? 'Revisar gastos' : 'Review expenses', to: '/expenses' }
         });
       } else if (budgetUsage >= 80) {
         result.push({
           type: 'warning',
           icon: Target,
           title: l ? '👀 Atención con tu presupuesto' : '👀 Watch your budget',
           description: l
             ? `Ya usaste el ${budgetUsage.toFixed(0)}% de tu presupuesto. Te quedan $${remainingBudget.toFixed(0)}`
             : `You've used ${budgetUsage.toFixed(0)}% of your budget. $${remainingBudget.toFixed(0)} remaining`
         });
       } else if (budgetUsage < 50) {
         result.push({
           type: 'success',
           icon: CheckCircle2,
           title: l ? '🎯 ¡Excelente control!' : '🎯 Excellent control!',
           description: l
             ? `Solo has usado el ${budgetUsage.toFixed(0)}% de tu presupuesto. ¡Sigue así!`
             : `You've only used ${budgetUsage.toFixed(0)}% of your budget. Keep it up!`
         });
       }
     }
 
     // Recurring payments insight
     if (bankInsights.recurringPayments.length > 0) {
       const annualized = recurringTotal * 12;
       result.push({
         type: 'info',
         icon: RefreshCw,
         title: l ? `💳 ${bankInsights.recurringPayments.length} pagos recurrentes` : `💳 ${bankInsights.recurringPayments.length} recurring payments`,
         description: l
           ? `Pagas ~$${recurringTotal.toFixed(0)}/mes ($${annualized.toFixed(0)}/año) en suscripciones y servicios`
           : `You pay ~$${recurringTotal.toFixed(0)}/mo ($${annualized.toFixed(0)}/yr) on subscriptions and services`
       });
     }
 
     // Savings opportunity tip
     if (bankInsights.topVendors.length > 0) {
       const topVendor = bankInsights.topVendors[0];
       if (topVendor.total > 200) {
         result.push({
           type: 'tip',
           icon: Lightbulb,
           title: l ? '💡 Oportunidad de ahorro' : '💡 Savings opportunity',
           description: l
             ? `Gastas $${topVendor.total.toFixed(0)} en "${topVendor.vendor}". ¿Puedes reducirlo?`
             : `You spend $${topVendor.total.toFixed(0)} at "${topVendor.vendor}". Can you reduce it?`
         });
       }
     }
 
     // Missing budget setup
     if (globalBudget === 0 && totalSpent > 0) {
       result.push({
         type: 'info',
         icon: Target,
         title: l ? '📊 Define tu presupuesto' : '📊 Set your budget',
         description: l
           ? `Gastaste $${totalSpent.toFixed(0)} este mes. Establecer un presupuesto te ayudará a controlar tus gastos`
           : `You spent $${totalSpent.toFixed(0)} this month. Setting a budget will help you control expenses`,
         action: { label: l ? 'Configurar' : 'Set up', to: '/budget' }
       });
     }
 
     // No category budgets
     if ((budgets?.length || 0) === 0 && (transactions?.length || 0) > 0) {
       result.push({
         type: 'tip',
         icon: PiggyBank,
         title: l ? '🎯 Metas por categoría' : '🎯 Category goals',
         description: l
           ? 'Configura presupuestos por categoría para un control más detallado de tus finanzas'
           : 'Set up category budgets for more detailed control of your finances',
         action: { label: l ? 'Crear metas' : 'Create goals', to: '/dashboard?section=budgets' }
       });
     }
 
     return result.slice(0, 4); // Max 4 insights
   }, [language, globalBudget, budgetUsage, remainingBudget, recurringTotal, bankInsights, budgets, transactions, totalSpent]);
 
   if (insights.length === 0) return null;
 
   const getInsightStyles = (type: Insight['type']) => {
     switch (type) {
       case 'success':
         return 'border-chart-4/30 bg-chart-4/5 dark:bg-chart-4/10';
       case 'warning':
         return 'border-chart-5/30 bg-chart-5/5 dark:bg-chart-5/10';
       case 'tip':
         return 'border-chart-1/30 bg-chart-1/5 dark:bg-chart-1/10';
       default:
         return 'border-primary/30 bg-primary/5 dark:bg-primary/10';
     }
   };
 
   const getIconStyles = (type: Insight['type']) => {
     switch (type) {
       case 'success':
         return 'text-chart-4 bg-chart-4/10';
       case 'warning':
         return 'text-chart-5 bg-chart-5/10';
       case 'tip':
         return 'text-chart-1 bg-chart-1/10';
       default:
         return 'text-primary bg-primary/10';
     }
   };
 
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
       
       <CardHeader className="pb-2 relative">
         <CardTitle className="flex items-center gap-3 text-base">
           <motion.div
             whileHover={{ scale: 1.1, rotate: 5 }}
             className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/25"
           >
             <Sparkles className="h-5 w-5 text-white" />
           </motion.div>
           <div>
             <span className="text-primary font-bold">
               {userName 
                 ? (language === 'es' ? `${userName}, tu panorama financiero` : `${userName}, your financial snapshot`)
                 : (language === 'es' ? 'Tu panorama financiero' : 'Your financial snapshot')}
             </span>
             <p className="text-xs text-muted-foreground font-normal">
               {format(now, 'MMMM yyyy', { locale: language === 'es' ? es : undefined })}
             </p>
           </div>
         </CardTitle>
       </CardHeader>
 
       <CardContent className="space-y-3 relative">
         {/* Budget summary if exists */}
         {globalBudget > 0 && (
           <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
             <Wallet className="h-5 w-5 text-muted-foreground" />
             <div className="flex-1">
               <div className="flex justify-between text-sm mb-1">
                 <span>${totalSpent.toFixed(0)} {language === 'es' ? 'gastado' : 'spent'}</span>
                 <span className={cn(
                   'font-medium',
                   remainingBudget >= 0 ? 'text-chart-4' : 'text-destructive'
                 )}>
                   {remainingBudget >= 0 
                     ? `$${remainingBudget.toFixed(0)} ${language === 'es' ? 'disponible' : 'available'}`
                     : `$${Math.abs(remainingBudget).toFixed(0)} ${language === 'es' ? 'excedido' : 'over'}`}
                 </span>
               </div>
               <Progress value={Math.min(budgetUsage, 100)} className="h-2" />
             </div>
           </div>
         )}
 
         {/* Insights */}
         <div className="grid gap-2">
           {insights.map((insight, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.05 }}
               className={cn(
                 'flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm',
                 getInsightStyles(insight.type)
               )}
             >
               <div className={cn('p-2 rounded-lg', getIconStyles(insight.type))}>
                 <insight.icon className="h-4 w-4" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="font-medium text-sm">{insight.title}</p>
                 <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
               </div>
               {insight.action && (
                 insight.action.to ? (
                   <Link to={insight.action.to}>
                     <Button size="sm" variant="ghost" className="h-8 text-xs">
                       {insight.action.label}
                       <ChevronRight className="h-3 w-3 ml-1" />
                     </Button>
                   </Link>
                 ) : (
                   <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={insight.action.onClick}>
                     {insight.action.label}
                     <ChevronRight className="h-3 w-3 ml-1" />
                   </Button>
                 )
               )}
             </motion.div>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 }