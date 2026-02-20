import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Image, Check, FileText, Info, Star, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ExpenseWithRelations } from '@/types/expense.types';

interface OrphanDocument {
  id: string;
  file_name: string;
  file_path: string;
  extracted_data: any;
  created_at: string;
}

interface LinkReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  expenseIds: string[];
  expenses?: ExpenseWithRelations[];
}

function vendorSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  let matches = 0;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

export function LinkReceiptDialog({ open, onClose, expenseIds, expenses = [] }: LinkReceiptDialogProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [orphanDocs, setOrphanDocs] = useState<OrphanDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [linkedExpenseIds, setLinkedExpenseIds] = useState<Set<string>>(new Set());

  // Target expenses (the ones missing receipts)
  const targetExpenses = useMemo(() => {
    return expenses.filter(e => expenseIds.includes(e.id) && !linkedExpenseIds.has(e.id));
  }, [expenses, expenseIds, linkedExpenseIds]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLinkedExpenseIds(new Set());
    supabase
      .from('documents')
      .select('id, file_name, file_path, extracted_data, created_at')
      .is('expense_id', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const docs = (data as OrphanDocument[]) || [];
        setOrphanDocs(docs);
        setLoading(false);
        // Load thumbnails
        docs.forEach(async (doc) => {
          const { data: urlData } = await supabase.storage
            .from('expense-documents')
            .createSignedUrl(doc.file_path, 3600);
          if (urlData?.signedUrl) {
            setPreviewUrls(prev => ({ ...prev, [doc.id]: urlData.signedUrl }));
          }
        });
      });
  }, [open]);

  // Compute match suggestions
  const docsWithMatches = useMemo(() => {
    return orphanDocs.map(doc => {
      const data = doc.extracted_data || {};
      const docVendor = data.vendor || data.store_name || '';
      const docAmount = parseFloat(data.amount || data.total || '0');
      const docDate = data.date || '';

      let bestMatch: ExpenseWithRelations | null = null;
      let bestScore = 0;

      for (const exp of targetExpenses) {
        let score = 0;
        // Amount match (exact)
        if (docAmount > 0 && Math.abs(Number(exp.amount) - docAmount) < 0.02) {
          score += 50;
        }
        // Date match
        if (docDate && exp.date === docDate) {
          score += 30;
        }
        // Vendor similarity
        const sim = vendorSimilarity(docVendor, exp.vendor || '');
        score += sim * 20;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = exp;
        }
      }

      return {
        doc,
        vendor: docVendor || '—',
        amount: docAmount,
        date: docDate,
        bestMatch: bestScore >= 40 ? bestMatch : null,
        matchScore: bestScore,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [orphanDocs, targetExpenses]);

  const handleLink = async (docId: string, expenseId: string) => {
    setLinking(docId);
    try {
      await supabase.from('expenses').update({ document_id: docId }).eq('id', expenseId);
      await supabase.from('documents').update({ expense_id: expenseId } as any).eq('id', docId);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(language === 'es' ? '✅ Recibo vinculado exitosamente' : '✅ Receipt linked successfully');
      setOrphanDocs(prev => prev.filter(d => d.id !== docId));
      setLinkedExpenseIds(prev => new Set([...prev, expenseId]));
    } catch {
      toast.error(language === 'es' ? 'Error al vincular' : 'Error linking');
    } finally {
      setLinking(null);
    }
  };

  const remainingCount = targetExpenses.length;
  const suggestedCount = docsWithMatches.filter(d => d.bestMatch).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Vincular Recibos a Gastos' : 'Link Receipts to Expenses'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es'
              ? 'Conecta fotos de recibos existentes con gastos que no tienen comprobante'
              : 'Connect existing receipt photos with expenses that have no proof'}
          </DialogDescription>
        </DialogHeader>

        {/* Status summary */}
        <div className="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <p>
              {language === 'es'
                ? `📋 ${remainingCount} gastos sin recibo · ${orphanDocs.length} documentos disponibles`
                : `📋 ${remainingCount} expenses without receipt · ${orphanDocs.length} documents available`}
            </p>
            {suggestedCount > 0 && (
              <p className="font-semibold">
                {language === 'es'
                  ? `⭐ ${suggestedCount} coincidencias sugeridas por monto/fecha/proveedor`
                  : `⭐ ${suggestedCount} suggested matches by amount/date/vendor`}
              </p>
            )}
            <p className="text-blue-600/70 dark:text-blue-400/60">
              {language === 'es'
                ? '💡 Tip: Los recibos marcados con ⭐ coinciden en monto y proveedor con un gasto. ¡Vincúlalos con un click!'
                : '💡 Tip: Receipts marked with ⭐ match an expense by amount and vendor. Link them with one click!'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {language === 'es' ? 'Buscando documentos...' : 'Searching documents...'}
          </div>
        ) : orphanDocs.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {language === 'es'
                ? 'No hay documentos sin vincular. Sube fotos de recibos desde Captura Rápida.'
                : 'No unlinked documents found. Upload receipt photos from Quick Capture.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Suggested matches first */}
            {docsWithMatches.map(({ doc, vendor, amount, date, bestMatch, matchScore }) => {
              const isExpanded = expandedDoc === doc.id;
              const hasSuggestion = bestMatch !== null;

              return (
                <Card key={doc.id} className={cn(
                  'border transition-all',
                  hasSuggestion
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10'
                    : 'hover:border-primary/30'
                )}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      {/* Image preview */}
                      <div className="shrink-0 w-16 h-16 rounded-lg bg-muted overflow-hidden border">
                        {previewUrls[doc.id] ? (
                          <img
                            src={previewUrls[doc.id]}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {hasSuggestion && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          <p className="text-sm font-medium truncate">{vendor}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          {amount > 0 && <span className="font-medium">${amount.toFixed(2)}</span>}
                          {date && <span>{date}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{doc.file_name}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        {previewUrls[doc.id] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded image preview */}
                    {isExpanded && previewUrls[doc.id] && (
                      <div className="rounded-lg overflow-hidden border bg-black/5 dark:bg-white/5">
                        <img
                          src={previewUrls[doc.id]}
                          alt={doc.file_name}
                          className="w-full max-h-64 object-contain"
                        />
                      </div>
                    )}

                    {/* Suggested match */}
                    {hasSuggestion && bestMatch && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <Star className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-medium text-amber-800 dark:text-amber-300">
                            {language === 'es' ? 'Coincide con:' : 'Matches:'}{' '}
                            <span className="text-foreground">{bestMatch.vendor} · ${Number(bestMatch.amount).toFixed(2)} · {bestMatch.date}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                          disabled={linking === doc.id}
                          onClick={() => handleLink(doc.id, bestMatch.id)}
                        >
                          {linking === doc.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <>
                              <Link className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Vincular' : 'Link'}
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Manual link to any expense */}
                    {!hasSuggestion && targetExpenses.length > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-[11px] text-muted-foreground flex-1">
                          {language === 'es'
                            ? 'No se encontró coincidencia automática. Selecciona un gasto manualmente:'
                            : 'No automatic match found. Select an expense manually:'}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={linking === doc.id}
                          onClick={() => {
                            if (targetExpenses.length > 0) {
                              handleLink(doc.id, targetExpenses[0].id);
                            }
                          }}
                        >
                          <Link className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Vincular al primero' : 'Link to first'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Remaining unlinked expenses */}
        {remainingCount > 0 && !loading && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
              {language === 'es'
                ? `⚠️ Aún quedan ${remainingCount} gastos sin recibo. Puedes subir fotos desde "Captura Rápida" o eliminar los gastos que no necesites.`
                : `⚠️ ${remainingCount} expenses still have no receipt. You can upload photos from "Quick Capture" or delete expenses you don't need.`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
