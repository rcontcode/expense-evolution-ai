 import { useMemo, useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { 
   AreaChart, 
   Area, 
   XAxis, 
   YAxis, 
   CartesianGrid, 
   Tooltip, 
   ResponsiveContainer,
   ReferenceLine
 } from 'recharts';
 import { 
   TrendingUp,
   TrendingDown,
   ArrowUpRight,
   ArrowDownRight,
   Wallet,
   Calendar,
   AlertTriangle
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useBankTransactions } from '@/hooks/data/useBankTransactions';
 import { useBankInsights } from '@/hooks/data/useBankAnalysis';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { useIncome, IncomeFilters } from '@/hooks/data/useIncome';
 import { motion } from 'framer-motion';
 import { format, addMonths, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 interface ForecastPoint {
   month: string;
   monthLabel: string;
   income: number;
   expenses: number;
   netFlow: number;
   cumulative: number;
   isProjection: boolean;
 }
 
 export function CashFlowForecast() {
   const { language } = useLanguage();
   const { data: transactions } = useBankTransactions();
   const insights = useBankInsights();
   
   const now = new Date();
   const currentMonth = startOfMonth(now);
   
   // Get current year income and expenses (last 6 months + next 2)
   const sixMonthsAgo = subMonths(currentMonth, 5);
   const twoMonthsAhead = endOfMonth(addMonths(now, 2));
   const { data: allIncome } = useIncome({ year: now.getFullYear() });
   const { data: allExpenses } = useExpenses({ 
     dateRange: { start: sixMonthsAgo, end: twoMonthsAhead } 
   });
   
   const forecastData = useMemo(() => {
     const data: ForecastPoint[] = [];
     let cumulative = 0;
     
     // Build historical + projected months
     for (let i = -5; i <= 2; i++) {
       const monthDate = addMonths(currentMonth, i);
       const monthStart = startOfMonth(monthDate);
       const monthEnd = endOfMonth(monthDate);
       const monthKey = format(monthDate, 'yyyy-MM');
       const isProjection = i > 0;
       
       let monthIncome = 0;
       let monthExpenses = 0;
       
       if (isProjection) {
         // For projections, use averages from historical data
         const historicalMonths = data.filter(d => !d.isProjection);
         if (historicalMonths.length > 0) {
           monthIncome = historicalMonths.reduce((sum, d) => sum + d.income, 0) / historicalMonths.length;
           monthExpenses = historicalMonths.reduce((sum, d) => sum + d.expenses, 0) / historicalMonths.length;
         }
         
         // Add recurring payments to projections
         const recurringTotal = insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0);
         monthExpenses = Math.max(monthExpenses, recurringTotal);
       } else {
         // Calculate actual values
         monthIncome = (allIncome || [])
           .filter(inc => {
             const date = parseISO(inc.date);
             return date >= monthStart && date <= monthEnd;
           })
           .reduce((sum, inc) => sum + Number(inc.amount), 0);
         
         monthExpenses = (allExpenses || [])
           .filter(exp => {
             const date = parseISO(exp.date);
             return date >= monthStart && date <= monthEnd;
           })
           .reduce((sum, exp) => sum + Number(exp.amount), 0);
         
         // Also check bank transactions
         if (transactions) {
           const bankTx = transactions.filter(t => {
             const date = parseISO(t.transaction_date);
             return date >= monthStart && date <= monthEnd;
           });
           
           if (monthExpenses === 0) {
             monthExpenses = bankTx.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
           }
         }
       }
       
       const netFlow = monthIncome - monthExpenses;
       cumulative += netFlow;
       
       data.push({
         month: monthKey,
         monthLabel: format(monthDate, 'MMM', { locale: language === 'es' ? es : undefined }),
         income: monthIncome,
         expenses: monthExpenses,
         netFlow,
         cumulative,
         isProjection
       });
     }
     
     return data;
   }, [allIncome, allExpenses, transactions, insights.recurringPayments, currentMonth, language]);
   
   if (!transactions || transactions.length === 0) return null;
   
   const l = language === 'es';
   
   // Calculate summary stats
   const currentMonthData = forecastData.find(d => d.month === format(now, 'yyyy-MM'));
   const projectedMonths = forecastData.filter(d => d.isProjection);
   const avgNetFlow = projectedMonths.length > 0 
     ? projectedMonths.reduce((sum, d) => sum + d.netFlow, 0) / projectedMonths.length 
     : 0;
   
   const isPositive = avgNetFlow >= 0;
   
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
       
       <CardHeader className="pb-3 relative">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <motion.div
               animate={{ y: [0, -2, 0] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25"
             >
               <Wallet className="h-5 w-5 text-white" />
             </motion.div>
             <div>
               <CardTitle className="text-base">
                 {l ? '📈 Flujo de Caja Proyectado' : '📈 Cash Flow Forecast'}
               </CardTitle>
               <CardDescription className="text-xs">
                 {l ? 'Histórico y proyección a 2 meses' : 'Historical and 2-month projection'}
               </CardDescription>
             </div>
           </div>
           <Badge 
             variant={isPositive ? 'default' : 'destructive'}
             className="text-xs"
           >
             {isPositive ? (
               <ArrowUpRight className="h-3 w-3 mr-1" />
             ) : (
               <ArrowDownRight className="h-3 w-3 mr-1" />
             )}
             ${Math.abs(avgNetFlow).toFixed(0)}/{l ? 'mes' : 'mo'}
           </Badge>
         </div>
       </CardHeader>
       
       <CardContent className="space-y-4 relative">
         {/* Chart */}
         <div className="h-[200px]">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                   <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                 </linearGradient>
                 <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                   <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
               <XAxis 
                 dataKey="monthLabel" 
                 tick={{ fontSize: 11 }}
                 className="text-muted-foreground"
               />
               <YAxis 
                 tick={{ fontSize: 11 }}
                 tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                 className="text-muted-foreground"
               />
               <Tooltip
                 contentStyle={{
                   backgroundColor: 'hsl(var(--background))',
                   border: '1px solid hsl(var(--border))',
                   borderRadius: '8px',
                   fontSize: '12px'
                 }}
                 formatter={(value: number, name: string) => [
                   `$${value.toFixed(0)}`,
                   name === 'income' ? (l ? 'Ingresos' : 'Income') :
                   name === 'expenses' ? (l ? 'Gastos' : 'Expenses') :
                   (l ? 'Flujo neto' : 'Net flow')
                 ]}
                 labelFormatter={(label) => {
                   const point = forecastData.find(d => d.monthLabel === label);
                   return point?.isProjection 
                     ? `${label} (${l ? 'proyección' : 'projected'})`
                     : label;
                 }}
               />
               <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
               <Area
                 type="monotone"
                 dataKey="income"
                 stroke="hsl(var(--chart-4))"
                 fill="url(#incomeGradient)"
                 strokeWidth={2}
               />
               <Area
                 type="monotone"
                 dataKey="expenses"
                 stroke="hsl(var(--chart-5))"
                 fill="url(#expenseGradient)"
                 strokeWidth={2}
               />
             </AreaChart>
           </ResponsiveContainer>
         </div>
         
         {/* Legend & current month stats */}
         <div className="grid grid-cols-3 gap-2 text-center">
           <div className="p-2 rounded-lg bg-chart-4/10">
             <p className="text-[10px] text-muted-foreground">{l ? 'Ingresos' : 'Income'}</p>
             <p className="text-sm font-bold text-chart-4">
               ${(currentMonthData?.income || 0).toFixed(0)}
             </p>
           </div>
           <div className="p-2 rounded-lg bg-chart-5/10">
             <p className="text-[10px] text-muted-foreground">{l ? 'Gastos' : 'Expenses'}</p>
             <p className="text-sm font-bold text-chart-5">
               ${(currentMonthData?.expenses || 0).toFixed(0)}
             </p>
           </div>
           <div className={cn(
             "p-2 rounded-lg",
             (currentMonthData?.netFlow || 0) >= 0 ? 'bg-chart-4/10' : 'bg-destructive/10'
           )}>
             <p className="text-[10px] text-muted-foreground">{l ? 'Neto' : 'Net'}</p>
             <p className={cn(
               "text-sm font-bold",
               (currentMonthData?.netFlow || 0) >= 0 ? 'text-chart-4' : 'text-destructive'
             )}>
               {(currentMonthData?.netFlow || 0) >= 0 ? '+' : ''}
               ${(currentMonthData?.netFlow || 0).toFixed(0)}
             </p>
           </div>
         </div>
         
         {/* Warning if negative projection */}
         {!isPositive && (
           <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
             <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
             <div>
               <p className="text-sm font-medium text-destructive">
                 {l ? '⚠️ Flujo negativo proyectado' : '⚠️ Negative flow projected'}
               </p>
               <p className="text-xs text-muted-foreground">
                 {l 
                   ? 'Se proyecta un déficit. Considera reducir gastos o aumentar ingresos.'
                   : 'A deficit is projected. Consider reducing expenses or increasing income.'}
               </p>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }