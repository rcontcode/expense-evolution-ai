import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Quote, RefreshCw, Lightbulb, Sparkles } from 'lucide-react';
import { getRandomQuote, getRandomTip, MENTOR_QUOTES, FINANCIAL_TIPS } from '@/lib/constants/mentor-quotes';
import { useLanguage } from '@/contexts/LanguageContext';

interface MentorQuoteBannerProps {
  showTip?: boolean;
  className?: string;
}

export function MentorQuoteBanner({ showTip = false, className = '' }: MentorQuoteBannerProps) {
  const { language } = useLanguage();
  const [quote, setQuote] = useState(getRandomQuote());
  const [tip, setTip] = useState(getRandomTip());
  const [isAnimating, setIsAnimating] = useState(false);

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      if (showTip) {
        setTip(getRandomTip());
      }
      setIsAnimating(false);
    }, 300);
  };

  // Auto-refresh quote on mount and every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshQuote, 30000);
    return () => clearInterval(interval);
  }, [showTip]);

  return (
    <Card className={`bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/20 overflow-hidden ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Quote className="h-5 w-5 text-primary" />
          </div>
          
          <div className={`flex-1 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <blockquote className="text-base font-medium italic text-foreground">
              "{quote.quote}"
            </blockquote>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-semibold">{quote.author}</span>
              {quote.book && (
                <>
                  <span>•</span>
                  <span className="text-xs">{quote.book}</span>
                </>
              )}
            </div>

            {showTip && tip && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      {language === 'es' ? 'Consejo del día' : 'Tip of the day'}
                    </span>
                    <p className="text-sm text-muted-foreground">{tip.tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={refreshQuote}
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
            title={language === 'es' ? 'Nueva frase' : 'New quote'}
          >
            <RefreshCw className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
