import { Sparkles, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UiModeToggleProps {
  className?: string;
  compact?: boolean;
}

/**
 * Toggle between Simple and Advanced UI modes.
 * Lives in the app header and is always visible.
 */
export function UiModeToggle({ className, compact = false }: UiModeToggleProps) {
  const { uiMode, setUiMode } = useDisplayPreferences();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isSimple = uiMode === 'simple';

  const toggle = () => {
    const next = isSimple ? 'advanced' : 'simple';
    setUiMode(next);
    toast({
      title: next === 'simple'
        ? (language === 'es' ? '✨ Modo Simple activado' : '✨ Simple Mode on')
        : (language === 'es' ? '⚡ Modo Avanzado activado' : '⚡ Advanced Mode on'),
      description: next === 'simple'
        ? (language === 'es' ? 'Vista minimalista con lo esencial.' : 'Minimal view with the essentials.')
        : (language === 'es' ? 'Acceso completo a todas las funciones.' : 'Full access to every feature.'),
    });
    // Send the user to the dashboard so the change is immediately visible
    navigate('/');
  };

  return (
    <Button
      variant="outline"
      size={compact ? 'sm' : 'sm'}
      onClick={toggle}
      className={cn(
        'gap-1.5 rounded-full border-2 transition-all hover:scale-[1.04]',
        isSimple
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
          : 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
        className,
      )}
      title={
        isSimple
          ? language === 'es'
            ? 'Estás en Modo Simple. Click para ver todo.'
            : "You're in Simple Mode. Click to see everything."
          : language === 'es'
            ? 'Estás en Modo Avanzado. Click para simplificar.'
            : "You're in Advanced Mode. Click to simplify."
      }
    >
      {isSimple ? (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          {!compact && <span className="text-xs font-semibold">{language === 'es' ? 'Simple' : 'Simple'}</span>}
        </>
      ) : (
        <>
          <Layers className="h-3.5 w-3.5" />
          {!compact && <span className="text-xs font-semibold">{language === 'es' ? 'Avanzado' : 'Advanced'}</span>}
        </>
      )}
    </Button>
  );
}
