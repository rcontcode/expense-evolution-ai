import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { getContextualQuote } from '@/lib/constants/unified-quotes';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function UnifiedQuoteBanner() {
  const { language } = useLanguage();
  const { hasBundleAccess } = useFeatureFlags();
  const location = useLocation();

  const quote = useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return getContextualQuote(location.pathname, timeOfDay, hasBundleAccess);
  }, [location.pathname, hasBundleAccess]);

  return (
    <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border-violet-500/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Quote className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-foreground italic leading-relaxed">
              "{quote.text}"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              — {quote.author}
              {quote.reference && <span className="hidden sm:inline">, {quote.reference}</span>}
              {quote.source === 'fokuspark' && (
                <span className="ml-1 text-[10px] bg-violet-500/10 px-1 rounded">✨ Bundle</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
