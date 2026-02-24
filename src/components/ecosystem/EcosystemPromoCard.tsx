import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ExternalLink } from 'lucide-react';

const FOKUSPARK_URL = 'https://fokuspark.lovable.app/?utm_source=evofinz&utm_medium=ecosystem&utm_campaign=promo';

export function EcosystemPromoCard() {
  const { language } = useLanguage();
  const { isEnabled, hasBundleAccess } = useFeatureFlags();

  if (hasBundleAccess || !isEnabled('ecosystem_promo_card')) return null;

  return (
    <Card className="bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-cyan-500/10 border-indigo-500/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-foreground">
              {language === 'es' ? 'Potencia tus finanzas con enfoque mental' : 'Power your finances with mental focus'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'es'
                ? 'Fokuspark: meditación, enfoque y bienestar para mejores decisiones financieras'
                : 'Fokuspark: meditation, focus & wellbeing for better financial decisions'}
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1" asChild>
            <a href={FOKUSPARK_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              {language === 'es' ? 'Ver' : 'View'}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
