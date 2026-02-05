 import { useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { 
   TrendingUp, 
   TrendingDown, 
   Calendar,
   Target,
   ArrowRight,
   Sparkles,
   AlertTriangle,
   CheckCircle2
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useBankTransactions } from '@/hooks/data/useBankTransactions';
 import { useBankInsights } from '@/hooks/data/useBankAnalysis';
 import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
 import { motion } from 'framer-motion';
 import { format, startOfMonth, endOfMonth, getDaysInMonth, differenceInDays, subMonths, parseISO } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 interface Prediction {
   category: string;
   predicted: number;
   historical: number;
   trend: 'up' | 'down' | 'stable';
   confidence: number;
 }
 
 export function SpendingPredictor() {
   const { language } = useLanguage();
   const { data: transactions } = useBankTransactions();
   const { data: settings } = useUserSettings();
   const insights = useBankInsights();
   
   const preferences = (settings?.preferences as UserPreferences) || {};
   const globalBudget = preferences.global_monthly_budget || 0;
   
   const now = new Date();
   const dayOfMonth = now.getDate();
   const daysInMonth = getDaysInMonth(now);
   const daysRemaining = daysInMonth - dayOfMonth;
   const monthProgress = (dayOfMonth / daysInMonth) * 100;
   
   const predictions = useMemo(() => {
     if (!transactions || transactions.length === 0) {
       return { monthEndPrediction: 0, dailyAvg: 0, projectedSavings: 0, onTrack: true, predictions: [] };
     }
     
     const monthStart = startOfMonth(now);
     const monthEnd = endOfMonth(now);
     
     // Current month spending
     const currentMonthTx = transactions.filter(t => {
       const date = parseISO(t.transaction_date);
       return date >= monthStart && date <= now;
     });
     
     const currentSpent = currentMonthTx.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
     const dailyAvg = dayOfMonth > 0 ? currentSpent / dayOfMonth : 0;
     const monthEndPrediction = dailyAvg * daysInMonth;
     
     // Previous months for historical comparison
     const lastMonthStart = startOfMonth(subMonths(now, 1));
     const lastMonthEnd = endOfMonth(subMonths(now, 1));
     const lastMonthTx = transactions.filter(t => {
       const date = parseISO(t.transaction_date);
       return date >= lastMonthStart && date <= lastMonthEnd;
     });
     const lastMonthTotal = lastMonthTx.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
     
     // Calculate projected savings
     const projectedSavings = globalBudget > 0 ? globalBudget - monthEndPrediction : 0;
     const onTrack = globalBudget > 0 ? monthEndPrediction <= globalBudget : true;
     
     // Trend analysis
     const percentChange = lastMonthTotal > 0 
       ? ((monthEndPrediction - lastMonthTotal) / lastMonthTotal) * 100 
       : 0;
     
     return {
       monthEndPrediction,
       dailyAvg,
       currentSpent,
       lastMonthTotal,
       projectedSavings,
       onTrack,
       percentChange,
       daysRemaining,
       predictions: [] as Prediction[]
     };
   }, [transactions, globalBudget, dayOfMonth, daysInMonth, now]);
   
   if (!transactions || transactions.length === 0) return null;
   
   const l = language === 'es';
   
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-primary/5" />
       
       <CardHeader className="pb-3 relative">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <motion.div
               animate={{ y: [0, -3, 0] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="p-2.5 rounded-xl bg-gradient-to-br from-chart-2 to-primary shadow-lg shadow-chart-2/25"
             >
               <Sparkles className="h-5 w-5 text-white" />
             </motion.div>
             <div>
               <CardTitle className="text-base">
                 {l ? '🔮 Predicción de Gastos' : '🔮 Spending Prediction'}
               </CardTitle>
               <CardDescription className="text-xs">
                 {l ? `Basado en ${dayOfMonth} días de datos` : `Based on ${dayOfMonth} days of data`}
               </CardDescription>
             </div>
           </div>
           <Badge variant={predictions.onTrack ? 'default' : 'destructive'} className="text-xs">
             {predictions.onTrack 
               ? (l ? '✓ En meta' : '✓ On track')
               : (l ? '⚠️ Sobre presupuesto' : '⚠️ Over budget')}
           </Badge>
         </div>
       </CardHeader>
       
       <CardContent className="space-y-4 relative">
         {/* Month progress */}
         <div className="space-y-2">
           <div className="flex justify-between text-sm">
             <span className="flex items-center gap-2">
               <Calendar className="h-4 w-4 text-muted-foreground" />
               {format(now, 'MMMM', { locale: l ? es : undefined })}
             </span>
             <span className="text-muted-foreground">
               {l ? `${daysRemaining} días restantes` : `${daysRemaining} days left`}
             </span>
           </div>
           <Progress value={monthProgress} className="h-2" />
         </div>
         
         {/* Prediction cards */}
         <div className="grid grid-cols-2 gap-3">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="p-3 rounded-xl bg-muted/50 border"
           >
             <p className="text-xs text-muted-foreground mb-1">
               {l ? 'Proyección fin de mes' : 'End of month projection'}
             </p>
             <p className="text-2xl font-bold">
               ${predictions.monthEndPrediction.toFixed(0)}
             </p>
             {predictions.percentChange !== 0 && (
               <div className={cn(
                 "flex items-center gap-1 text-xs mt-1",
                 predictions.percentChange > 0 ? 'text-destructive' : 'text-chart-4'
               )}>
                 {predictions.percentChange > 0 ? (
                   <TrendingUp className="h-3 w-3" />
                 ) : (
                   <TrendingDown className="h-3 w-3" />
                 )}
                 {Math.abs(predictions.percentChange).toFixed(0)}% {l ? 'vs mes anterior' : 'vs last month'}
               </div>
             )}
           </motion.div>
           
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.1 }}
             className={cn(
               "p-3 rounded-xl border",
               predictions.projectedSavings >= 0 
                 ? 'bg-chart-4/10 border-chart-4/30' 
                 : 'bg-destructive/10 border-destructive/30'
             )}
           >
             <p className="text-xs text-muted-foreground mb-1">
               {predictions.projectedSavings >= 0 
                 ? (l ? 'Ahorro proyectado' : 'Projected savings')
                 : (l ? 'Exceso proyectado' : 'Projected excess')}
             </p>
             <p className={cn(
               "text-2xl font-bold",
               predictions.projectedSavings >= 0 ? 'text-chart-4' : 'text-destructive'
             )}>
               ${Math.abs(predictions.projectedSavings).toFixed(0)}
             </p>
             {globalBudget > 0 && (
               <p className="text-xs text-muted-foreground mt-1">
                 {l ? `de $${globalBudget.toFixed(0)} presupuesto` : `of $${globalBudget.toFixed(0)} budget`}
               </p>
             )}
           </motion.div>
         </div>
         
         {/* Daily spending insight */}
         <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
           <Target className="h-5 w-5 text-primary" />
           <div className="flex-1">
             <p className="text-sm font-medium">
               ${predictions.dailyAvg.toFixed(2)} {l ? 'promedio diario' : 'daily average'}
             </p>
             <p className="text-xs text-muted-foreground">
               {globalBudget > 0 ? (
                 l 
                   ? `Para mantenerte en meta, gasta máximo $${(globalBudget / daysInMonth).toFixed(0)}/día`
                   : `To stay on track, spend max $${(globalBudget / daysInMonth).toFixed(0)}/day`
               ) : (
                 l ? `Gastado: $${predictions.currentSpent?.toFixed(0) || 0} este mes` : `Spent: $${predictions.currentSpent?.toFixed(0) || 0} this month`
               )}
             </p>
           </div>
           {predictions.onTrack ? (
             <CheckCircle2 className="h-5 w-5 text-chart-4" />
           ) : (
             <AlertTriangle className="h-5 w-5 text-destructive" />
           )}
         </div>
       </CardContent>
     </Card>
   );
 }