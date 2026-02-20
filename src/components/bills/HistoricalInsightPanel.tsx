import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface HistoricalInsight {
  count: number;
  min: number;
  max: number;
  avg: number;
  suggestedDay: number | null;
  dates: string[];
}

interface HistoricalInsightPanelProps {
  candidateName: string | null;
  open: boolean;
  onApplyAverage: (avg: number) => void;
  onApplySuggestedDay: (day: number) => void;
}

export function HistoricalInsightPanel({ candidateName, open, onApplyAverage, onApplySuggestedDay }: HistoricalInsightPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const l = language === 'es';

  const [insight, setInsight] = useState<HistoricalInsight | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !candidateName || !user) {
      setInsight(null);
      return;
    }

    const fetchHistorical = async () => {
      setLoading(true);
      try {
        const searchTerm = candidateName.toLowerCase().split(' ')[0];
        if (searchTerm.length < 3) { setLoading(false); return; }

        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, date, vendor')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .or(`vendor.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('date', { ascending: false })
          .limit(24);

        if (expenses && expenses.length >= 2) {
          const amounts = expenses.map(e => Number(e.amount));
          const dates = expenses.map(e => e.date);
          const days = dates.map(d => new Date(d).getDate());

          const dayFreq: Record<number, number> = {};
          days.forEach(d => { dayFreq[d] = (dayFreq[d] || 0) + 1; });
          const suggestedDay = Object.entries(dayFreq)
            .sort((a, b) => b[1] - a[1])[0]?.[0];

          setInsight({
            count: expenses.length,
            min: Math.min(...amounts),
            max: Math.max(...amounts),
            avg: Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length * 100) / 100,
            suggestedDay: suggestedDay ? parseInt(suggestedDay) : null,
            dates,
          });
        } else {
          setInsight(null);
        }
      } catch {
        setInsight(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorical();
  }, [open, candidateName, user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{l ? 'Analizando historial...' : 'Analyzing history...'}</span>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary">
          {l ? `${insight.count} registros encontrados` : `${insight.count} records found`}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 rounded bg-background/80">
          <p className="text-[10px] text-muted-foreground">{l ? 'Mín' : 'Min'}</p>
          <p className="text-xs font-bold">${insight.min.toFixed(2)}</p>
        </div>
        <button
          onClick={() => onApplyAverage(insight.avg)}
          className="text-center p-1.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20"
          title={l ? 'Usar promedio' : 'Use average'}
        >
          <p className="text-[10px] text-primary font-medium">{l ? 'Promedio' : 'Avg'}</p>
          <p className="text-xs font-bold text-primary">${insight.avg.toFixed(2)}</p>
        </button>
        <div className="text-center p-1.5 rounded bg-background/80">
          <p className="text-[10px] text-muted-foreground">{l ? 'Máx' : 'Max'}</p>
          <p className="text-xs font-bold">${insight.max.toFixed(2)}</p>
        </div>
      </div>
      {insight.suggestedDay && (
        <button
          onClick={() => onApplySuggestedDay(insight.suggestedDay!)}
          className="w-full flex items-center gap-2 p-2 rounded bg-background/80 hover:bg-accent/50 transition-colors text-left cursor-pointer"
        >
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {l
              ? `Fecha más frecuente: día ${insight.suggestedDay} — toca para aplicar`
              : `Most frequent date: day ${insight.suggestedDay} — tap to apply`}
          </span>
        </button>
      )}
    </div>
  );
}
