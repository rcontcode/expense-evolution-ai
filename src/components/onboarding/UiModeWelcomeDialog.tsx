import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Layers } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';

interface UiModeWelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * One-time welcome dialog asking the user how they want to start:
 * Simple (just essentials) or Advanced (everything).
 */
export function UiModeWelcomeDialog({ open, onClose }: UiModeWelcomeDialogProps) {
  const { language } = useLanguage();
  const { setUiMode } = useDisplayPreferences();

  const choose = (mode: 'simple' | 'advanced') => {
    setUiMode(mode);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {language === 'es' ? '¿Cómo quieres empezar?' : 'How do you want to start?'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es'
              ? 'Puedes cambiarlo en cualquier momento desde el botón en la esquina superior.'
              : 'You can change this anytime from the toggle in the top corner.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {/* Simple */}
          <button
            type="button"
            onClick={() => choose('simple')}
            className="group flex items-start gap-4 p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:scale-[1.02] transition-all text-left"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-base mb-1">
                {language === 'es' ? 'Simple' : 'Simple'}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Solo lo esencial: balance, gastos, ingresos, presupuesto y banking. Sin distracciones.'
                  : 'Just the essentials: balance, expenses, income, budget and banking. No distractions.'}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                {language === 'es' ? 'Recomendado para empezar →' : 'Recommended to start →'}
              </div>
            </div>
          </button>

          {/* Advanced */}
          <button
            type="button"
            onClick={() => choose('advanced')}
            className="group flex items-start gap-4 p-4 rounded-xl border-2 border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:scale-[1.02] transition-all text-left"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-base mb-1">
                {language === 'es' ? 'Avanzado' : 'Advanced'}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Todas las herramientas: clientes, contratos, inversiones, FIRE, impuestos, mentoría, ecosistema y más.'
                  : 'All tools: clients, contracts, investments, FIRE, taxes, mentorship, ecosystem and more.'}
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end mt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {language === 'es' ? 'Decidir después' : 'Decide later'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
