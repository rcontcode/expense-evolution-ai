import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeftRight, Trash2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DuplicateMatch } from '@/hooks/data/useContentDuplicateDetector';
import { cn } from '@/lib/utils';

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: DuplicateMatch[];
  newDocument: {
    vendor?: string;
    amount?: number;
    date?: string;
    description?: string;
  };
  onKeepBoth: () => void;
  onDeleteNew: () => void;
  onReplaceOld: () => void;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  matches,
  newDocument,
  onKeepBoth,
  onDeleteNew,
  onReplaceOld,
}: DuplicateWarningDialogProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const bestMatch = matches[0];
  if (!bestMatch) return null;

  const confidenceColor = {
    high: 'bg-destructive/15 text-destructive border-destructive/30',
    medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    low: 'bg-muted text-muted-foreground border-border',
  };

  const confidenceLabel = {
    high: isEs ? 'Alta coincidencia' : 'High match',
    medium: isEs ? 'Coincidencia parcial' : 'Partial match',
    low: isEs ? 'Baja coincidencia' : 'Low match',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {isEs ? 'Posible duplicado detectado' : 'Possible duplicate detected'}
          </DialogTitle>
          <DialogDescription>
            {isEs ? bestMatch.reason_es : bestMatch.reason_en}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Confidence badge */}
          <Badge variant="outline" className={cn('text-xs', confidenceColor[bestMatch.confidence])}>
            {confidenceLabel[bestMatch.confidence]}
          </Badge>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* New document */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
              <p className="text-xs font-medium text-primary">
                {isEs ? 'Nuevo' : 'New'}
              </p>
              <p className="text-sm font-semibold truncate">{newDocument.vendor || '—'}</p>
              <p className="text-sm">${Number(newDocument.amount || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{newDocument.date || '—'}</p>
            </div>

            {/* Existing match */}
            <div className="rounded-lg border border-muted bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {isEs ? 'Existente' : 'Existing'}
              </p>
              <p className="text-sm font-semibold truncate">{bestMatch.vendor || '—'}</p>
              <p className="text-sm">${bestMatch.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{bestMatch.date || '—'}</p>
              {bestMatch.file_name && (
                <p className="text-xs text-muted-foreground truncate">{bestMatch.file_name}</p>
              )}
            </div>
          </div>

          {matches.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {isEs
                ? `+${matches.length - 1} coincidencia(s) más encontrada(s)`
                : `+${matches.length - 1} more match(es) found`}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => { onDeleteNew(); onOpenChange(false); }}
          >
            <Trash2 className="h-4 w-4" />
            {isEs ? 'Es duplicado — eliminar nuevo' : 'Is duplicate — delete new'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => { onKeepBoth(); onOpenChange(false); }}
          >
            <Check className="h-4 w-4" />
            {isEs ? 'Son diferentes — conservar ambos' : 'Different — keep both'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={() => { onReplaceOld(); onOpenChange(false); }}
          >
            <ArrowLeftRight className="h-4 w-4" />
            {isEs ? 'Reemplazar el anterior' : 'Replace the old one'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
