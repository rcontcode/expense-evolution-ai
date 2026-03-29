import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useIncomeSummary } from '@/hooks/data/useIncome';
import { getMonthlyEquivalent, BILL_CATEGORY_CONFIG, type BillCategory } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Brain, Lightbulb, TrendingDown, Shield, AlertTriangle,
  ChevronDown, Scissors, PhoneCall, ArrowRight, Sparkles, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

interface Insight {
  id: string;
  type: 'savings' | 'alert' | 'tip' | 'achievement';
  icon: React.ReactNode;
  title: string;
  description: string;
  impact?: string;
  action?: string;
  priority: number;
}

export function BillSmartInsights() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const { data: incomeSummary } = useIncomeSummary();
  const [expanded, setExpanded] = useState(true);

  const insights = useMemo(() => {
    const active = bills?.filter(b => b.status === 'active') || [];
    if (active.length === 0) return [];

    const now = new Date();
    const results: Insight[] = [];

    const monthlyTotal = active.reduce((s, b) =>
      s + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined), 0);

    // Average income
    const monthKeys = Object.keys(incomeSummary?.byMonth || {}).sort().slice(-6);
    const avgIncome = monthKeys.length > 0
      ? monthKeys.reduce((s, k) => s + (incomeSummary?.byMonth?.[k] || 0), 0) / monthKeys.length : 0;
    const ratio = avgIncome > 0 ? (monthlyTotal / avgIncome) * 100 : 0;

    // 1. Overdue alerts
    const overdue = active.filter(b => differenceInDays(parseISO(b.next_due_date), now) < 0);
    if (overdue.length > 0) {
      const totalOverdue = overdue.reduce((s, b) => s + Number(b.amount), 0);
      results.push({
        id: 'overdue',
        type: 'alert',
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
        title: l ? `🚨 ${overdue.length} pago(s) vencido(s)` : `🚨 ${overdue.length} overdue bill(s)`,
        description: l
          ? `Tienes ${formatCurrency(totalOverdue)} en pagos vencidos: ${overdue.map(b => b.name).join(', ')}`
          : `You have ${formatCurrency(totalOverdue)} in overdue bills: ${overdue.map(b => b.name).join(', ')}`,
        impact: formatCurrency(totalOverdue),
        action: l ? 'Pagar ahora' : 'Pay now',
        priority: 10,
      });
    }

    // 2. Upcoming 48hrs
    const urgent = active.filter(b => {
      const d = differenceInDays(parseISO(b.next_due_date), now);
      return d >= 0 && d <= 2;
    });
    if (urgent.length > 0) {
      results.push({
        id: 'urgent',
        type: 'alert',
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        title: l ? `⏰ ${urgent.length} pago(s) en las próximas 48h` : `⏰ ${urgent.length} bill(s) due in 48h`,
        description: urgent.map(b => `${b.name} - ${formatCurrency(b.amount)} (${format(parseISO(b.next_due_date), 'dd MMM', { locale: l ? es : undefined })})`).join(' · '),
        priority: 9,
      });
    }

    // 3. Subscription audit — find subscriptions that could be cut
    const subs = active.filter(b => b.category === 'subscriptions' || b.category === 'entertainment');
    if (subs.length >= 3) {
      const subTotal = subs.reduce((s, b) =>
        s + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined), 0);
      results.push({
        id: 'sub-audit',
        type: 'savings',
        icon: <Scissors className="h-4 w-4 text-purple-500" />,
        title: l ? '✂️ Auditoría de Suscripciones' : '✂️ Subscription Audit',
        description: l
          ? `Tienes ${subs.length} suscripciones por ${formatCurrency(subTotal)}/mes. Revisa si usas todas activamente.`
          : `You have ${subs.length} subscriptions totaling ${formatCurrency(subTotal)}/mo. Review if you actively use all of them.`,
        impact: l ? `Potencial: ${formatCurrency(subTotal * 0.3)}/mes` : `Potential: ${formatCurrency(subTotal * 0.3)}/mo`,
        priority: 6,
      });
    }

    // 4. Negotiation opportunity — bills over a threshold
    const negotiable = active.filter(b => {
      const monthly = getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
      return monthly > 50 && ['telecommunications', 'insurance', 'utilities'].includes(b.category);
    });
    if (negotiable.length > 0) {
      const negTotal = negotiable.reduce((s, b) =>
        s + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined), 0);
      results.push({
        id: 'negotiate',
        type: 'savings',
        icon: <PhoneCall className="h-4 w-4 text-blue-500" />,
        title: l ? '📞 Oportunidad de Negociación' : '📞 Negotiation Opportunity',
        description: l
          ? `${negotiable.map(b => b.name).join(', ')} podrían negociarse. Llama y pide descuento por fidelidad.`
          : `${negotiable.map(b => b.name).join(', ')} could be negotiated. Call and ask for a loyalty discount.`,
        impact: l ? `Ahorro estimado: ${formatCurrency(negTotal * 0.15)}/mes` : `Est. savings: ${formatCurrency(negTotal * 0.15)}/mo`,
        priority: 5,
      });
    }

    // 5. High ratio warning
    if (ratio > 60) {
      results.push({
        id: 'high-ratio',
        type: 'alert',
        icon: <Shield className="h-4 w-4 text-red-500" />,
        title: l ? '🛑 Compromisos altos' : '🛑 High Commitments',
        description: l
          ? `Tus pagos fijos representan el ${ratio.toFixed(0)}% de tu ingreso. Lo ideal es mantenerlos bajo 50%.`
          : `Your fixed bills are ${ratio.toFixed(0)}% of your income. Ideally keep them under 50%.`,
        priority: 7,
      });
    }

    // 6. No autopay bills
    const manualBills = active.filter(b => !b.auto_pay);
    if (manualBills.length >= 3) {
      results.push({
        id: 'autopay-tip',
        type: 'tip',
        icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
        title: l ? '⚡ Automatiza más pagos' : '⚡ Automate more payments',
        description: l
          ? `${manualBills.length} pagos son manuales: ${manualBills.slice(0, 3).map(b => b.name).join(', ')}. Activar autopago reduce riesgo de olvido.`
          : `${manualBills.length} bills are manual: ${manualBills.slice(0, 3).map(b => b.name).join(', ')}. Enabling autopay reduces forgotten payments.`,
        priority: 4,
      });
    }

    // 7. Category concentration
    const catMap: Record<string, number> = {};
    active.forEach(b => {
      const monthly = getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
      catMap[b.category] = (catMap[b.category] || 0) + monthly;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat && monthlyTotal > 0 && (topCat[1] / monthlyTotal) > 0.4) {
      const cfg = BILL_CATEGORY_CONFIG[topCat[0] as BillCategory];
      results.push({
        id: 'concentration',
        type: 'tip',
        icon: <Eye className="h-4 w-4 text-indigo-500" />,
        title: l ? `🔍 Concentración en ${cfg?.es || topCat[0]}` : `🔍 Concentration in ${cfg?.en || topCat[0]}`,
        description: l
          ? `El ${((topCat[1] / monthlyTotal) * 100).toFixed(0)}% de tus pagos fijos (${formatCurrency(topCat[1])}/mes) está en una sola categoría. Diversificar reduce riesgo.`
          : `${((topCat[1] / monthlyTotal) * 100).toFixed(0)}% of fixed bills (${formatCurrency(topCat[1])}/mo) is in one category. Diversifying reduces risk.`,
        priority: 3,
      });
    }

    // 8. Achievement: all on track
    if (overdue.length === 0 && urgent.length === 0 && active.length >= 3) {
      results.push({
        id: 'all-clear',
        type: 'achievement',
        icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
        title: l ? '🌟 ¡Todo al día!' : '🌟 All on track!',
        description: l
          ? `Tus ${active.length} pagos están al día. ¡Excelente disciplina financiera!`
          : `All ${active.length} bills are on track. Excellent financial discipline!`,
        priority: 1,
      });
    }

    return results.sort((a, b) => b.priority - a.priority);
  }, [bills, incomeSummary, l, formatCurrency]);

  if (insights.length === 0) return null;

  const typeConfig: Record<string, { bg: string; border: string }> = {
    alert: { bg: 'bg-destructive/5', border: 'border-destructive/20' },
    savings: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
    tip: { bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
    achievement: { bg: 'bg-primary/5', border: 'border-primary/20' },
  };

  const alertCount = insights.filter(i => i.type === 'alert').length;
  const savingsCount = insights.filter(i => i.type === 'savings').length;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-chart-2/5 to-transparent hover:from-primary/10 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">
                {l ? `🧠 ${insights.length} Insights Inteligentes` : `🧠 ${insights.length} Smart Insights`}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {alertCount > 0 && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                    {alertCount} {l ? 'alertas' : 'alerts'}
                  </Badge>
                )}
                {savingsCount > 0 && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    {savingsCount} {l ? 'ahorros' : 'savings'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2">
          <AnimatePresence>
            {insights.map((insight, i) => {
              const cfg = typeConfig[insight.type];
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn('p-3 rounded-xl border', cfg.bg, cfg.border)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{insight.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                      {insight.impact && (
                        <Badge variant="outline" className="mt-1.5 text-[10px] h-5 gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {insight.impact}
                        </Badge>
                      )}
                    </div>
                    {insight.action && (
                      <Button variant="ghost" size="sm" className="shrink-0 text-xs h-7 gap-1">
                        {insight.action} <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <LegalDisclaimer variant="general" size="compact" showLearnMore={false} className="mt-3" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
