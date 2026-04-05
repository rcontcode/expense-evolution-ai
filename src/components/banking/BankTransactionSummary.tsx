import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, RefreshCw, HelpCircle,
  ShoppingCart, Fuel, Utensils, ShoppingBag, Calendar,
  ArrowUpDown, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  groceries: ShoppingCart, supermercado: ShoppingCart,
  fuel: Fuel, combustible: Fuel, gas: Fuel,
  restaurants: Utensils, restaurantes: Utensils, food: Utensils,
  shopping: ShoppingBag, compras: ShoppingBag,
};

const TRANSFER_LABELS = [
  { key: 'rent', es: 'Arriendo', en: 'Rent' },
  { key: 'loan', es: 'Préstamo', en: 'Loan' },
  { key: 'savings', es: 'Ahorro', en: 'Savings' },
  { key: 'family', es: 'Familia', en: 'Family' },
  { key: 'other', es: 'Otro', en: 'Other' },
];

interface PatternGroup {
  description: string;
  transactions: any[];
  avgAmount: number;
  totalAmount: number;
  count: number;
  avgDay: number;
  isRecurring: boolean;
  type: 'income' | 'expense' | 'transfer' | 'unknown';
  category: string | null;
}

function normalizeDesc(desc: string): string {
  return (desc || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function detectPatterns(transactions: any[]): PatternGroup[] {
  const groups: Record<string, any[]> = {};
  
  for (const tx of transactions) {
    const key = normalizeDesc(tx.description || 'sin descripción');
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  return Object.entries(groups).map(([key, txs]) => {
    const amounts = txs.map(t => Math.abs(Number(t.amount)));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    const days = txs.map(t => new Date(t.transaction_date).getDate());
    const avgDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    
    // Detect recurrence: same description appearing 2+ times with similar amounts
    const amountVariance = amounts.length > 1 
      ? Math.max(...amounts) - Math.min(...amounts) 
      : 0;
    const isRecurring = txs.length >= 2 && (amountVariance / avgAmount) < 0.15;

    // Determine type from transaction_type field or amount sign
    const types = txs.map(t => t.transaction_type || (Number(t.amount) > 0 ? 'income' : 'expense'));
    const mainType = types.filter(t => t === 'income').length > types.length / 2 ? 'income' : 'expense';
    
    // Check if it's a transfer
    const descLower = (txs[0].description || '').toLowerCase();
    const isTransfer = descLower.includes('transfer') || descLower.includes('traspaso') || 
      descLower.includes('tef') || descLower.includes('envío');

    return {
      description: txs[0].description || 'Sin descripción',
      transactions: txs,
      avgAmount,
      totalAmount,
      count: txs.length,
      avgDay,
      isRecurring,
      type: isTransfer ? 'transfer' : mainType as any,
      category: txs[0].category || null,
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function BankTransactionSummary() {
  const { language } = useLanguage();
  const { formatCurrency } = useFormatCurrency();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useBankTransactions();
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [expanded, setExpanded] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter transactions by period
  const filteredTx = useMemo(() => {
    if (viewMode === 'annual') {
      const year = selectedMonth.split('-')[0];
      return transactions.filter(t => t.transaction_date.startsWith(year));
    }
    return transactions.filter(t => t.transaction_date.startsWith(selectedMonth));
  }, [transactions, viewMode, selectedMonth]);

  const patterns = useMemo(() => detectPatterns(filteredTx), [filteredTx]);

  const incomePatterns = useMemo(() => patterns.filter(p => p.type === 'income'), [patterns]);
  const recurringExpenses = useMemo(() => patterns.filter(p => p.type === 'expense' && p.isRecurring), [patterns]);
  const transferPatterns = useMemo(() => patterns.filter(p => p.type === 'transfer'), [patterns]);
  const nonRecurringExpenses = useMemo(() => patterns.filter(p => p.type === 'expense' && !p.isRecurring), [patterns]);

  const totalIncome = useMemo(() => incomePatterns.reduce((s, p) => s + p.totalAmount, 0), [incomePatterns]);
  const totalExpenses = useMemo(() => 
    [...recurringExpenses, ...nonRecurringExpenses].reduce((s, p) => s + p.totalAmount, 0), 
    [recurringExpenses, nonRecurringExpenses]
  );

  const handleLabelTransfer = useCallback(async (txIds: string[], category: string) => {
    if (!user) return;
    for (const id of txIds) {
      await supabase
        .from('bank_transactions')
        .update({ category })
        .eq('id', id)
        .eq('user_id', user.id);
    }
    queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    toast.success(language === 'es' ? 'Transferencia clasificada' : 'Transfer classified');
  }, [user, queryClient, language]);

  const handleConfirmRecurring = useCallback(async (txIds: string[]) => {
    if (!user) return;
    for (const id of txIds) {
      await supabase
        .from('bank_transactions')
        .update({ is_recurring: true, recurring_type: 'monthly' })
        .eq('id', id)
        .eq('user_id', user.id);
    }
    queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    toast.success(language === 'es' ? 'Recurrencia confirmada' : 'Recurrence confirmed');
  }, [user, queryClient, language]);

  // Available months from data
  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => t.transaction_date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  if (isLoading || transactions.length === 0) return null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === 'es' ? 'Resumen de Actividad Bancaria' : 'Bank Activity Summary'}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {filteredTx.length} {language === 'es' ? 'transacciones' : 'transactions'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Period selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="monthly" className="text-xs px-3 py-1">
                  {language === 'es' ? 'Mensual' : 'Monthly'}
                </TabsTrigger>
                <TabsTrigger value="annual" className="text-xs px-3 py-1">
                  {language === 'es' ? 'Anual' : 'Annual'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {viewMode === 'monthly' && (
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5 bg-background"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          {/* Totals bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {language === 'es' ? 'Ingresos' : 'Income'}
                </span>
              </div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  {language === 'es' ? 'Gastos' : 'Expenses'}
                </span>
              </div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              totalIncome - totalExpenses >= 0 
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {language === 'es' ? 'Neto' : 'Net'}
                </span>
              </div>
              <p className={cn("text-sm font-bold", totalIncome - totalExpenses >= 0 ? "text-blue-800 dark:text-blue-300" : "text-orange-800 dark:text-orange-300")}>
                {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
              </p>
            </div>
          </div>

          {/* Income patterns */}
          {incomePatterns.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                {language === 'es' ? 'Ingresos Detectados' : 'Detected Income'}
              </h4>
              <div className="space-y-2">
                {incomePatterns.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.isRecurring && (
                          <span className="inline-flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {language === 'es' 
                              ? `${p.count}x • ~día ${p.avgDay}` 
                              : `${p.count}x • ~day ${p.avgDay}`}
                          </span>
                        )}
                        {!p.isRecurring && `${p.count} ${language === 'es' ? 'veces' : 'times'}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(p.avgAmount)}
                        {p.isRecurring && <span className="text-xs font-normal text-muted-foreground">/{language === 'es' ? 'mes' : 'mo'}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recurring expenses */}
          {recurringExpenses.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                {language === 'es' ? 'Pagos Recurrentes' : 'Recurring Payments'}
              </h4>
              <div className="space-y-2">
                {recurringExpenses.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.count}x • ~{formatCurrency(p.avgAmount)}/{language === 'es' ? 'mes' : 'mo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.transactions[0]?.is_recurring ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Confirmado' : 'Confirmed'}
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" variant="outline" className="text-xs h-7"
                          onClick={() => handleConfirmRecurring(p.transactions.map(t => t.id))}
                        >
                          {language === 'es' ? 'Confirmar' : 'Confirm'}
                        </Button>
                      )}
                      <span className="text-sm font-bold text-foreground">{formatCurrency(p.avgAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Unidentified transfers */}
          {transferPatterns.filter(p => !p.category).length > 0 && (
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                {language === 'es' ? 'Transferencias Sin Identificar' : 'Unidentified Transfers'}
              </h4>
              <div className="space-y-2">
                {transferPatterns.filter(p => !p.category).slice(0, 5).map((p, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate">{p.description}</p>
                      <span className="text-sm font-bold">{formatCurrency(p.avgAmount)}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">
                        {language === 'es' ? '¿Qué es?' : "What's this?"}
                      </span>
                      {TRANSFER_LABELS.map(label => (
                        <Button 
                          key={label.key}
                          size="sm" variant="outline" className="text-[11px] h-6 px-2"
                          onClick={() => handleLabelTransfer(p.transactions.map(t => t.id), label.key)}
                        >
                          {language === 'es' ? label.es : label.en}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Non-recurring expenses by category */}
          {nonRecurringExpenses.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                {language === 'es' ? 'Gastos No Recurrentes' : 'Non-Recurring Expenses'}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {nonRecurringExpenses.slice(0, 8).map((p, i) => {
                  const catKey = (p.category || p.description || '').toLowerCase();
                  const Icon = Object.entries(CATEGORY_ICONS).find(([k]) => catKey.includes(k))?.[1] || ShoppingBag;
                  return (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{p.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.count} {language === 'es' ? 'compras' : 'purchases'}
                        </p>
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap">{formatCurrency(p.totalAmount)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </CardContent>
      )}
    </Card>
  );
}
