 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import {
   Target,
   Plus,
   TrendingUp,
   PiggyBank,
   CheckCircle2,
   Calendar,
   DollarSign,
   Sparkles,
   ArrowUpRight,
   Flame,
   Trophy
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useSavingsGoals, useAddToSavingsGoal } from '@/hooks/data/useSavingsGoals';
 import { useIncome } from '@/hooks/data/useIncome';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { differenceInDays, format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
 import { es, enUS } from 'date-fns/locale';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
 import { Link } from 'react-router-dom';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { toast } from 'sonner';
 
 export function SavingsGoalsDashboard() {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: savingsGoals, isLoading } = useSavingsGoals();
   const addToGoal = useAddToSavingsGoal();
 
   const now = new Date();
   const monthStart = startOfMonth(now);
   const monthEnd = endOfMonth(now);
 
   const { data: income } = useIncome({
     year: now.getFullYear(),
     month: now.getMonth() + 1,
   });
 
   const { data: expenses } = useExpenses({
     dateRange: { start: monthStart, end: monthEnd },
   });
 
   const [addAmountGoalId, setAddAmountGoalId] = useState<string | null>(null);
   const [amountToAdd, setAmountToAdd] = useState('');
 
   const l = language === 'es';
   const userName = profile?.full_name?.split(' ')[0] || '';
 
   // Calculate savings potential
   const totalIncome = income?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
   const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
   const availableToSave = totalIncome - totalSpent;
   const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
 
   // Process goals
   const activeGoals = savingsGoals?.filter(g => g.status === 'active' || !g.status) || [];
   const completedGoals = savingsGoals?.filter(g => {
     const progress = g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0;
     return progress >= 100;
   }) || [];
 
   // Total progress across all goals
   const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
   const totalSaved = activeGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
   const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
 
   const handleAddAmount = () => {
     if (addAmountGoalId && amountToAdd) {
       addToGoal.mutate({ id: addAmountGoalId, amount: parseFloat(amountToAdd) });
       setAddAmountGoalId(null);
       setAmountToAdd('');
     }
   };
 
   const { formatCompact: formatCurrency } = useFormatCurrency();
 
   // Calculate suggested monthly contribution per goal
   const getMonthlyContribution = (goal: typeof activeGoals[0]) => {
     if (!goal.deadline) return null;
     const remaining = goal.target_amount - (goal.current_amount || 0);
     if (remaining <= 0) return 0;
     
     const daysLeft = differenceInDays(new Date(goal.deadline), now);
     if (daysLeft <= 0) return remaining;
     
     const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
     return Math.ceil(remaining / monthsLeft);
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="p-6">
           <div className="animate-pulse space-y-4">
             <div className="h-8 bg-muted rounded w-1/3" />
             <div className="h-32 bg-muted rounded" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <>
       <div className="space-y-6">
         {/* Hero Stats */}
         <Card className="relative overflow-hidden border-2 border-chart-4/20">
           <div className="absolute inset-0 bg-gradient-to-br from-chart-4/10 via-emerald-500/5 to-teal-500/10" />
           
           <CardContent className="relative p-6">
             <div className="flex flex-col md:flex-row gap-6 items-center">
               {/* Overall Progress Circle */}
               <div className="flex flex-col items-center">
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: 'spring', stiffness: 200 }}
                   className="relative"
                 >
                   <div className="w-28 h-28 rounded-full bg-gradient-to-br from-chart-4 to-emerald-400 flex items-center justify-center shadow-xl shadow-chart-4/30">
                     <div className="w-20 h-20 rounded-full bg-card flex flex-col items-center justify-center">
                       <PiggyBank className="h-6 w-6 text-chart-4 mb-1" />
                       <span className="text-xl font-bold">{overallProgress.toFixed(0)}%</span>
                     </div>
                   </div>
                   {completedGoals.length > 0 && (
                     <motion.div
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       className="absolute -top-1 -right-1"
                     >
                       <Badge className="bg-amber-500 text-white border-0 shadow-lg shadow-amber-500/30">
                         <Trophy className="h-3 w-3 mr-1" />
                         {completedGoals.length}
                       </Badge>
                     </motion.div>
                   )}
                 </motion.div>
                 <p className="text-sm text-muted-foreground mt-2">
                   {l ? 'Progreso Total' : 'Total Progress'}
                 </p>
               </div>
 
               {/* Stats Grid */}
               <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="text-center p-3 rounded-xl bg-card border">
                   <p className="text-2xl font-bold text-chart-4">{formatCurrency(totalSaved)}</p>
                   <p className="text-xs text-muted-foreground">{l ? 'Total Ahorrado' : 'Total Saved'}</p>
                 </div>
                 <div className="text-center p-3 rounded-xl bg-card border">
                   <p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p>
                   <p className="text-xs text-muted-foreground">{l ? 'Meta Total' : 'Total Goal'}</p>
                 </div>
                 <div className="text-center p-3 rounded-xl bg-card border">
                   <p className="text-2xl font-bold">{activeGoals.length}</p>
                   <p className="text-xs text-muted-foreground">{l ? 'Metas Activas' : 'Active Goals'}</p>
                 </div>
                 <div className="text-center p-3 rounded-xl bg-card border">
                   <p className={cn(
                     "text-2xl font-bold",
                     availableToSave > 0 ? "text-chart-4" : "text-destructive"
                   )}>
                     {formatCurrency(Math.max(0, availableToSave))}
                   </p>
                   <p className="text-xs text-muted-foreground">{l ? 'Disponible' : 'Available'}</p>
                 </div>
               </div>
             </div>
 
             {/* Savings Rate Banner */}
             {totalIncome > 0 && (
               <div className={cn(
                 "mt-4 p-3 rounded-xl flex items-center justify-between",
                 savingsRate >= 20 ? "bg-chart-4/10 border border-chart-4/30" :
                 savingsRate >= 10 ? "bg-chart-2/10 border border-chart-2/30" :
                 "bg-amber-500/10 border border-amber-500/30"
               )}>
                 <div className="flex items-center gap-2">
                   <Flame className={cn(
                     "h-5 w-5",
                     savingsRate >= 20 ? "text-chart-4" : savingsRate >= 10 ? "text-chart-2" : "text-amber-500"
                   )} />
                   <span className="font-medium">
                     {l ? 'Tasa de Ahorro:' : 'Savings Rate:'} {savingsRate.toFixed(0)}%
                   </span>
                 </div>
                 <Badge variant="outline" className="font-normal">
                   {savingsRate >= 20 
                     ? (l ? '🏆 Excelente' : '🏆 Excellent')
                     : savingsRate >= 10 
                       ? (l ? '👍 Buen ritmo' : '👍 Good pace')
                       : (l ? '💪 Puede mejorar' : '💪 Room to grow')}
                 </Badge>
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Goals Grid */}
         {activeGoals.length > 0 ? (
           <div className="grid gap-4 md:grid-cols-2">
             {activeGoals.map((goal, idx) => {
               const progress = goal.target_amount > 0 
                 ? ((goal.current_amount || 0) / goal.target_amount) * 100 
                 : 0;
               const remaining = goal.target_amount - (goal.current_amount || 0);
               const isCompleted = progress >= 100;
               const daysLeft = goal.deadline 
                 ? differenceInDays(new Date(goal.deadline), now)
                 : null;
               const monthlyContribution = getMonthlyContribution(goal);
 
               return (
                 <motion.div
                   key={goal.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.1 }}
                 >
                   <Card className={cn(
                     "relative overflow-hidden transition-all hover:shadow-lg",
                     isCompleted && "border-2 border-chart-4/50"
                   )}>
                     <div 
                       className="absolute top-0 left-0 right-0 h-1.5"
                       style={{ backgroundColor: goal.color || '#10B981' }}
                     />
 
                     <CardContent className="p-4 pt-6">
                       <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <div
                             className="w-10 h-10 rounded-xl flex items-center justify-center"
                             style={{ backgroundColor: `${goal.color || '#10B981'}20` }}
                           >
                             {isCompleted ? (
                               <CheckCircle2 className="h-5 w-5" style={{ color: goal.color || '#10B981' }} />
                             ) : (
                               <Target className="h-5 w-5" style={{ color: goal.color || '#10B981' }} />
                             )}
                           </div>
                           <div>
                             <h3 className="font-semibold">{goal.name}</h3>
                             {daysLeft !== null && (
                               <p className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Calendar className="h-3 w-3" />
                                 {daysLeft > 0 
                                   ? `${daysLeft} ${l ? 'días restantes' : 'days left'}`
                                   : daysLeft === 0 
                                     ? (l ? 'Vence hoy' : 'Due today')
                                     : (l ? 'Vencida' : 'Overdue')}
                               </p>
                             )}
                           </div>
                         </div>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => setAddAmountGoalId(goal.id)}
                           disabled={isCompleted}
                         >
                           <DollarSign className="h-4 w-4 mr-1" />
                           {l ? 'Agregar' : 'Add'}
                         </Button>
                       </div>
 
                       <div className="space-y-2">
                         <div className="flex items-center justify-between text-sm">
                           <span className="font-medium">{formatCurrency(goal.current_amount || 0)}</span>
                           <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                         </div>
                         <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min(progress, 100)}%` }}
                             transition={{ duration: 1, ease: 'easeOut' }}
                             className="absolute inset-y-0 left-0 rounded-full"
                             style={{ 
                               background: `linear-gradient(to right, ${goal.color || '#10B981'}, ${goal.color || '#10B981'}CC)` 
                             }}
                           />
                         </div>
                         <div className="flex justify-between text-xs text-muted-foreground">
                           <span>{progress.toFixed(0)}% {l ? 'completado' : 'complete'}</span>
                           {!isCompleted && remaining > 0 && (
                             <span>{formatCurrency(remaining)} {l ? 'restante' : 'remaining'}</span>
                           )}
                         </div>
                       </div>
 
                       {/* Monthly contribution suggestion */}
                       {monthlyContribution && monthlyContribution > 0 && !isCompleted && (
                         <div className="mt-3 p-2 rounded-lg bg-muted/50 text-center">
                           <p className="text-xs text-muted-foreground">
                             {l ? 'Ahorra' : 'Save'} <span className="font-semibold text-foreground">{formatCurrency(monthlyContribution)}</span> {l ? '/mes para lograrlo' : '/mo to reach it'}
                           </p>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </motion.div>
               );
             })}
           </div>
         ) : (
           <Card>
             <CardContent className="p-8 text-center">
               <motion.div
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-chart-4/20 to-emerald-500/20 flex items-center justify-center"
               >
                 <PiggyBank className="h-10 w-10 text-chart-4" />
               </motion.div>
               <h3 className="text-lg font-semibold mb-2">
                 {l ? '¡Crea tu primera meta de ahorro!' : 'Create your first savings goal!'}
               </h3>
               <p className="text-muted-foreground mb-4">
                 {l 
                   ? 'Las metas te ayudan a mantener el enfoque y celebrar tus logros.'
                   : 'Goals help you stay focused and celebrate your achievements.'}
               </p>
               <Link to="/budget?tab=savings">
                 <Button>
                   <Plus className="h-4 w-4 mr-2" />
                   {l ? 'Crear Meta' : 'Create Goal'}
                 </Button>
               </Link>
             </CardContent>
           </Card>
         )}
       </div>
 
       {/* Add Amount Dialog */}
       <Dialog open={!!addAmountGoalId} onOpenChange={(open) => !open && setAddAmountGoalId(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{l ? 'Agregar a meta' : 'Add to goal'}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div>
               <label className="text-sm font-medium">{l ? 'Cantidad a agregar' : 'Amount to add'}</label>
               <div className="relative mt-2">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                 <Input
                   type="number"
                   value={amountToAdd}
                   onChange={(e) => setAmountToAdd(e.target.value)}
                   placeholder="0.00"
                   className="pl-7"
                 />
               </div>
             </div>
             {availableToSave > 0 && (
               <p className="text-sm text-muted-foreground">
                 {l ? 'Tienes' : 'You have'} <span className="font-medium text-chart-4">{formatCurrency(availableToSave)}</span> {l ? 'disponible este mes' : 'available this month'}
               </p>
             )}
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setAddAmountGoalId(null)}>
               {l ? 'Cancelar' : 'Cancel'}
             </Button>
             <Button 
               onClick={handleAddAmount}
               disabled={!amountToAdd || parseFloat(amountToAdd) <= 0 || addToGoal.isPending}
             >
               <DollarSign className="h-4 w-4 mr-1" />
               {l ? 'Agregar' : 'Add'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 }