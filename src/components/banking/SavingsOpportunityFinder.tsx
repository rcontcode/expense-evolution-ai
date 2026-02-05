 import { useMemo, useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { 
   Lightbulb,
   TrendingDown,
   DollarSign,
   ArrowRight,
   ChevronDown,
   ChevronUp,
   Sparkles,
   PiggyBank,
   RefreshCw,
   Scissors,
   AlertTriangle,
   CheckCircle2
 } from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useBankTransactions } from '@/hooks/data/useBankTransactions';
 import { useBankInsights, CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 
 interface Opportunity {
   id: string;
   type: 'reduce' | 'cancel' | 'negotiate' | 'switch';
   priority: 'high' | 'medium' | 'low';
   vendor: string;
   category: string;
   currentCost: number;
   potentialSavings: number;
   savingsPercent: number;
   suggestion: { es: string; en: string };
   actionLabel: { es: string; en: string };
 }
 
 export function SavingsOpportunityFinder() {
   const { language } = useLanguage();
   const { data: transactions } = useBankTransactions();
   const insights = useBankInsights();
   const [expanded, setExpanded] = useState(false);
   const [dismissedOpportunities, setDismissedOpportunities] = useState<Set<string>>(new Set());
   
   const opportunities = useMemo<Opportunity[]>(() => {
     if (!transactions || transactions.length === 0) return [];
     
     const result: Opportunity[] = [];
     const l = language === 'es';
     
     // Analyze recurring payments for savings opportunities
     insights.recurringPayments.forEach((payment, idx) => {
       const desc = payment.description.toLowerCase();
       
       // Streaming services - potential to consolidate or cancel
       if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('hbo') || 
           desc.includes('disney') || desc.includes('amazon prime') || desc.includes('youtube')) {
         result.push({
           id: `sub-${idx}`,
           type: 'cancel',
           priority: payment.amount > 15 ? 'high' : 'medium',
           vendor: payment.description,
           category: 'subscriptions',
           currentCost: payment.amount * 12,
           potentialSavings: payment.amount * 12,
           savingsPercent: 100,
           suggestion: {
             es: `¿Usas ${payment.description} frecuentemente? Podrías ahorrar $${(payment.amount * 12).toFixed(0)}/año si lo cancelas.`,
             en: `Do you use ${payment.description} often? You could save $${(payment.amount * 12).toFixed(0)}/year if you cancel.`
           },
           actionLabel: { es: 'Revisar uso', en: 'Review usage' }
         });
       }
       
       // Insurance - potential to negotiate
       if (desc.includes('insurance') || desc.includes('seguro')) {
         result.push({
           id: `ins-${idx}`,
           type: 'negotiate',
           priority: 'medium',
           vendor: payment.description,
           category: 'insurance',
           currentCost: payment.amount * 12,
           potentialSavings: payment.amount * 12 * 0.15, // 15% potential reduction
           savingsPercent: 15,
           suggestion: {
             es: `Llama a ${payment.description} y negocia tu tarifa. Muchos asegurados logran 10-20% de descuento.`,
             en: `Call ${payment.description} and negotiate your rate. Many customers get 10-20% off.`
           },
           actionLabel: { es: 'Negociar', en: 'Negotiate' }
         });
       }
       
       // Telecom - potential to switch or negotiate
       if (desc.includes('phone') || desc.includes('mobile') || desc.includes('internet') || 
           desc.includes('telecom') || desc.includes('at&t') || desc.includes('verizon')) {
         result.push({
           id: `tel-${idx}`,
           type: 'switch',
           priority: payment.amount > 80 ? 'high' : 'medium',
           vendor: payment.description,
           category: 'telecommunications',
           currentCost: payment.amount * 12,
           potentialSavings: payment.amount * 12 * 0.2,
           savingsPercent: 20,
           suggestion: {
             es: `Compara planes de competidores. Podrías ahorrar hasta 20% cambiando de proveedor.`,
             en: `Compare competitor plans. You could save up to 20% by switching providers.`
           },
           actionLabel: { es: 'Comparar', en: 'Compare' }
         });
       }
     });
     
     // Analyze top vendors for reduction opportunities
     insights.topVendors.slice(0, 5).forEach((vendor, idx) => {
       const desc = vendor.vendor.toLowerCase();
       
       // Food delivery - suggest cooking
       if (desc.includes('uber eats') || desc.includes('doordash') || desc.includes('grubhub') ||
           desc.includes('rappi') || desc.includes('pedidos ya')) {
         result.push({
           id: `food-${idx}`,
           type: 'reduce',
           priority: vendor.total > 100 ? 'high' : 'medium',
           vendor: vendor.vendor,
           category: 'restaurants',
           currentCost: vendor.total,
           potentialSavings: vendor.total * 0.5, // 50% savings by cooking
           savingsPercent: 50,
           suggestion: {
             es: `Gastas $${vendor.total.toFixed(0)} en delivery. Cocinar en casa podría ahorrarte $${(vendor.total * 0.5).toFixed(0)}.`,
             en: `You spend $${vendor.total.toFixed(0)} on delivery. Cooking at home could save you $${(vendor.total * 0.5).toFixed(0)}.`
           },
           actionLabel: { es: 'Plan de comidas', en: 'Meal plan' }
         });
       }
       
       // Coffee shops
       if (desc.includes('starbucks') || desc.includes('coffee') || desc.includes('café')) {
         result.push({
           id: `coffee-${idx}`,
           type: 'reduce',
           priority: vendor.total > 50 ? 'medium' : 'low',
           vendor: vendor.vendor,
           category: 'restaurants',
           currentCost: vendor.total,
           potentialSavings: vendor.total * 0.8,
           savingsPercent: 80,
           suggestion: {
             es: `$${vendor.total.toFixed(0)} en café. Prepararlo en casa te ahorraría ~$${(vendor.total * 0.8).toFixed(0)}.`,
             en: `$${vendor.total.toFixed(0)} on coffee. Making it at home would save you ~$${(vendor.total * 0.8).toFixed(0)}.`
           },
           actionLabel: { es: 'Calcular', en: 'Calculate' }
         });
       }
     });
     
     // Sort by potential savings
     return result
       .filter(o => !dismissedOpportunities.has(o.id))
       .sort((a, b) => b.potentialSavings - a.potentialSavings);
   }, [transactions, insights, dismissedOpportunities, language]);
   
   const totalPotentialSavings = opportunities.reduce((sum, o) => sum + o.potentialSavings, 0);
   const visibleOpportunities = expanded ? opportunities : opportunities.slice(0, 3);
   
   if (opportunities.length === 0) return null;
   
   const l = language === 'es';
   
   const getTypeIcon = (type: Opportunity['type']) => {
     switch (type) {
       case 'cancel': return Scissors;
       case 'reduce': return TrendingDown;
       case 'negotiate': return DollarSign;
       case 'switch': return RefreshCw;
     }
   };
   
   const getPriorityStyles = (priority: Opportunity['priority']) => {
     switch (priority) {
       case 'high': return 'border-chart-4/30 bg-chart-4/5';
       case 'medium': return 'border-chart-1/30 bg-chart-1/5';
       case 'low': return 'border-muted';
     }
   };
   
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 via-transparent to-chart-1/5" />
       
       <CardHeader className="pb-3 relative">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <motion.div
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ repeat: Infinity, duration: 3 }}
               className="p-2.5 rounded-xl bg-gradient-to-br from-chart-4 to-chart-1 shadow-lg shadow-chart-4/25"
             >
               <PiggyBank className="h-5 w-5 text-white" />
             </motion.div>
             <div>
               <CardTitle className="text-base flex items-center gap-2">
                 {l ? '💰 Oportunidades de Ahorro' : '💰 Savings Opportunities'}
                 <Badge variant="secondary" className="text-xs">
                   {opportunities.length}
                 </Badge>
               </CardTitle>
               <CardDescription className="text-xs">
                 {l ? 'Detectadas automáticamente de tus gastos' : 'Auto-detected from your spending'}
               </CardDescription>
             </div>
           </div>
           <div className="text-right">
             <p className="text-xs text-muted-foreground">{l ? 'Ahorro potencial' : 'Potential savings'}</p>
             <p className="text-xl font-bold text-chart-4">${totalPotentialSavings.toFixed(0)}</p>
           </div>
         </div>
       </CardHeader>
       
       <CardContent className="space-y-3 relative">
         <AnimatePresence mode="popLayout">
           {visibleOpportunities.map((opp, idx) => {
             const Icon = getTypeIcon(opp.type);
             const categoryInfo = CATEGORY_LABELS[opp.category] || CATEGORY_LABELS.other;
             
             return (
               <motion.div
                 key={opp.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ delay: idx * 0.05 }}
                 className={cn(
                   "flex items-start gap-3 p-3 rounded-xl border transition-all",
                   getPriorityStyles(opp.priority)
                 )}
               >
                 <div className="p-2 rounded-lg bg-chart-4/10">
                   <Icon className="h-4 w-4 text-chart-4" />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-lg">{categoryInfo.icon}</span>
                     <span className="font-medium text-sm truncate">{opp.vendor}</span>
                     <Badge variant="outline" className="text-[10px] shrink-0">
                       -{opp.savingsPercent}%
                     </Badge>
                   </div>
                   <p className="text-xs text-muted-foreground line-clamp-2">
                     {l ? opp.suggestion.es : opp.suggestion.en}
                   </p>
                 </div>
                 
                 <div className="text-right shrink-0">
                   <p className="text-sm font-bold text-chart-4">
                     +${opp.potentialSavings.toFixed(0)}
                   </p>
                   <Button 
                     size="sm" 
                     variant="ghost" 
                     className="h-6 text-xs px-2 mt-1"
                     onClick={() => setDismissedOpportunities(prev => new Set([...prev, opp.id]))}
                   >
                     {l ? 'Ignorar' : 'Dismiss'}
                   </Button>
                 </div>
               </motion.div>
             );
           })}
         </AnimatePresence>
         
         {opportunities.length > 3 && (
           <Button
             variant="ghost"
             size="sm"
             className="w-full"
             onClick={() => setExpanded(!expanded)}
           >
             {expanded ? (
               <>
                 <ChevronUp className="h-4 w-4 mr-2" />
                 {l ? 'Ver menos' : 'Show less'}
               </>
             ) : (
               <>
                 <ChevronDown className="h-4 w-4 mr-2" />
                 {l ? `Ver ${opportunities.length - 3} más` : `Show ${opportunities.length - 3} more`}
               </>
             )}
           </Button>
         )}
       </CardContent>
     </Card>
   );
 }