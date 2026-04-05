import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { 
  Landmark, ArrowUpRight, ArrowDownRight, 
  RefreshCw, TrendingUp, ExternalLink, Clock
} from 'lucide-react';

export function BankingSummaryCard({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatCompact } = useFormatCurrency();
  const { data: transactions = [], isLoading } = useBankTransactions();
  const l = language === 'es';

  // Last import session
  const { data: lastSession } = useQuery({
    queryKey: ['last-bank-import-session', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bank_import_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('imported_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!transactions.length) return null;

    const classified = transactions.filter(t => t.category && t.category !== 'uncategorized');
    const pending = transactions.filter(t => !t.category || t.category === 'uncategorized');
    const income = transactions.filter(t => t.transaction_type === 'income' || t.transaction_type === 'credit');
    const expenses = transactions.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'debit');
    const recurring = transactions.filter(t => t.is_recurring);
    const linked = transactions.filter(t => t.matched_expense_id || t.matched_income_id);

    const incomeTotal = income.reduce((s, t) => s + Math.abs(t.amount), 0);
    const expenseTotal = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);

    return {
      total: transactions.length,
      classified: classified.length,
      pending: pending.length,
      incomeCount: income.length,
      incomeTotal,
      expenseCount: expenses.length,
      expenseTotal,
      recurringCount: recurring.length,
      linkedCount: linked.length,
      classifiedPct: Math.round((classified.length / transactions.length) * 100),
    };
  }, [transactions]);

  if (isLoading) {
    return <Skeleton className={compact ? "h-24" : "h-40"} />;
  }

  if (!stats || stats.total === 0) return null;

  const fmt = (n: number) => formatCompact(n);

  if (compact) {
    return (
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => navigate('/banking')}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Landmark className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {l ? 'Resumen Bancario' : 'Banking Summary'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {stats.total} {l ? 'transacciones' : 'transactions'} · {stats.classifiedPct}% {l ? 'clasificado' : 'classified'}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-success/10 p-2">
              <ArrowDownRight className="h-3 w-3 text-success mx-auto mb-1" />
              <p className="text-xs font-bold text-success">{fmt(stats.incomeTotal)}</p>
              <p className="text-[10px] text-muted-foreground">{stats.incomeCount} {l ? 'ingresos' : 'income'}</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-2">
              <ArrowUpRight className="h-3 w-3 text-destructive mx-auto mb-1" />
              <p className="text-xs font-bold text-destructive">{fmt(stats.expenseTotal)}</p>
              <p className="text-[10px] text-muted-foreground">{stats.expenseCount} {l ? 'gastos' : 'expenses'}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <RefreshCw className="h-3 w-3 text-primary mx-auto mb-1" />
              <p className="text-xs font-bold">{stats.recurringCount}</p>
              <p className="text-[10px] text-muted-foreground">{l ? 'recurrentes' : 'recurring'}</p>
            </div>
          </div>

          {stats.pending > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
              <Clock className="h-3 w-3" />
              {stats.pending} {l ? 'sin clasificar' : 'unclassified'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-section="banking-summary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {l ? 'Resumen Bancario' : 'Banking Summary'}
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/banking')} className="gap-1">
            <TrendingUp className="h-4 w-4" />
            {l ? 'Ver detalle' : 'View detail'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            icon={<ArrowDownRight className="h-4 w-4 text-success" />}
            label={l ? 'Ingresos' : 'Income'}
            value={fmt(stats.incomeTotal)}
            sub={`${stats.incomeCount} ${l ? 'transacciones' : 'transactions'}`}
            color="success"
          />
          <StatBox
            icon={<ArrowUpRight className="h-4 w-4 text-destructive" />}
            label={l ? 'Gastos' : 'Expenses'}
            value={fmt(stats.expenseTotal)}
            sub={`${stats.expenseCount} ${l ? 'transacciones' : 'transactions'}`}
            color="destructive"
          />
          <StatBox
            icon={<RefreshCw className="h-4 w-4 text-primary" />}
            label={l ? 'Recurrentes' : 'Recurring'}
            value={String(stats.recurringCount)}
            sub={l ? 'pagos detectados' : 'detected payments'}
            color="primary"
          />
          <StatBox
            icon={<Landmark className="h-4 w-4 text-muted-foreground" />}
            label={l ? 'Vinculadas' : 'Linked'}
            value={`${stats.linkedCount}/${stats.total}`}
            sub={l ? 'con gasto/ingreso' : 'with expense/income'}
            color="muted"
          />
        </div>

        {/* Classification bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{l ? 'Clasificación' : 'Classification'}</span>
            <span className="font-medium">{stats.classifiedPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${stats.classifiedPct}%` }}
            />
          </div>
        </div>

        {/* Last import */}
        {lastSession && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
            <Clock className="h-3 w-3" />
            {l ? 'Última importación:' : 'Last import:'}{' '}
            {new Date(lastSession.imported_at || lastSession.created_at).toLocaleDateString(l ? 'es-CL' : 'en-US')}
            {' · '}
            <Badge variant="outline" className="text-[10px]">
              {lastSession.source_type?.toUpperCase() || 'CSV'}
            </Badge>
            {' · '}
            {lastSession.total_transactions} {l ? 'transacciones' : 'transactions'}
          </div>
        )}

        {/* Pending warning */}
        {stats.pending > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/20">
            <span className="text-sm text-warning flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {stats.pending} {l ? 'transacciones sin clasificar' : 'unclassified transactions'}
            </span>
            <Button size="sm" variant="outline" onClick={() => navigate('/banking')} className="text-xs">
              {l ? 'Clasificar' : 'Classify'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statBoxColors: Record<string, string> = {
  success: 'bg-emerald-500/5 border-emerald-500/10',
  destructive: 'bg-red-500/5 border-red-500/10',
  primary: 'bg-primary/5 border-primary/10',
  muted: 'bg-muted/50 border-border',
};

function StatBox({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${statBoxColors[color] || 'bg-muted/50 border-border'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
