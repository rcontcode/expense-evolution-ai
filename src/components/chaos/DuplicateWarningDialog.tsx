import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Trash2, Check, ArrowLeftRight, Receipt, FileText, Clock, RefreshCw, Eye, X, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DuplicateMatch } from '@/hooks/data/useContentDuplicateDetector';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDocumentBlobUrl } from '@/hooks/data/useDocumentUrl';
import { DocumentPreviewRenderer } from '@/components/shared/DocumentPreviewRenderer';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: DuplicateMatch[];
  newDocument: {
    vendor?: string;
    amount?: number;
    date?: string;
    time?: string;
    description?: string;
  };
  newDocId?: string;
  queuePosition?: number;
  queueTotal?: number;
  onKeepBoth: () => void;
  onDeleteNew: () => void;
  onReplaceOld: () => void;
}

interface DocPreview {
  blobUrl: string;
  fileName: string;
  mimeType: string;
}

function DocumentPreviewInline({ preview, label }: { preview: DocPreview | null; label: string }) {
  if (!preview) {
    return (
      <div className="flex-1 min-h-[200px] rounded-lg border border-dashed border-muted flex items-center justify-center">
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    );
  }

  const isPdf = preview.mimeType === 'application/pdf';

  return (
    <div className="flex-1 min-h-0 rounded-lg border overflow-hidden flex flex-col">
      <p className="text-xs font-medium px-2 py-1 bg-muted/50 truncate">{preview.fileName}</p>
      <div className="flex-1 min-h-[200px] max-h-[300px] overflow-auto bg-muted/20">
        {isPdf ? (
          <object data={preview.blobUrl} type="application/pdf" className="w-full h-[280px]">
            <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
              No pude previsualizar este PDF aquí.
            </div>
          </object>
        ) : (
          <img src={preview.blobUrl} alt={preview.fileName} className="w-full h-auto object-contain" />
        )}
      </div>
    </div>
  );
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  matches,
  newDocument,
  newDocId,
  queuePosition,
  queueTotal,
  onKeepBoth,
  onDeleteNew,
  onReplaceOld,
}: DuplicateWarningDialogProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [showComparison, setShowComparison] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [newDocPreview, setNewDocPreview] = useState<DocPreview | null>(null);
  const [existingDocPreview, setExistingDocPreview] = useState<DocPreview | null>(null);

  const bestMatch = matches[0];

  // Cleanup blob URLs when dialog closes
  useEffect(() => {
    if (!open) {
      if (newDocPreview?.blobUrl) URL.revokeObjectURL(newDocPreview.blobUrl);
      if (existingDocPreview?.blobUrl) URL.revokeObjectURL(existingDocPreview.blobUrl);
      setNewDocPreview(null);
      setExistingDocPreview(null);
      setShowComparison(false);
    }
  }, [open]);

  if (!bestMatch) return null;

  const isRecurring = bestMatch.is_recurring_pattern;

  const getTitle = () => {
    if (bestMatch.confidence === 'high') {
      return isEs ? '🤔 Esto parece ser el mismo documento' : '🤔 This looks like the same document';
    }
    if (isRecurring) {
      return isEs ? '🔄 Compra frecuente detectada' : '🔄 Frequent purchase detected';
    }
    return isEs ? '🤔 Encontré algo similar' : '🤔 Found something similar';
  };

  const getDescription = () => {
    if (bestMatch.confidence === 'high') {
      return isEs
        ? 'Este documento parece ser el mismo que uno ya registrado. ¿Es duplicado?'
        : 'This document appears to be the same as one already registered. Is it a duplicate?';
    }
    if (isRecurring) {
      return isEs
        ? 'Este proveedor tiene compras frecuentes por el mismo monto. ¿Es una compra nueva o ya la tenías registrada?'
        : 'This vendor has frequent purchases for the same amount. Is this a new purchase or was it already registered?';
    }
    if (bestMatch.confidence === 'medium') {
      return isEs
        ? 'Encontré un registro similar. ¿Podrías confirmar si es el mismo?'
        : 'Found a similar record. Could you confirm if it\'s the same?';
    }
    return isEs
      ? 'Hay un registro parecido pero con diferencias. Probablemente son compras separadas.'
      : 'There\'s a similar record but with differences. These are probably separate purchases.';
  };

  const confidenceColor = {
    high: 'bg-destructive/15 text-destructive border-destructive/30',
    medium: 'bg-accent text-accent-foreground border-border',
    low: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  };

  const confidenceLabel = {
    high: isEs ? 'Muy similar' : 'Very similar',
    medium: isEs ? 'Parecido' : 'Similar',
    low: isEs ? 'Probablemente diferente' : 'Probably different',
  };

  const MatchIcon = bestMatch.type === 'expense' ? Receipt : FileText;

  const handleViewDocuments = async () => {
    setLoadingPreviews(true);
    try {
      const promises: Promise<void>[] = [];

      if (newDocId) {
        promises.push(
          getDocumentBlobUrl(newDocId).then(result => { setNewDocPreview(result); })
        );
      }

      const existingDocId = bestMatch.type === 'document' ? bestMatch.id : bestMatch.document_id;
      if (existingDocId) {
        promises.push(
          getDocumentBlobUrl(existingDocId).then(result => { setExistingDocPreview(result); })
        );
      }

      await Promise.all(promises);

      if (!newDocId && !existingDocId) {
        toast.info(isEs ? 'No hay documentos disponibles para ver' : 'No documents available to view');
        return;
      }

      setShowComparison(true);
    } catch {
      toast.error(isEs ? 'Error al cargar documentos' : 'Error loading documents');
    } finally {
      setLoadingPreviews(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("transition-all", showComparison ? "max-w-3xl" : "max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="flex-1">
              {getTitle()}
            </span>
            {queueTotal && queueTotal > 1 && (
              <Badge variant="secondary" className="text-xs ml-2">
                {queuePosition}/{queueTotal}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', confidenceColor[bestMatch.confidence])}>
              {confidenceLabel[bestMatch.confidence]}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <MatchIcon className="h-3 w-3" />
              {bestMatch.type === 'expense' 
                ? (isEs ? 'Gasto registrado' : 'Registered expense')
                : (isEs ? 'Documento' : 'Document')}
            </Badge>
            {isRecurring && (
              <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
                <RefreshCw className="h-3 w-3" />
                {isEs ? 'Recurrente' : 'Recurring'}
              </Badge>
            )}
          </div>

          {/* Comparison metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
              <p className="text-xs font-medium text-primary">
                {isEs ? 'Nuevo' : 'New'}
              </p>
              <p className="text-sm font-semibold truncate">{newDocument.vendor || '—'}</p>
              <p className="text-sm">${Number(newDocument.amount || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{newDocument.date || '—'}</p>
              {newDocument.time && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {newDocument.time}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-muted bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {isEs ? 'Existente' : 'Existing'}
              </p>
              <p className="text-sm font-semibold truncate">{bestMatch.vendor || '—'}</p>
              <p className="text-sm">${bestMatch.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{bestMatch.date || '—'}</p>
              {bestMatch.time && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {bestMatch.time}
                </p>
              )}
              {bestMatch.file_name && (
                <p className="text-xs text-muted-foreground truncate">{bestMatch.file_name}</p>
              )}
            </div>
          </div>

          {/* Inline document comparison */}
          {showComparison && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {isEs ? 'Comparación visual' : 'Visual comparison'}
                </p>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowComparison(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-3">
                <DocumentPreviewInline
                  preview={newDocPreview}
                  label={isEs ? 'Nuevo (no disponible)' : 'New (not available)'}
                />
                <DocumentPreviewInline
                  preview={existingDocPreview}
                  label={isEs ? 'Existente (no disponible)' : 'Existing (not available)'}
                />
              </div>
            </div>
          )}

          {/* Contextual hint */}
          {bestMatch.confidence === 'low' && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 italic">
              {isEs
                ? '💡 Las diferencias sugieren que son compras separadas. Puedes conservar ambos con tranquilidad.'
                : '💡 The differences suggest these are separate purchases. You can safely keep both.'}
            </p>
          )}

          {/* Additional matches */}
          {matches.length > 1 && (
            <ScrollArea className="max-h-32">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {isEs
                    ? `+${matches.length - 1} coincidencia(s) más:`
                    : `+${matches.length - 1} more match(es):`}
                </p>
                {matches.slice(1).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground rounded border p-2">
                    {m.type === 'expense' ? <Receipt className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{m.vendor || '?'}</span>
                    <span>${m.amount.toFixed(2)}</span>
                    <span>{m.date}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!showComparison && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={loadingPreviews}
              onClick={handleViewDocuments}
            >
              <Eye className="h-4 w-4" />
              {loadingPreviews
                ? (isEs ? 'Cargando...' : 'Loading...')
                : (isEs ? 'Ver documentos para comparar' : 'View documents to compare')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            onClick={() => { onKeepBoth(); }}
          >
            <Check className="h-4 w-4" />
            {isEs ? 'Es una compra nueva — conservar' : 'New purchase — keep both'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => { onDeleteNew(); }}
          >
            <Trash2 className="h-4 w-4" />
            {isEs ? 'Sí, es duplicado — eliminar' : 'Yes, duplicate — delete'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={() => { onReplaceOld(); }}
          >
            <ArrowLeftRight className="h-4 w-4" />
            {isEs ? 'Reemplazar el anterior' : 'Replace the old one'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
