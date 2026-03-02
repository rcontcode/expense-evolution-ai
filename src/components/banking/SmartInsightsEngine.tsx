 import { useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { 
   Brain,
   Sparkles,
   TrendingUp,
   TrendingDown,
   AlertTriangle,
   Lightbulb,
   Target,
   PiggyBank,
   ArrowRight,
   CheckCircle2,
   Clock
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useBankTransactions } from '@/hooks/data/useBankTransactions';
 import { useBankInsights } from '@/hooks/data/useBankAnalysis';
 import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { useIncome } from '@/hooks/data/useIncome';
 import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
 import { motion } from 'framer-motion';
 import { Link } from 'react-router-dom';
 import { startOfMonth, endOfMonth, subMonths, parseISO, format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 interface SmartInsight {
   id: string;
   type: 'achievement' | 'warning' | 'opportunity' | 'tip' | 'goal';
   priority: number;
   icon: React.ElementType;
   title: string;
   description: string;
   metric?: { value: string; label: string; trend?: 'up' | 'down' };
   action?: { label: string; to?: string };
 }
 
 export function SmartInsightsEngine() {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: transactions } = useBankTransactions();
   const insights = useBankInsights();
   const { data: settings } = useUserSettings();
   const { data: allIncome } = useIncome();
   const { formatCurrency: fc } = useFormatCurrency();
   
   const now = new Date();
   const monthStart = startOfMonth(now);
   const monthEnd = endOfMonth(now);
   const lastMonthStart = startOfMonth(subMonths(now, 1));
   const lastMonthEnd = endOfMonth(subMonths(now, 1));
   
   const { data: currentExpenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
   const { data: lastExpenses } = useExpenses({ dateRange: { start: lastMonthStart, end: lastMonthEnd } });
   
   const preferences = (settings?.preferences as UserPreferences) || {};
   const globalBudget = preferences.global_monthly_budget || 0;
   const userName = profile?.full_name?.split(' ')[0] || '';
   
   const smartInsights = useMemo<SmartInsight[]>(() => {
     const result: SmartInsight[] = [];
     const l = language === 'es';
     
     const currentTotal = currentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
     const lastTotal = lastExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
     const percentChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;
     
     // Spending comparison vs last month
     if (lastTotal > 0) {
       if (percentChange < -10) {
         result.push({
           id: 'spending-down',
           type: 'achievement',
           priority: 1,
           icon: TrendingDown,
           title: l ? `🎉 ¡Excelente ${userName}!` : `🎉 Excellent ${userName}!`,
           description: l 
             ? `Redujiste tus gastos ${Math.abs(percentChange).toFixed(0)}% vs el mes pasado`
             : `You reduced spending ${Math.abs(percentChange).toFixed(0)}% vs last month`,
           metric: { 
             value: `-${Math.abs(percentChange).toFixed(0)}%`, 
             label: l ? 'vs mes anterior' : 'vs last month',
             trend: 'down' 
           }
         });
       } else if (percentChange > 20) {
         result.push({
           id: 'spending-up',
           type: 'warning',
           priority: 2,
           icon: TrendingUp,
           title: l ? '📈 Gastos en aumento' : '📈 Spending increasing',
           description: l 
             ? `Tus gastos subieron ${percentChange.toFixed(0)}% este mes. Revisa dónde puedes ajustar.`
             : `Your spending is up ${percentChange.toFixed(0)}% this month. Review where you can adjust.`,
           metric: { 
             value: `+${percentChange.toFixed(0)}%`, 
             label: l ? 'vs mes anterior' : 'vs last month',
             trend: 'up' 
           },
           action: { label: l ? 'Ver detalles' : 'View details', to: '/expenses' }
         });
       }
     }
     
     // Budget status
     if (globalBudget > 0) {
       const usage = (currentTotal / globalBudget) * 100;
       const dayOfMonth = now.getDate();
       const expectedUsage = (dayOfMonth / 30) * 100;
       
       if (usage < expectedUsage * 0.8) {
         result.push({
           id: 'budget-ahead',
           type: 'achievement',
           priority: 3,
           icon: Target,
           title: l ? '🎯 Adelantado en tu meta' : '🎯 Ahead of your goal',
           description: l 
             ? `Vas por debajo de tu ritmo de gasto proyectado. ¡Sigue así!`
             : `You're below your projected spending pace. Keep it up!`,
           metric: { 
             value: `${usage.toFixed(0)}%`, 
             label: l ? 'del presupuesto' : 'of budget' 
           }
         });
      } else if (usage > 100) {
          result.push({
            id: 'budget-exceeded',
            type: 'warning',
            priority: 1,
            icon: AlertTriangle,
            title: l ? '⚠️ Presupuesto excedido' : '⚠️ Budget exceeded',
            description: l 
              ? `Has superado tu presupuesto por ${fc(currentTotal - globalBudget)}`
              : `You've exceeded your budget by ${fc(currentTotal - globalBudget)}`,
            action: { label: l ? 'Ajustar presupuesto' : 'Adjust budget', to: '/budget' }
          });
        }
     }
     
     // Recurring payments insight
      const recurringTotal = insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0);
      if (recurringTotal > 100) {
        const yearlyRecurring = recurringTotal * 12;
        result.push({
          id: 'recurring-insight',
          type: 'tip',
          priority: 4,
          icon: Clock,
          title: l ? '💡 Tus pagos fijos' : '💡 Your fixed payments',
          description: l 
            ? `Tienes ${fc(recurringTotal)}/mes en pagos recurrentes (${fc(yearlyRecurring)}/año)`
            : `You have ${fc(recurringTotal)}/mo in recurring payments (${fc(yearlyRecurring)}/yr)`,
          metric: { 
            value: fc(recurringTotal), 
            label: l ? '/mes fijo' : '/mo fixed' 
          }
        });
      }
      
      // Real savings rate with income data
      const currentMonthIncome = allIncome?.filter(i => {
        const d = new Date(i.date);
        return d >= monthStart && d <= monthEnd;
      }).reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      
      if (currentMonthIncome > 0 && currentTotal > 0) {
        const savingsRate = ((currentMonthIncome - currentTotal) / currentMonthIncome) * 100;
        if (savingsRate >= 20) {
          result.push({
            id: 'savings-rate',
            type: 'achievement',
            priority: 2,
            icon: PiggyBank,
            title: l ? `💪 Tasa de ahorro: ${savingsRate.toFixed(0)}%` : `💪 Savings rate: ${savingsRate.toFixed(0)}%`,
            description: l 
              ? `Estás ahorrando ${fc(currentMonthIncome - currentTotal)} este mes. ¡Excelente disciplina!`
              : `You're saving ${fc(currentMonthIncome - currentTotal)} this month. Excellent discipline!`,
            metric: { value: `${savingsRate.toFixed(0)}%`, label: l ? 'tasa de ahorro' : 'savings rate' }
          });
        } else if (savingsRate < 5 && savingsRate >= 0) {
          result.push({
            id: 'low-savings',
            type: 'warning',
            priority: 2,
            icon: AlertTriangle,
            title: l ? '⚠️ Tasa de ahorro baja' : '⚠️ Low savings rate',
            description: l 
              ? `Solo ahorras el ${savingsRate.toFixed(0)}% de tus ingresos. Revisa gastos variables.`
              : `You're only saving ${savingsRate.toFixed(0)}% of income. Review variable expenses.`,
            action: { label: l ? 'Ver gastos' : 'View expenses', to: '/expenses' }
          });
        }
      }

      // Savings potential (only if no income-based insight)
      if (globalBudget > 0 && currentTotal < globalBudget && currentMonthIncome === 0) {
        const potentialSavings = globalBudget - currentTotal;
        result.push({
          id: 'savings-potential',
          type: 'opportunity',
          priority: 5,
          icon: PiggyBank,
          title: l ? '💰 Potencial de ahorro' : '💰 Savings potential',
          description: l 
            ? `Si mantienes este ritmo, podrías ahorrar ${fc(potentialSavings)} este mes`
            : `If you maintain this pace, you could save ${fc(potentialSavings)} this month`,
          metric: { 
            value: fc(potentialSavings), 
            label: l ? 'posible ahorro' : 'potential savings' 
          }
        });
      }
     
      // Sort by priority and take top 5
      return result.sort((a, b) => a.priority - b.priority).slice(0, 5);
    }, [currentExpenses, lastExpenses, globalBudget, insights.recurringPayments, userName, language, now, allIncome, fc]);
   
   if (smartInsights.length === 0) return null;
   
   const l = language === 'es';
   
   const getTypeStyles = (type: SmartInsight['type']) => {
     switch (type) {
       case 'achievement': return 'border-chart-4/30 bg-chart-4/5';
       case 'warning': return 'border-chart-5/30 bg-chart-5/5';
       case 'opportunity': return 'border-chart-1/30 bg-chart-1/5';
       case 'goal': return 'border-primary/30 bg-primary/5';
       default: return 'border-muted bg-muted/50';
     }
   };
   
   const getIconStyles = (type: SmartInsight['type']) => {
     switch (type) {
       case 'achievement': return 'bg-chart-4/10 text-chart-4';
       case 'warning': return 'bg-chart-5/10 text-chart-5';
       case 'opportunity': return 'bg-chart-1/10 text-chart-1';
       default: return 'bg-primary/10 text-primary';
     }
   };
   
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
       
       <CardHeader className="pb-3 relative">
         <div className="flex items-center gap-3">
           <motion.div
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ repeat: Infinity, duration: 2 }}
             className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-1 shadow-lg shadow-primary/25"
           >
             <Brain className="h-5 w-5 text-white" />
           </motion.div>
           <div>
             <CardTitle className="text-base flex items-center gap-2">
               {l ? '🧠 Insights Inteligentes' : '🧠 Smart Insights'}
               <Badge variant="secondary" className="text-xs">AI</Badge>
             </CardTitle>
           </div>
         </div>
       </CardHeader>
       
       <CardContent className="space-y-3 relative">
         {smartInsights.map((insight, idx) => (
           <motion.div
             key={insight.id}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: idx * 0.1 }}
             className={cn(
               "flex items-start gap-3 p-3 rounded-xl border transition-all",
               getTypeStyles(insight.type)
             )}
           >
             <div className={cn("p-2 rounded-lg", getIconStyles(insight.type))}>
               <insight.icon className="h-4 w-4" />
             </div>
             
             <div className="flex-1 min-w-0">
               <p className="font-medium text-sm">{insight.title}</p>
               <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
               
               {insight.metric && (
                 <div className="flex items-center gap-2 mt-2">
                   <span className={cn(
                     "text-lg font-bold",
                     insight.metric.trend === 'up' ? 'text-destructive' :
                     insight.metric.trend === 'down' ? 'text-chart-4' : ''
                   )}>
                     {insight.metric.value}
                   </span>
                   <span className="text-xs text-muted-foreground">{insight.metric.label}</span>
                 </div>
               )}
             </div>
             
             {insight.action && (
               <Link to={insight.action.to || '#'}>
                 <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0">
                   {insight.action.label}
                   <ArrowRight className="h-3 w-3 ml-1" />
                 </Button>
               </Link>
             )}
           </motion.div>
         ))}
       </CardContent>
     </Card>
   );
 }