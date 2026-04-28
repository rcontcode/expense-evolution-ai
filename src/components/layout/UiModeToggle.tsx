import { Sparkles, Layers } from 'lucide-react';
import { applyUiModeImmediately, openDashboardAfterUiModeChange, useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UiModeToggleProps {
  className?: string;
  compact?: boolean;
}

/**
 * Segmented control: shows BOTH options side-by-side, the active one is highlighted.
 * Click the inactive option to switch to it. Crystal clear: "I see I'm here, I can go there."
 */
export function UiModeToggle({ className, compact = false }: UiModeToggleProps) {
  const { uiMode, setUiMode } = useDisplayPreferences();
  const { language } = useLanguage();
  const { toast } = useToast();

  // 'unset' is treated as advanced for display purposes
  const current: 'simple' | 'advanced' = uiMode === 'simple' ? 'simple' : 'advanced';

  const switchTo = (target: 'simple' | 'advanced') => {
    if (target === current) return; // no-op if already there
    applyUiModeImmediately(target);
    setUiMode(target);
    toast({
      title: target === 'simple'
        ? (language === 'es' ? '✨ Modo Simple activado' : '✨ Simple Mode on')
        : (language === 'es' ? '⚡ Modo Avanzado activado' : '⚡ Advanced Mode on'),
      description: target === 'simple'
        ? (language === 'es' ? 'Vista minimalista con lo esencial.' : 'Minimal view with the essentials.')
        : (language === 'es' ? 'Acceso completo a todas las funciones.' : 'Full access to every feature.'),
    });
    openDashboardAfterUiModeChange();
  };

  const simpleActive = current === 'simple';
  const advancedActive = current === 'advanced';

  return (
    <div
      role="radiogroup"
      aria-label={language === 'es' ? 'Selector de modo de interfaz' : 'UI mode selector'}
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-full border-2 border-border bg-muted/50 shadow-sm',
        className,
      )}
    >
      {/* Simple option */}
      <button
        type="button"
        role="radio"
        aria-checked={simpleActive}
        onClick={() => switchTo('simple')}
        title={
          simpleActive
            ? language === 'es' ? 'Estás en Modo Simple' : "You're in Simple Mode"
            : language === 'es' ? 'Cambiar a Modo Simple' : 'Switch to Simple Mode'
        }
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs transition-all',
          simpleActive
            ? 'bg-emerald-500 text-primary-foreground shadow-md scale-[1.02] cursor-default'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/60 cursor-pointer',
        )}
      >
        <Sparkles className={cn('h-3.5 w-3.5', simpleActive && 'animate-pulse')} />
        {!compact && <span>{language === 'es' ? 'Simple' : 'Simple'}</span>}
      </button>

      {/* Advanced option */}
      <button
        type="button"
        role="radio"
        aria-checked={advancedActive}
        onClick={() => switchTo('advanced')}
        title={
          advancedActive
            ? language === 'es' ? 'Estás en Modo Avanzado' : "You're in Advanced Mode"
            : language === 'es' ? 'Cambiar a Modo Avanzado' : 'Switch to Advanced Mode'
        }
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs transition-all',
          advancedActive
            ? 'bg-primary text-primary-foreground shadow-md scale-[1.02] cursor-default'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/60 cursor-pointer',
        )}
      >
        <Layers className="h-3.5 w-3.5" />
        {!compact && <span>{language === 'es' ? 'Avanzado' : 'Advanced'}</span>}
      </button>
    </div>
  );
}
