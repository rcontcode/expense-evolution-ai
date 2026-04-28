import { Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { isEssentialPath } from '@/lib/constants/focus-areas';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

/**
 * Discreet banner shown on advanced-only pages when the user is in Simple mode.
 * Lets them switch to Advanced or dismiss the banner for the session.
 */
export function AdvancedModeBanner() {
  const { uiMode, setUiMode } = useDisplayPreferences();
  const { language } = useLanguage();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (uiMode !== 'simple') return null;
  if (isEssentialPath(location.pathname)) return null;
  if (dismissed) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border-2 border-violet-500/30 bg-violet-500/5 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
        <span className="text-violet-700 dark:text-violet-300 truncate">
          {language === 'es'
            ? 'Esta sección es del Modo Avanzado.'
            : 'This section is part of Advanced Mode.'}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
          onClick={() => setUiMode('advanced')}
        >
          {language === 'es' ? 'Activar Avanzado' : 'Enable Advanced'}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setDismissed(true)}
          aria-label={language === 'es' ? 'Cerrar' : 'Close'}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
