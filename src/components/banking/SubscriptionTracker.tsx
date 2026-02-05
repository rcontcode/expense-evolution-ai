 import { useMemo, useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { 
   RefreshCw,
   Calendar,
   AlertTriangle,
   Bell,
   DollarSign,
   ChevronRight,
   Pause,
   Play,
   Trash2,
   Clock,
   CreditCard
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useBankInsights, CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
 import { motion, AnimatePresence } from 'framer-motion';
 import { format, addMonths, differenceInDays, parseISO } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 interface Subscription {
   id: string;
   name: string;
   amount: number;
   frequency: string;
   category: string;
   nextCharge: Date;
   daysUntilCharge: number;
   isActive: boolean;
   renewalAlert: boolean;
 }
 
 export function SubscriptionTracker() {
   const { language } = useLanguage();
   const insights = useBankInsights();
   const [showAll, setShowAll] = useState(false);
   const [alerts, setAlerts] = useState<Record<string, boolean>>({});
   
   const subscriptions = useMemo<Subscription[]>(() => {
     const now = new Date();
     
     return insights.recurringPayments.map((payment, idx) => {
       // Estimate next charge date (assuming monthly)
       const nextCharge = addMonths(now, 1);
       nextCharge.setDate(Math.min(15, nextCharge.getDate())); // Assume mid-month
       
       const daysUntilCharge = differenceInDays(nextCharge, now);
       
       return {
         id: `sub-${idx}`,
         name: payment.description,
         amount: payment.amount,
         frequency: payment.frequency,
         category: payment.category || 'subscriptions',
         nextCharge,
         daysUntilCharge,
         isActive: true,
         renewalAlert: daysUntilCharge <= 7
       };
     });
   }, [insights.recurringPayments]);
   
   const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);
   const totalAnnual = totalMonthly * 12;
   const upcomingCharges = subscriptions.filter(s => s.daysUntilCharge <= 7).length;
   
   const visibleSubs = showAll ? subscriptions : subscriptions.slice(0, 5);
   
   if (subscriptions.length === 0) return null;
   
   const l = language === 'es';
   
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-primary/5" />
       
       <CardHeader className="pb-3 relative">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
               className="p-2.5 rounded-xl bg-gradient-to-br from-chart-3 to-primary shadow-lg shadow-chart-3/25"
             >
               <RefreshCw className="h-5 w-5 text-white" />
             </motion.div>
             <div>
               <CardTitle className="text-base flex items-center gap-2">
                 {l ? '🔄 Tracker de Suscripciones' : '🔄 Subscription Tracker'}
                 {upcomingCharges > 0 && (
                   <Badge variant="destructive" className="text-xs">
                     {upcomingCharges} {l ? 'próximas' : 'upcoming'}
                   </Badge>
                 )}
               </CardTitle>
               <CardDescription className="text-xs">
                 {subscriptions.length} {l ? 'suscripciones activas' : 'active subscriptions'}
               </CardDescription>
             </div>
           </div>
         </div>
         
         {/* Summary stats */}
         <div className="grid grid-cols-2 gap-3 mt-4">
           <div className="p-3 rounded-xl bg-muted/50 border">
             <p className="text-xs text-muted-foreground">{l ? 'Gasto mensual' : 'Monthly cost'}</p>
             <p className="text-xl font-bold">${totalMonthly.toFixed(0)}</p>
           </div>
           <div className="p-3 rounded-xl bg-muted/50 border">
             <p className="text-xs text-muted-foreground">{l ? 'Costo anual' : 'Annual cost'}</p>
             <p className="text-xl font-bold">${totalAnnual.toFixed(0)}</p>
           </div>
         </div>
       </CardHeader>
       
       <CardContent className="space-y-3 relative">
         <AnimatePresence mode="popLayout">
           {visibleSubs.map((sub, idx) => {
             const categoryInfo = CATEGORY_LABELS[sub.category] || CATEGORY_LABELS.subscriptions;
             const isUrgent = sub.daysUntilCharge <= 3;
             const isSoon = sub.daysUntilCharge <= 7;
             
             return (
               <motion.div
                 key={sub.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ delay: idx * 0.05 }}
                 className={cn(
                   "flex items-center gap-3 p-3 rounded-xl border transition-all",
                   isUrgent ? 'border-destructive/30 bg-destructive/5' :
                   isSoon ? 'border-chart-5/30 bg-chart-5/5' :
                   'bg-muted/50'
                 )}
               >
                 <span className="text-2xl">{categoryInfo.icon}</span>
                 
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <span className="font-medium text-sm truncate">{sub.name}</span>
                     <Badge variant="outline" className="text-[10px]">
                       {sub.frequency === 'monthly' ? (l ? 'Mensual' : 'Monthly') :
                        sub.frequency === 'yearly' ? (l ? 'Anual' : 'Yearly') : sub.frequency}
                     </Badge>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                     <Clock className="h-3 w-3" />
                     {isUrgent ? (
                       <span className="text-destructive font-medium">
                         {l ? `¡Cobra en ${sub.daysUntilCharge} días!` : `Charges in ${sub.daysUntilCharge} days!`}
                       </span>
                     ) : isSoon ? (
                       <span className="text-chart-5">
                         {l ? `Próximo cobro: ${sub.daysUntilCharge} días` : `Next charge: ${sub.daysUntilCharge} days`}
                       </span>
                     ) : (
                       <span>
                         {l ? `Próximo: ${format(sub.nextCharge, 'dd MMM', { locale: es })}` : `Next: ${format(sub.nextCharge, 'MMM dd')}`}
                       </span>
                     )}
                   </div>
                 </div>
                 
                 <div className="text-right shrink-0">
                   <p className="font-bold">${sub.amount.toFixed(2)}</p>
                   <p className="text-[10px] text-muted-foreground">
                     ${(sub.amount * 12).toFixed(0)}/{l ? 'año' : 'yr'}
                   </p>
                 </div>
                 
                 {/* Alert toggle */}
                 <div className="flex items-center gap-1">
                   <Bell 
                     className={cn(
                       "h-4 w-4 transition-colors",
                       alerts[sub.id] ? 'text-primary' : 'text-muted-foreground'
                     )}
                   />
                 </div>
               </motion.div>
             );
           })}
         </AnimatePresence>
         
         {subscriptions.length > 5 && (
           <Button
             variant="ghost"
             size="sm"
             className="w-full"
             onClick={() => setShowAll(!showAll)}
           >
             {showAll 
               ? (l ? 'Ver menos' : 'Show less')
               : (l ? `Ver ${subscriptions.length - 5} más` : `Show ${subscriptions.length - 5} more`)}
             <ChevronRight className={cn("h-4 w-4 ml-2 transition-transform", showAll && "rotate-90")} />
           </Button>
         )}
         
         {/* Pro tip */}
         <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
           <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
           <div>
             <p className="text-sm font-medium">
               {l ? '💡 Consejo: Audita tus suscripciones' : '💡 Tip: Audit your subscriptions'}
             </p>
             <p className="text-xs text-muted-foreground">
               {l 
                 ? `Pagas $${totalAnnual.toFixed(0)}/año. ¿Usas todas estas suscripciones regularmente?`
                 : `You pay $${totalAnnual.toFixed(0)}/year. Do you regularly use all these subscriptions?`}
             </p>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }