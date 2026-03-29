import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Wifi,
  Tv,
  Music,
  Cloud,
  ShoppingBag,
  Dumbbell,
  Newspaper,
  HelpCircle,
  ArrowRightLeft,
  Check,
  Building2,
  TrendingDown,
  PieChart,
  Lightbulb,
  FileSearch,
  Percent,
  Flame,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useEntity } from '@/contexts/EntityContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useSubscriptionDetector, DetectedSubscription } from '@/hooks/data/useSubscriptionDetector';
import { useCreateBill } from '@/hooks/data/useRecurringBills';
import { toast } from 'sonner';
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  subscriptions: <RefreshCw className="h-4 w-4" />,
  telecommunications: <Wifi className="h-4 w-4" />,
  entertainment: <Tv className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  software: <Cloud className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  fitness: <Dumbbell className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
  default: <CreditCard className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  subscriptions: 'from-violet-500 to-purple-600',
  telecommunications: 'from-blue-500 to-cyan-600',
  entertainment: 'from-pink-500 to-rose-600',
  music: 'from-green-500 to-emerald-600',
  software: 'from-indigo-500 to-blue-600',
  shopping: 'from-amber-500 to-orange-600',
  fitness: 'from-red-500 to-rose-600',
  news: 'from-slate-500 to-gray-600',
  default: 'from-primary to-primary/80',
};

function getCategoryIcon(category: string | null): React.ReactNode {
  if (!category) return CATEGORY_ICONS.default;
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerCategory.includes(key)) return icon;
  }
  return CATEGORY_ICONS.default;
}

function getCategoryGradient(category: string | null): string {
  if (!category) return CATEGORY_COLORS.default;
  const lowerCategory = category.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lowerCategory.includes(key)) return color;
  }
  return CATEGORY_COLORS.default;
}

