import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Crown } from 'lucide-react';
import { usePlanLimits, type FeatureKey } from '@/hooks/data/usePlanLimits';
import { useUpgradePrompt, type UpgradeFeatureKey } from '@/contexts/UpgradePromptContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  /** Feature flag from usePlanLimits to validate. */
  feature: FeatureKey;
  /** Friendly key used by UpgradePrompt for messaging. */
  promptFeature: UpgradeFeatureKey;
  /** Required plan to unlock (defaults: pro for high-tier features). */
  requiredPlan?: 'premium' | 'pro';
  title?: string;
  description?: string;
  children: ReactNode;
  /** Compact card variant for inline use. */
  compact?: boolean;
  className?: string;
}

/**
 * Wraps feature UI. If the user has the feature → renders children.
 * If not → renders a locked card explaining the value with a CTA that
 * opens the global UpgradePrompt.
 */
export function FeatureGate({
  feature,
  promptFeature,
  requiredPlan = 'pro',
  title,
  description,
  children,
  compact = false,
  className,
}: FeatureGateProps) {
  const { hasFeature, isGodMode, isLoading } = usePlanLimits();
  const upgrade = useUpgradePrompt();
  const { language } = useLanguage();
  const es = language === 'es';

  if (isLoading || isGodMode || hasFeature(feature)) {
    return <>{children}</>;
  }

  const Icon = requiredPlan === 'pro' ? Crown : Sparkles;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-dashed border-2',
        'bg-gradient-to-br from-muted/30 to-background',
        compact ? 'p-4' : 'p-6 md:p-8',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="space-y-1 max-w-md">
          <h3 className="font-bold text-base md:text-lg">
            {title ||
              (es ? 'Función disponible en plan superior' : 'Available in upper plan')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description ||
              (es
                ? 'Mejora tu plan para desbloquear esta herramienta y aumentar tus límites.'
                : 'Upgrade your plan to unlock this tool and raise your limits.')}
          </p>
        </div>

        <Button
          size={compact ? 'sm' : 'default'}
          onClick={() => upgrade.open({ feature: promptFeature, requiredPlan })}
          className="gap-2 mt-1"
        >
          <Icon className="h-4 w-4" />
          {es
            ? `Desbloquear con ${requiredPlan === 'pro' ? 'Pro' : 'Premium'}`
            : `Unlock with ${requiredPlan === 'pro' ? 'Pro' : 'Premium'}`}
        </Button>
      </div>
    </Card>
  );
}
