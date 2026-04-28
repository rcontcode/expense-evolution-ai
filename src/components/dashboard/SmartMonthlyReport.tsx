import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useAssets, useLiabilities } from '@/hooks/data/useNetWorth';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, TrendingUp, TrendingDown, Trophy, AlertTriangle, 
  Sparkles, Download, ChevronDown, ChevronUp, Target, Flame,
  ArrowUpRight, ArrowDownRight, Lightbulb, Star, Loader2
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SmartMonthlyReport() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { user } = useAuth();
  const { formatCurrency: formatAmount, formatCompact } = useFormatCurrency();
  const [expanded, setExpanded] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonthDate = subMonths(now, 1);

  const { data: expenses } = useExpenses({});
  const { data: incomeData } = useIncome({ year: currentYear });
  const { data: prevYearIncome } = useIncome({ year: currentYear - 1 });
  const { data: assets } = useAssets();
  const { data: liabilities } = useLiabilities();

  const report = useMemo(() => {
    if (!expenses || !incomeData) return null;

    const filterByMonth = (items: any[], month: number, year: number) =>
      items.filter(item => {
        const d = new Date(item.date);
        return d.getMonth() === month && d.getFullYear() === year && !item.deleted_at;
      });

    const currentExpenses = filterByMonth(expenses, currentMonth, currentYear);
    const prevExpenses = filterByMonth(expenses, prevMonthDate.getMonth(), prevMonthDate.getFullYear());
    
    const currentIncome = incomeData?.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth;
    }) || [];
    const prevIncome = incomeData?.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === prevMonthDate.getMonth();
    }) || [];

    const totalExpCurrent = currentExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalExpPrev = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalIncCurrent = currentIncome.reduce((s, i) => s + Number(i.amount), 0);
    const totalIncPrev = prevIncome.reduce((s, i) => s + Number(i.amount), 0);

    const savingsRate = totalIncCurrent > 0 ? ((totalIncCurrent - totalExpCurrent) / totalIncCurrent) * 100 : 0;
    const prevSavingsRate = totalIncPrev > 0 ? ((totalIncPrev - totalExpPrev) / totalIncPrev) * 100 : 0;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    const prevCategoryMap: Record<string, number> = {};
    currentExpenses.forEach(e => {
      const cat = e.category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount);
    });
    prevExpenses.forEach(e => {
      const cat = e.category || 'other';
      prevCategoryMap[cat] = (prevCategoryMap[cat] || 0) + Number(e.amount);
    });

    // Find biggest changes
    const categoryChanges = Object.keys(categoryMap).map(cat => ({
      category: cat,
      current: categoryMap[cat],
      previous: prevCategoryMap[cat] || 0,
      change: categoryMap[cat] - (prevCategoryMap[cat] || 0),
      changePercent: prevCategoryMap[cat] ? ((categoryMap[cat] - prevCategoryMap[cat]) / prevCategoryMap[cat]) * 100 : 100,
    })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    // Top 3 spending categories
    const topCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount, percent: totalExpCurrent > 0 ? (amount / totalExpCurrent) * 100 : 0 }));

    // Net worth
    const totalAssets = assets?.reduce((s, a) => s + Number(a.current_value), 0) || 0;
    const totalLiabs = liabilities?.reduce((s, l) => s + Number(l.current_balance), 0) || 0;
    const netWorth = totalAssets - totalLiabs;

    // Achievements
    const achievements: { icon: typeof Trophy; text: string; type: 'success' | 'info' | 'warning' }[] = [];
    if (savingsRate > 20) achievements.push({ icon: Trophy, text: l ? `¡Tasa de ahorro del ${savingsRate.toFixed(0)}%! Excelente.` : `${savingsRate.toFixed(0)}% savings rate! Excellent.`, type: 'success' });
    if (totalExpCurrent < totalExpPrev && totalExpPrev > 0) achievements.push({ icon: TrendingDown, text: l ? `Redujiste gastos un ${((1 - totalExpCurrent / totalExpPrev) * 100).toFixed(0)}% vs mes anterior` : `Cut spending by ${((1 - totalExpCurrent / totalExpPrev) * 100).toFixed(0)}% vs last month`, type: 'success' });
    if (totalIncCurrent > totalIncPrev && totalIncPrev > 0) achievements.push({ icon: TrendingUp, text: l ? `Ingresos subieron ${(((totalIncCurrent - totalIncPrev) / totalIncPrev) * 100).toFixed(0)}%` : `Income up ${(((totalIncCurrent - totalIncPrev) / totalIncPrev) * 100).toFixed(0)}%`, type: 'success' });
    if (totalExpCurrent > totalIncCurrent && totalIncCurrent > 0) achievements.push({ icon: AlertTriangle, text: l ? 'Gastas más de lo que ganas este mes' : 'Spending exceeds income this month', type: 'warning' });

    // Score (0-100)
    let score = 50;
    if (savingsRate > 30) score += 20;
    else if (savingsRate > 15) score += 10;
    else if (savingsRate < 0) score -= 15;
    if (totalExpCurrent < totalExpPrev) score += 15;
    if (totalIncCurrent > totalIncPrev) score += 10;
    if (netWorth > 0) score += 5;
    score = Math.max(0, Math.min(100, score));

    return {
      totalExpCurrent, totalExpPrev, totalIncCurrent, totalIncPrev,
      savingsRate, prevSavingsRate, categoryChanges, topCategories,
      netWorth, achievements, score,
      expenseChange: totalExpPrev > 0 ? ((totalExpCurrent - totalExpPrev) / totalExpPrev) * 100 : 0,
      incomeChange: totalIncPrev > 0 ? ((totalIncCurrent - totalIncPrev) / totalIncPrev) * 100 : 0,
    };
  }, [expenses, incomeData, assets, liabilities, currentMonth, currentYear]);

  const generateAIInsight = async () => {
    if (!report || !user) return;
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('app-assistant', {
        body: {
          prompt: `You are a financial advisor. Based on this monthly report data, give 3 specific, actionable recommendations in ${l ? 'Spanish' : 'English'}. Be concise (max 150 words total).

Data:
- Income: ${report.totalIncCurrent}, change: ${report.incomeChange.toFixed(1)}%
- Expenses: ${report.totalExpCurrent}, change: ${report.expenseChange.toFixed(1)}%  
- Savings rate: ${report.savingsRate.toFixed(1)}%
- Top categories: ${report.topCategories.map(c => `${c.category}: ${c.amount}`).join(', ')}
- Biggest increases: ${report.categoryChanges.filter(c => c.change > 0).slice(0, 3).map(c => `${c.category}: +${c.changePercent.toFixed(0)}%`).join(', ')}
- Net worth: ${report.netWorth}
- Score: ${report.score}/100`,
          model: 'google/gemini-2.5-flash-lite',
        },
      });
      if (error) throw error;
      setAiInsight(data?.response || data?.text || (l ? 'No se pudo generar el análisis.' : 'Could not generate analysis.'));
    } catch {
      toast.error(l ? 'Error generando análisis' : 'Error generating analysis');
    } finally {
      setLoadingAI(false);
    }
  };

  if (!report) return null;

  const monthName = format(now, 'MMMM yyyy', { locale: l ? es : undefined });
  const scoreColor = report.score >= 75 ? 'text-green-500' : report.score >= 50 ? 'text-amber-500' : 'text-destructive';
  const scoreLabel = report.score >= 75 ? (l ? '🔥 Excelente' : '🔥 Excellent') : report.score >= 50 ? (l ? '👍 Bien' : '👍 Good') : (l ? '⚠️ Mejorable' : '⚠️ Needs Work');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {l ? 'Reporte Mensual Inteligente' : 'Smart Monthly Report'}
            </CardTitle>
            <CardDescription className="capitalize">{monthName}</CardDescription>
          </div>
          <div className="text-center">
            <div className={cn("text-3xl font-black", scoreColor)}>{report.score}</div>
            <p className="text-[10px] text-muted-foreground">{scoreLabel}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-chart-4/10 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">{l ? 'Ingresos' : 'Income'}</p>
            <p className="text-sm font-bold">{formatCompact(report.totalIncCurrent)}</p>
            <Badge variant="outline" className={cn("text-[9px] mt-1", report.incomeChange >= 0 ? 'text-green-600' : 'text-destructive')}>
              {report.incomeChange >= 0 ? <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />}
              {Math.abs(report.incomeChange).toFixed(0)}%
            </Badge>
          </div>
          <div className="p-3 rounded-xl bg-destructive/10 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">{l ? 'Gastos' : 'Expenses'}</p>
            <p className="text-sm font-bold">{formatCompact(report.totalExpCurrent)}</p>
            <Badge variant="outline" className={cn("text-[9px] mt-1", report.expenseChange <= 0 ? 'text-green-600' : 'text-destructive')}>
              {report.expenseChange <= 0 ? <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" /> : <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />}
              {Math.abs(report.expenseChange).toFixed(0)}%
            </Badge>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">{l ? 'Ahorro' : 'Savings'}</p>
            <p className="text-sm font-bold">{report.savingsRate.toFixed(0)}%</p>
            <Badge variant="outline" className={cn("text-[9px] mt-1", report.savingsRate > report.prevSavingsRate ? 'text-green-600' : 'text-destructive')}>
              {report.savingsRate > report.prevSavingsRate ? '↑' : '↓'} vs prev
            </Badge>
          </div>
        </div>

        {/* Achievements */}
        {report.achievements.length > 0 && (
          <div className="space-y-2">
            {report.achievements.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-sm",
                  a.type === 'success' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                  a.type === 'warning' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                  a.type === 'info' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
                )}
              >
                <a.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs">{a.text}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Expandable Details */}
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {l ? 'Ver detalles completos' : 'See full details'}
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Top Categories */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" />
                  {l ? 'Top Categorías' : 'Top Categories'}
                </h4>
                <div className="space-y-2">
                  {report.topCategories.map((cat, i) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize">{cat.category}</span>
                        <span className="font-medium">{formatCompact(cat.amount)} ({cat.percent.toFixed(0)}%)</span>
                      </div>
                      <Progress value={cat.percent} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Biggest Changes */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {l ? 'Mayores Cambios vs Mes Anterior' : 'Biggest Changes vs Last Month'}
                </h4>
                <div className="space-y-1.5">
                  {report.categoryChanges.slice(0, 5).map(c => (
                    <div key={c.category} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                      <span className="capitalize">{c.category}</span>
                      <span className={cn("font-medium", c.change > 0 ? 'text-destructive' : 'text-green-600')}>
                        {c.change > 0 ? '+' : ''}{formatCompact(c.change)}
                        {c.previous > 0 && ` (${c.changePercent > 0 ? '+' : ''}${c.changePercent.toFixed(0)}%)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Smart Insights */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  {l ? 'Análisis Personalizado' : 'Personalized Analysis'}
                </h4>
                {aiInsight ? (
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs whitespace-pre-line">
                    {aiInsight}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAIInsight}
                    disabled={loadingAI}
                    className="w-full"
                  >
                    {loadingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {l ? 'Generar Análisis' : 'Generate Analysis'}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
