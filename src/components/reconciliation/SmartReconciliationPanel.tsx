import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles, CheckCircle2, XCircle, ArrowRight, Loader2, Zap, Link2, Plus,
  Brain, ChevronDown, ChevronUp, AlertTriangle, RotateCcw, PlusCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import {
  useBankTransactions,
  useBankTransactionsWithMatches,
  useMatchTransaction,
  useMarkAsDiscrepancy,
  TransactionWithMatches,
} from '@/hooks/data/useBankTransactions';
import { useExpenses, useCreateExpense } from '@/hooks/data/useExpenses';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AIMatch {
  transaction_id: string;
  expense_id: string;
  confidence: number;
  reason: string;
}

interface AIUnmatchedSuggestion {
  transaction_id: string;
  suggested_category: string;
  suggested_vendor?: string;
  reason: string;
}

interface AIReconciliationResult {
  matches: AIMatch[];
  unmatched_suggestions: AIUnmatchedSuggestion[];
  summary: string;
}

export function SmartReconciliationPanel() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  
  const { data: transactions = [] } = useBankTransactions();
  const { data: transactionsWithMatches = [] } = useBankTransactionsWithMatches();
  const { data: expenses = [] } = useExpenses();
  const matchTransaction = useMatchTransaction();
  const markAsDiscrepancy = useMarkAsDiscrepancy();

  const [aiResult, setAiResult] = useState<AIReconciliationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [expandedTx, setExpandedTx] = useState<Set<string>>(new Set());

  const pendingTx = transactions.filter(t => t.status === 'pending' || !t.matched_expense_id);
  const unmatchedExpenses = expenses.filter(e => !e.deleted_at && !transactions.some(t => t.matched_expense_id === e.id));

  // Merge algorithmic + AI matches
  const enrichedMatches = useMemo(() => {
    const map = new Map<string, {
      transaction: TransactionWithMatches;
      aiMatch?: AIMatch;
      algoMatches: typeof transactionsWithMatches[0]['suggestedMatches'];
    }>();

    for (const tx of transactionsWithMatches) {
      map.set(tx.id, { transaction: tx, algoMatches: tx.suggestedMatches });
    }

    if (aiResult) {
      for (const m of aiResult.matches) {
        const existing = map.get(m.transaction_id);
        if (existing) {
          existing.aiMatch = m;
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => {
        const aScore = a.aiMatch?.confidence || (a.algoMatches[0]?.score || 0);
        const bScore = b.aiMatch?.confidence || (b.algoMatches[0]?.score || 0);
        return bScore - aScore;
      });
  }, [transactionsWithMatches, aiResult]);

  const highConfidenceMatches = enrichedMatches.filter(m => 
    (m.aiMatch && m.aiMatch.confidence >= 85) || (m.algoMatches[0]?.score >= 90)
  );

  const runAIReconciliation = async () => {
    if (pendingTx.length === 0) {
      toast.info(l ? 'No hay transacciones pendientes' : 'No pending transactions');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-reconcile', {
        body: {
          transactions: pendingTx.slice(0, 50),
          expenses: unmatchedExpenses.slice(0, 100),
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAiResult(data);

      // Auto-select high confidence matches
      const autoSelect = new Set<string>();
      (data.matches || []).forEach((m: AIMatch) => {
        if (m.confidence >= 90) autoSelect.add(m.transaction_id);
      });
      setSelectedMatches(autoSelect);

      toast.success(l 
        ? `IA encontró ${data.matches?.length || 0} coincidencias` 
        : `AI found ${data.matches?.length || 0} matches`
      );
    } catch (err: any) {
      console.error('AI reconciliation error:', err);
      if (err.message?.includes('429') || err.message?.includes('Rate limit')) {
        toast.error(l ? 'Límite de velocidad excedido, intenta más tarde' : 'Rate limit exceeded, try again later');
      } else if (err.message?.includes('402')) {
        toast.error(l ? 'Créditos de IA agotados' : 'AI credits exhausted');
      } else {
        toast.error(l ? 'Error en análisis IA' : 'AI analysis error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedMatches.size === 0) return;
    setIsBatchProcessing(true);

    let success = 0;
    for (const txId of selectedMatches) {
      const enriched = enrichedMatches.find(m => m.transaction.id === txId);
      const expenseId = enriched?.aiMatch?.expense_id || enriched?.algoMatches[0]?.expense?.id;
      if (expenseId) {
        try {
          await matchTransaction.mutateAsync({ transactionId: txId, expenseId });
          success++;
        } catch { /* continue */ }
      }
    }

    setSelectedMatches(new Set());
    setIsBatchProcessing(false);
    toast.success(l ? `${success} transacciones conciliadas` : `${success} transactions reconciled`);
  };

  const handleBatchReject = () => {
    selectedMatches.forEach(txId => {
      markAsDiscrepancy.mutate(txId);
    });
    setSelectedMatches(new Set());
  };

  const toggleSelect = (txId: string) => {
    setSelectedMatches(prev => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId); else next.add(txId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMatches.size === highConfidenceMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(highConfidenceMatches.map(m => m.transaction.id)));
    }
  };

  const toggleExpand = (txId: string) => {
    setExpandedTx(prev => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId); else next.add(txId);
      return next;
    });
  };

  if (pendingTx.length === 0 && !aiResult) return null;

  return (
    <Card className="border-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-chart-2/3" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/20">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                {l ? '🤖 Conciliación Inteligente' : '🤖 Smart Reconciliation'}
              </CardTitle>
              <CardDescription className="text-xs">
                {l ? `${pendingTx.length} transacciones pendientes • ${unmatchedExpenses.length} gastos sin vincular`
                   : `${pendingTx.length} pending transactions • ${unmatchedExpenses.length} unlinked expenses`}
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={runAIReconciliation} 
            disabled={isAnalyzing || pendingTx.length === 0}
            size="sm"
            className="bg-gradient-to-r from-primary to-chart-2 text-white shadow-lg"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {isAnalyzing 
              ? (l ? 'Analizando...' : 'Analyzing...') 
              : (l ? 'Analizar con IA' : 'AI Analysis')}
          </Button>
        </div>

        {/* AI Summary */}
        {aiResult?.summary && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
          >
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              {aiResult.summary}
            </p>
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {/* Batch Actions */}
        {enrichedMatches.length > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedMatches.size > 0 && selectedMatches.size === highConfidenceMatches.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-muted-foreground">
                {selectedMatches.size > 0 
                  ? (l ? `${selectedMatches.size} seleccionadas` : `${selectedMatches.size} selected`)
                  : (l ? 'Seleccionar alta confianza' : 'Select high confidence')}
              </span>
            </div>
            {selectedMatches.size > 0 && (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBatchReject} disabled={isBatchProcessing}>
                  <XCircle className="h-3 w-3 mr-1" />
                  {l ? 'Rechazar' : 'Reject'}
                </Button>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleBatchApprove} disabled={isBatchProcessing}>
                  {isBatchProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {l ? `Aprobar (${selectedMatches.size})` : `Approve (${selectedMatches.size})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Match List */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            <AnimatePresence>
              {enrichedMatches.map((item, i) => {
                const tx = item.transaction;
                const bestExpenseId = item.aiMatch?.expense_id || item.algoMatches[0]?.expense?.id;
                const bestScore = item.aiMatch?.confidence || item.algoMatches[0]?.score || 0;
                const bestReason = item.aiMatch?.reason || '';
                const matchedExpense = expenses.find(e => e.id === bestExpenseId);
                const isSelected = selectedMatches.has(tx.id);
                const isExpanded = expandedTx.has(tx.id);
                const isHighConf = bestScore >= 85;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isHighConf ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-background',
                      isSelected && 'ring-2 ring-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {bestExpenseId && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(tx.id)}
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{tx.description || '—'}</p>
                          <Badge variant="outline" className={cn(
                            "text-[10px] shrink-0",
                            bestScore >= 90 ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' :
                            bestScore >= 70 ? 'bg-primary/10 text-primary border-primary/20' :
                            bestScore >= 50 ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {bestScore > 0 ? `${bestScore}%` : (l ? 'Sin match' : 'No match')}
                            {item.aiMatch && <Sparkles className="h-2.5 w-2.5 ml-0.5 inline" />}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{format(new Date(tx.transaction_date), 'dd MMM', { locale: l ? es : undefined })}</span>
                          <span>•</span>
                          <span className="font-bold text-foreground">{fc(Number(tx.amount))}</span>
                          {matchedExpense && (
                            <>
                              <ArrowRight className="h-2.5 w-2.5" />
                              <span className="truncate">{matchedExpense.vendor || matchedExpense.description || '—'}</span>
                            </>
                          )}
                        </div>
                        {bestReason && (
                          <p className="text-[10px] text-primary/70 mt-0.5 italic">{bestReason}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {bestExpenseId && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600"
                            onClick={() => matchTransaction.mutate({ transactionId: tx.id, expenseId: bestExpenseId })}
                            disabled={matchTransaction.isPending}>
                            <Link2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => markAsDiscrepancy.mutate(tx.id)}>
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                        {item.algoMatches.length > 1 && (
                          <Button size="sm" variant="ghost" className="h-7 px-1.5"
                            onClick={() => toggleExpand(tx.id)}>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded: show all alternative matches */}
                    {isExpanded && item.algoMatches.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {l ? 'Alternativas:' : 'Alternatives:'}
                        </p>
                        {item.algoMatches.slice(1).map(alt => (
                          <div key={alt.expense.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="truncate">{alt.expense.vendor || alt.expense.description || '—'}</span>
                              <Badge variant="outline" className="text-[9px]">{alt.score}%</Badge>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                              onClick={() => matchTransaction.mutate({ transactionId: tx.id, expenseId: alt.expense.id })}>
                              <Link2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* AI Unmatched Suggestions */}
        {aiResult?.unmatched_suggestions && aiResult.unmatched_suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Plus className="h-3 w-3" />
              {l ? 'IA sugiere crear estos gastos:' : 'AI suggests creating these expenses:'}
            </p>
            {aiResult.unmatched_suggestions.slice(0, 5).map((s, i) => {
              const tx = transactions.find(t => t.id === s.transaction_id);
              if (!tx) return null;
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs">
                  <div>
                    <p className="font-medium">{tx.description || '—'} — {fc(Number(tx.amount))}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {l ? 'Categoría sugerida' : 'Suggested category'}: <span className="capitalize">{s.suggested_category}</span>
                      {s.reason && ` • ${s.reason}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {enrichedMatches.length === 0 && !isAnalyzing && (
          <div className="text-center py-6">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {l ? 'Ejecuta el análisis IA para obtener sugerencias inteligentes' : 'Run AI analysis to get smart suggestions'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
