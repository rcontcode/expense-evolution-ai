import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuotaResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentUsage?: number;
  limit?: number;
  resetDate?: string;
}

const featureLabels: Record<string, { es: string; en: string }> = {
  ocr: { es: 'escaneos de recibos', en: 'receipt scans' },
  contracts: { es: 'análisis de contratos', en: 'contract analyses' },
  bank_analysis: { es: 'análisis bancarios', en: 'bank analyses' },
  voice_premium: { es: 'minutos de voz', en: 'voice minutes' },
  ai_credits: { es: 'consultas inteligentes', en: 'smart queries' },
  predictions: { es: 'predicciones', en: 'predictions' },
  autopilot: { es: 'análisis del autopiloto', en: 'autopilot analyses' },
  coaching: { es: 'sesiones de mentoría', en: 'mentorship sessions' },
};

/**
 * Shown when a user on the highest plan hits a monthly cap.
 * No upgrade CTA — just transparent info about when the quota resets.
 */
export function QuotaResetDialog({
  isOpen,
  onClose,
  feature,
  currentUsage,
  limit,
  resetDate,
}: QuotaResetDialogProps) {
  const { language } = useLanguage();
  const es = language === 'es';
  const labels = featureLabels[feature] ?? { es: 'esta función', en: 'this feature' };
  const label = es ? labels.es : labels.en;

  const reset = resetDate
    ? new Date(resetDate)
    : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));
  const resetLabel = reset.toLocaleDateString(es ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
  });

  const percentage =
    typeof limit === 'number' && limit > 0 && typeof currentUsage === 'number'
      ? Math.min(100, (currentUsage / limit) * 100)
      : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">
                {es ? 'Cupo mensual usado' : 'Monthly quota reached'}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm">
            {es
              ? `Has usado todos tus ${label} de este mes. Tu cupo se renueva automáticamente el ${resetLabel}.`
              : `You used all your ${label} this month. Your quota renews automatically on ${resetLabel}.`}
          </DialogDescription>
        </DialogHeader>

        {typeof limit === 'number' && limit > 0 && (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {es ? 'Uso este mes' : 'This month'}
              </span>
              <span className="font-medium">
                {currentUsage} / {limit}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 mt-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p>
            {es
              ? 'Ya estás en el plan más alto. No hay nada que mejorar — sólo esperar al reseteo o contactarnos si necesitas más capacidad.'
              : 'You are already on the top plan. Nothing to upgrade — just wait for the reset or contact us if you need more capacity.'}
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>
            {es ? 'Entendido' : 'Got it'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
