import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Brain, Sparkles, RefreshCw, TrendingUp, Shield, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

interface AutopilotInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
  impact?: string;
  priority: 'high' | 'medium' | 'low';
}

const ICON_MAP = {
  opportunity: TrendingUp,
  warning: AlertTriangle,
  achievement: Sparkles,
  tip: Lightbulb,
};

const COLOR_MAP = {
  opportunity: { text: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  warning: { text: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  achievement: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  tip: { text: 'text-chart-1', bg: 'bg-chart-1/10', border: 'border-chart-1/20' },
};

export function FinancialAutopilot() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { user } = useAuth();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: bills } = useRecurringBills();

  const [insights, setInsights] = useState<AutopilotInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateInsights = async () => {
    if (!user || !expenses) return;
    setLoading(true);

    try {
      // Prepare compact financial summary for AI
      const recentExpenses = (expenses || [])
        .filter((e: any) => !e.deleted_at)
        .slice(0, 50)
        .map((e: any) => ({ amount: e.amount, category: e.category, vendor: e.vendor, date: e.date }));

      const recentIncome = (income || [])
        .slice(0, 20)
        .map((i: any) => ({ amount: i.amount, category: i.category, date: i.date }));

      const activeBills = (bills || [])
        .filter((b: any) => b.is_active)
        .map((b: any) => ({ name: b.name, amount: b.amount, frequency: b.frequency }));

      const { data, error } = await supabase.functions.invoke('financial-autopilot', {
        body: {
          expenses: recentExpenses,
          income: recentIncome,
          bills: activeBills,
          language,
        },
      });

      if (error) throw error;

      setInsights(data.insights || []);
      setLastGenerated(new Date());
    } catch (err) {
      console.error('Autopilot error:', err);
      toast.error(l ? 'Error al generar insights' : 'Error generating insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            {l ? 'Autopiloto Financiero IA' : 'AI Financial Autopilot'}
            <Badge variant="secondary" className="text-[9px]">AI</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? (l ? 'Analizando...' : 'Analyzing...') : (l ? 'Generar Insights' : 'Generate Insights')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {l
            ? 'IA analiza tus patrones financieros y genera recomendaciones accionables personalizadas'
            : 'AI analyzes your financial patterns and generates personalized actionable recommendations'}
        </p>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {!loading && insights.length === 0 && (
          <div className="text-center py-6">
            <Brain className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {l
                ? 'Presiona "Generar Insights" para recibir recomendaciones personalizadas basadas en tus datos'
                : 'Press "Generate Insights" for personalized recommendations based on your data'}
            </p>
          </div>
        )}

        {!loading && insights.length > 0 && (
          <div className="space-y-2.5">
            {insights.map((insight, i) => {
              const Icon = ICON_MAP[insight.type];
              const colors = COLOR_MAP[insight.type];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn("p-3 rounded-lg border", colors.border, colors.bg)}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", colors.text)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <Badge
                          variant="outline"
                          className={cn("text-[8px] px-1 py-0", {
                            'border-destructive/30 text-destructive': insight.priority === 'high',
                            'border-amber-500/30 text-amber-600': insight.priority === 'medium',
                            'border-muted': insight.priority === 'low',
                          })}
                        >
                          {insight.priority === 'high' ? '🔴' : insight.priority === 'medium' ? '🟡' : '🟢'} {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      {insight.impact && (
                        <p className={cn("text-[11px] font-medium mt-1", colors.text)}>
                          💰 {insight.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {lastGenerated && (
              <p className="text-[10px] text-muted-foreground text-right">
                {l ? 'Generado' : 'Generated'}: {lastGenerated.toLocaleTimeString()}
              </p>
            )}
            <LegalDisclaimer variant="general" size="compact" showLearnMore={false} className="mt-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
