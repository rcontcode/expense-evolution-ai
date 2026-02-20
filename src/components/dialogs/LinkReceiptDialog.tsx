import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Image, Check, FileText, Info, Star, Eye, ChevronUp, RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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

// Interactive image viewer with zoom, pan, rotate
function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale(s => Math.max(0.3, Math.min(s + delta, 5)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-lg p-1">
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleRotate} title="Rotate">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleReset} title="Reset">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      {/* Image area */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border bg-black/5 dark:bg-white/5 h-80 cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute top-1/2 left-1/2 max-w-none transition-transform duration-100"
          style={{
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
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
        if (docAmount > 0 && Math.abs(Number(exp.amount) - docAmount) < 0.02) score += 50;
        if (docDate && exp.date === docDate) score += 30;
        score += vendorSimilarity(docVendor, exp.vendor || '') * 20;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = exp;
        }
      }

      return { doc, vendor: docVendor || '—', amount: docAmount, date: docDate, bestMatch: bestScore >= 40 ? bestMatch : null, matchScore: bestScore };
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                ? '💡 Tip: Los recibos con ⭐ coinciden en monto y proveedor. Haz click en 👁 para ver la foto con zoom, rotación y arrastre.'
                : '💡 Tip: Receipts with ⭐ match by amount and vendor. Click 👁 to view the photo with zoom, rotation and drag.'}
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
          <div className="space-y-3">
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
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <button
                        className="shrink-0 w-20 h-20 rounded-lg bg-muted overflow-hidden border hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                      >
                        {previewUrls[doc.id] ? (
                          <img src={previewUrls[doc.id]} alt={doc.file_name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {hasSuggestion && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          <p className="text-sm font-medium truncate">{vendor}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                          {amount > 0 && <span className="font-semibold text-foreground">${amount.toFixed(2)}</span>}
                          {date && <span>{date}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-1">{doc.file_name}</p>
                      </div>

                      {/* Expand button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 shrink-0"
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        <span className="text-xs">{isExpanded ? (language === 'es' ? 'Cerrar' : 'Close') : (language === 'es' ? 'Ver foto' : 'View')}</span>
                      </Button>
                    </div>

                    {/* Expanded interactive image viewer */}
                    {isExpanded && previewUrls[doc.id] && (
                      <ImageViewer src={previewUrls[doc.id]} alt={doc.file_name} />
                    )}

                    {/* Suggested match */}
                    {hasSuggestion && bestMatch && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <Star className="h-4 w-4 text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                            {language === 'es' ? 'Coincide con:' : 'Matches:'}
                          </p>
                          <p className="text-sm font-semibold">{bestMatch.vendor} · ${Number(bestMatch.amount).toFixed(2)} · {bestMatch.date}</p>
                        </div>
                        <Button
                          size="sm"
                          className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white"
                          disabled={linking === doc.id}
                          onClick={() => handleLink(doc.id, bestMatch.id)}
                        >
                          {linking === doc.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <>
                              <Link className="h-3.5 w-3.5 mr-1.5" />
                              {language === 'es' ? 'Vincular' : 'Link'}
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* No match - manual link */}
                    {!hasSuggestion && targetExpenses.length > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground flex-1">
                          {language === 'es'
                            ? 'Sin coincidencia automática. Vincúlalo manualmente:'
                            : 'No automatic match. Link it manually:'}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4"
                          disabled={linking === doc.id}
                          onClick={() => handleLink(doc.id, targetExpenses[0].id)}
                        >
                          <Link className="h-3.5 w-3.5 mr-1.5" />
                          {language === 'es' ? 'Vincular' : 'Link'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Remaining warning */}
        {remainingCount > 0 && !loading && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
              {language === 'es'
                ? `⚠️ Aún quedan ${remainingCount} gastos sin recibo. Sube fotos desde "Captura Rápida" o elimina los que no necesites.`
                : `⚠️ ${remainingCount} expenses still without receipt. Upload photos from "Quick Capture" or delete unneeded ones.`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