function getFrequencyColor(frequency: DetectedSubscription['frequency']): string {
  switch (frequency) {
    case 'weekly': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'monthly': return 'bg-primary/10 text-primary border-primary/20';
    case 'quarterly': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    case 'yearly': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getSourceBadge(source: DetectedSubscription['source'], language: string) {
  switch (source) {
    case 'bank':
      return (
        <Badge variant="outline" className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/20">
          <Building2 className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Banco' : 'Bank'}
        </Badge>
      );
    case 'both':
      return (
        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <Shield className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Verificado' : 'Verified'}
        </Badge>
      );
    default:
      return null;
  }
}

// ──────────────────────────────────────────────
// Subscription Card
// ──────────────────────────────────────────────
interface SubscriptionCardProps {
  subscription: DetectedSubscription;
  language: string;
  index: number;
  getFrequencyLabel: (frequency: DetectedSubscription['frequency'], language: string) => string;
  onConvertToBill: (subscription: DetectedSubscription) => void;
  isConverted: boolean;
}

function SubscriptionCard({ subscription, language, index, getFrequencyLabel, onConvertToBill, isConverted }: SubscriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const gradient = getCategoryGradient(subscription.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="group border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardContent className="py-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-md text-white`}>
                    {getCategoryIcon(subscription.category)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{subscription.vendor}</h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${getFrequencyColor(subscription.frequency)}`}>
                        {getFrequencyLabel(subscription.frequency, language)}
                      </Badge>
                      {getSourceBadge(subscription.source, language)}
                      <span className="text-[10px] text-muted-foreground">
                        {subscription.occurrences} {language === 'es' ? 'pagos' : 'payments'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-base">${subscription.averageAmount.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground font-medium">
                      ${subscription.annualizedCost.toFixed(0)}/{language === 'es' ? 'año' : 'yr'}
                    </div>
                  </div>
                  <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 border-t border-border/50 bg-muted/20">
              <div className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/80 rounded-lg p-2.5 border border-border/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      {language === 'es' ? 'Último pago' : 'Last payment'}
                    </span>
                    <span className="text-sm font-semibold">
                      {format(parseISO(subscription.lastDate), 'PP', { locale: language === 'es' ? es : undefined })}
                    </span>
                  </div>
                  <div className="bg-background/80 rounded-lg p-2.5 border border-border/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      {language === 'es' ? 'Total gastado' : 'Total spent'}
                    </span>
                    <span className="text-sm font-semibold">${subscription.totalSpent.toFixed(2)}</span>
                  </div>
                </div>

                {/* Amount range */}
                {subscription.expenses.length >= 2 && (() => {
                  const amounts = subscription.expenses.map(e => Number(e.amount));
                  const min = Math.min(...amounts);
                  const max = Math.max(...amounts);
                  if (min === max) return null;
                  return (
                    <div className="flex items-center gap-2 text-xs bg-background/80 rounded-lg p-2.5 border border-border/30">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{language === 'es' ? 'Rango' : 'Range'}:</span>
                      <span className="font-semibold">${min.toFixed(2)} — ${max.toFixed(2)}</span>
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {language === 'es' ? 'Prom' : 'Avg'}: ${subscription.averageAmount.toFixed(2)}
                      </Badge>
                    </div>
                  );
                })()}

                {/* Confidence */}
                <div className="flex items-center gap-2 bg-background/80 rounded-lg p-2.5 border border-border/30">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Confianza' : 'Confidence'}
                  </span>
                  <Progress value={subscription.confidence} className="h-1.5 flex-1" />
                  <span className={`text-xs font-bold ${
                    subscription.confidence >= 80 ? 'text-emerald-600 dark:text-emerald-400' 
                    : subscription.confidence >= 50 ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                  }`}>
                    {subscription.confidence.toFixed(0)}%
                  </span>
                </div>

                {/* Convert button */}
                <div className="pt-1">
                  {isConverted ? (
                    <Button variant="outline" size="sm" disabled className="w-full bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Agregado como gasto fijo' : 'Added as recurring bill'}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full shadow-md"
                      onClick={(e) => { e.stopPropagation(); onConvertToBill(subscription); }}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Convertir en gasto fijo' : 'Convert to recurring bill'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Main Tracker
// ──────────────────────────────────────────────
export function SubscriptionTracker() {
  const { language } = useLanguage();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: bankTransactions, isLoading: bankLoading } = useBankTransactions();
  const { data: recurringBills } = useRecurringBills();
  const createBill = useCreateBill();
  const { currentEntity } = useEntity();
  const [convertedVendors, setConvertedVendors] = useState<Set<string>>(new Set());
  const isEs = language === 'es';

  const trackedVendors = new Set(
    (recurringBills || [])
      .filter(b => b.status === 'active')
      .map(b => b.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const { 
    subscriptions, 
    totalAnnualSubscriptionCost, 
    totalMonthlySubscriptionCost,
    getFrequencyLabel 
  } = useSubscriptionDetector(expenses || [], bankTransactions || []);

  const isLoading = expensesLoading || bankLoading;

  const handleConvertToBill = async (sub: DetectedSubscription) => {
    try {
      const frequencyMap: Record<string, string> = {
        weekly: 'weekly', monthly: 'monthly', quarterly: 'quarterly', yearly: 'yearly',
      };

      const nextDue = addMonths(parseISO(sub.lastDate), sub.frequency === 'quarterly' ? 3 : sub.frequency === 'yearly' ? 12 : 1);

      await createBill.mutateAsync({
        name: sub.vendor,
        amount: Math.round(sub.averageAmount * 100) / 100,
        frequency: frequencyMap[sub.frequency] || 'monthly',
        category: sub.category || 'subscriptions',
        is_active: true,
        auto_pay: false,
        next_due_date: format(nextDue, 'yyyy-MM-dd'),
        currency: currentEntity?.default_currency || 'CAD',
      } as any);

      setConvertedVendors(prev => new Set(prev).add(sub.vendor));
    } catch (err) {
      console.error('Error converting to bill:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const bankCount = subscriptions.filter(s => s.source === 'bank' || s.source === 'both').length;
  const topSubscription = subscriptions.length > 0
    ? subscriptions.reduce((a, b) => a.annualizedCost > b.annualizedCost ? a : b)
    : null;

  // Category breakdown
  const categoryBreakdown = subscriptions.reduce((acc, s) => {
    const cat = s.category || 'other';
    if (!acc[cat]) acc[cat] = { count: 0, monthly: 0 };
    acc[cat].count += 1;
    acc[cat].monthly += s.averageAmount;
    return acc;
  }, {} as Record<string, { count: number; monthly: number }>);

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].monthly - a[1].monthly);

  return (
    <div className="space-y-6">
      {/* ═══ Summary Cards ═══ */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Detected */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="relative overflow-hidden border-2 border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                {isEs ? 'Detectadas' : 'Detected'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-amber-700 dark:text-amber-300">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {bankCount > 0
                  ? (isEs ? `${bankCount} desde banco` : `${bankCount} from bank`)
                  : (isEs ? 'Gastos recurrentes' : 'Recurring expenses')
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="relative overflow-hidden border-2 border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" />
                {isEs ? 'Costo Mensual' : 'Monthly Cost'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-blue-700 dark:text-blue-300">${totalMonthlySubscriptionCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isEs ? 'Promedio mensual' : 'Monthly average'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Annual */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/80 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {isEs ? 'Costo Anual' : 'Annual Cost'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-emerald-700 dark:text-emerald-300">${totalAnnualSubscriptionCost.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isEs ? 'Proyección anual' : 'Annual projection'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ Category Breakdown + Insights ═══ */}
      {subscriptions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Category Breakdown */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Card className="h-full border-2 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  {isEs ? 'Desglose por Categoría' : 'Category Breakdown'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedCategories.map(([cat, data]) => {
                  const pct = totalMonthlySubscriptionCost > 0 ? (data.monthly / totalMonthlySubscriptionCost) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getCategoryGradient(cat)} text-white`}>
                        {getCategoryIcon(cat)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold capitalize truncate">{cat.replace(/_/g, ' ')}</span>
                          <span className="font-bold">${data.monthly.toFixed(2)}/mo</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className={`h-full rounded-full bg-gradient-to-r ${getCategoryGradient(cat)}`}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
                {sortedCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">{isEs ? 'Sin datos' : 'No data'}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Smart Insights */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-2 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  {isEs ? 'Insights Inteligentes' : 'Smart Insights'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Top subscription */}
                {topSubscription && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15">
                    <Flame className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {isEs ? 'Mayor gasto recurrente' : 'Highest recurring cost'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{topSubscription.vendor}</span>
                        {' → '}${topSubscription.annualizedCost.toFixed(0)}/{isEs ? 'año' : 'yr'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Annual total */}
                {totalAnnualSubscriptionCost > 500 && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {isEs ? 'Oportunidad de ahorro' : 'Savings opportunity'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isEs
                          ? `Gastas $${totalAnnualSubscriptionCost.toFixed(0)}/año en recurrentes. Revisa cuáles usas.`
                          : `You spend $${totalAnnualSubscriptionCost.toFixed(0)}/yr on recurring. Review which you use.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Weekly warning */}
                {subscriptions.filter(s => s.frequency === 'weekly').length > 0 && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-destructive">
                        {isEs ? 'Gastos semanales detectados' : 'Weekly expenses detected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isEs ? 'Los gastos semanales se acumulan rápidamente.' : 'Weekly costs add up quickly.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tracking tip */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/15">
                  <TrendingDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {isEs ? 'Tip de optimización' : 'Optimization tip'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isEs
                        ? 'Convierte tus suscripciones detectadas en gastos fijos para un mejor seguimiento.'
                        : 'Convert detected subscriptions to recurring bills for better tracking.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ═══ Subscriptions List ═══ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-2 border-border/60 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/15 dark:to-orange-950/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                <FileSearch className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {isEs ? 'Gastos Recurrentes Detectados' : 'Detected Recurring Expenses'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isEs
                    ? 'Basado en tus gastos y extractos bancarios'
                    : 'Based on your expenses and bank statements'}
                </CardDescription>
              </div>
              {subscriptions.length > 0 && (
                <Badge className="ml-auto bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25">
                  {subscriptions.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center mb-5">
                  <FileSearch className="h-10 w-10 text-amber-500/60" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {isEs ? 'No se detectaron suscripciones' : 'No subscriptions detected'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  {isEs
                    ? 'El sistema analiza automáticamente tus gastos y extractos bancarios para detectar cobros recurrentes. Registra datos desde estas fuentes:'
                    : 'The system automatically analyzes your expenses and bank statements to detect recurring charges. Add data from these sources:'}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs flex-wrap mb-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shadow-sm hover:shadow-md transition-all"
                    onClick={() => window.location.href = '/expenses'}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {isEs ? 'Registrar Gastos' : 'Add Expenses'}
                  </Button>
                  <span className="text-muted-foreground">+</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shadow-sm hover:shadow-md transition-all"
                    onClick={() => window.location.href = '/banking'}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {isEs ? 'Importar Extractos' : 'Import Statements'}
                  </Button>
                  <span className="text-muted-foreground">=</span>
                  <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg font-semibold border border-amber-500/25 shadow-sm shadow-amber-500/10">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isEs ? 'Detección Auto' : 'Auto Detection'}
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.location.href = '/bills'}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {isEs ? 'Ir a Pagos Fijos' : 'Go to Fixed Payments'}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-3 max-w-sm mx-auto">
                  {isEs
                    ? '💡 También puedes registrar pagos fijos manualmente desde la sección de Pagos Fijos'
                    : '💡 You can also manually register fixed payments from the Fixed Payments section'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((subscription, index) => (
                  <SubscriptionCard
                    key={`${subscription.vendor}-${index}`}
                    subscription={subscription}
                    language={language}
                    index={index}
                    getFrequencyLabel={getFrequencyLabel}
                    onConvertToBill={handleConvertToBill}
                    isConverted={
                      convertedVendors.has(subscription.vendor) ||
                      trackedVendors.has(subscription.vendor.toLowerCase().replace(/[^a-z0-9]/g, ''))
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
