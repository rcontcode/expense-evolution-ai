import { memo } from 'react';
import { Sparkles, ExternalLink, Link, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { openFokusparkTool } from '@/lib/ecosystem/deeplinks';

/**
 * Ecosystem configuration card for Settings page.
 * Shows ecosystem status and cross-app configuration for Bundle users.
 */
export const EcosystemSettingsCard = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading } = useFeatureFlags();
  const isEs = language === 'es';

  if (isLoading) return null;

  // Non-bundle: show upgrade prompt
  if (!hasBundleAccess) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">
                {isEs ? 'Evo Ecosystem' : 'Evo Ecosystem'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isEs
                  ? 'Conecta tus finanzas con tu bienestar mental'
                  : 'Connect your finances with your mental wellbeing'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {isEs
              ? 'Activa el Evo Bundle para desbloquear insights cruzados, Health Score y acceso directo a Fokuspark.'
              : 'Activate the Evo Bundle to unlock cross-app insights, Health Score, and direct Fokuspark access.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const features = [
    {
      key: 'ecosystem_onboarding',
      labelEs: 'Onboarding del Ecosistema',
      labelEn: 'Ecosystem Onboarding',
      active: isEnabled('ecosystem_onboarding'),
    },
    {
      key: 'ecosystem_insights',
      labelEs: 'Insights Cruzados',
      labelEn: 'Cross-App Insights',
      active: isEnabled('ecosystem_insights'),
    },
    {
      key: 'ecosystem_badge',
      labelEs: 'Badge del Ecosistema',
      labelEn: 'Ecosystem Badge',
      active: isEnabled('ecosystem_badge'),
    },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Evo Ecosystem
              <span className="text-[10px] font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {isEs ? 'Activo' : 'Active'}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              EvoFinz Pro + Fokuspark Premium
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Feature status */}
        <div className="space-y-1.5">
          {features.map((f) => (
            <div key={f.key} className="flex items-center justify-between py-1">
              <span className="text-xs text-foreground">
                {isEs ? f.labelEs : f.labelEn}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                f.active
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {f.active ? (isEs ? 'Activo' : 'Active') : (isEs ? 'Inactivo' : 'Inactive')}
              </span>
            </div>
          ))}
        </div>

        {/* Cross-app link */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Link className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground flex-1">
            {isEs ? 'Conectado con Fokuspark' : 'Connected to Fokuspark'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 gap-1"
            onClick={() => openFokusparkTool('dashboard', 'settings')}
          >
            <ExternalLink className="h-3 w-3" />
            {isEs ? 'Abrir' : 'Open'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

EcosystemSettingsCard.displayName = 'EcosystemSettingsCard';
