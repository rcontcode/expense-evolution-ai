import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Info } from 'lucide-react';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  /** Stable id used for sessionStorage dismissal */
  pageId: string;
  /** Short, plain-language explanation of what this page does */
  description: { es: string; en: string };
}

/**
 * Lightweight, dismissible banner shown at the top of "advanced" pages
 * (Budget, Banking, etc.) when the user is in Simple Mode. Helps a Simple
 * user understand what they just landed on and offers a 1-tap way back.
 *
 * Dismissed via sessionStorage so it reappears in a fresh session.
 */
export function SimpleModePageBanner({ pageId, description }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { uiMode } = useDisplayPreferences();
  const dismissKey = `simple_banner_dismissed:${pageId}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(dismissKey) === '1');
  }, [dismissKey]);

  if (uiMode !== 'simple' || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent shadow-sm overflow-hidden">
      <CardContent className="p-3 flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <Info className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-snug">
            {description[language === 'es' ? 'es' : 'en']}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-3 w-3" />
              {language === 'es' ? 'Volver al inicio' : 'Back to home'}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          className="shrink-0 h-7 w-7 rounded-full hover:bg-primary/10"
          aria-label={language === 'es' ? 'Ocultar' : 'Dismiss'}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
