import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FeatureFlagManager() {
  const { language } = useLanguage();
  const { flagsList, isEnabled, updateFlag, isLoading } = useFeatureFlags();

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const masterFlag = flagsList.find(f => f.flag_key === 'ecosystem_enabled');
  const otherFlags = flagsList.filter(f => f.flag_key !== 'ecosystem_enabled');
  const masterOff = !isEnabled('ecosystem_enabled');

  return (
    <Card className={masterOff ? 'border-destructive/50 bg-destructive/5' : 'border-primary/30'}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">
              {language === 'es' ? 'Control de Features' : 'Feature Control'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {language === 'es' ? 'Activa o desactiva features del ecosistema' : 'Toggle ecosystem features'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master Switch */}
        {masterFlag && (
          <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${masterOff ? 'border-destructive/50 bg-destructive/10' : 'border-primary/30 bg-primary/5'}`}>
            <div className="flex items-center gap-2">
              {masterOff && <AlertTriangle className="h-4 w-4 text-destructive" />}
              <Label className="font-bold text-sm">
                {masterFlag.label || 'Master Switch'}
              </Label>
            </div>
            <Switch
              checked={masterFlag.enabled}
              onCheckedChange={(checked) => updateFlag('ecosystem_enabled', checked)}
            />
          </div>
        )}

        {/* Other flags */}
        <div className="space-y-2">
          {otherFlags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <Label className="text-sm font-medium">{flag.label || flag.flag_key}</Label>
                {flag.description && (
                  <p className="text-xs text-muted-foreground truncate">{flag.description}</p>
                )}
              </div>
              <Switch
                checked={flag.enabled}
                disabled={masterOff && flag.flag_key.startsWith('ecosystem_')}
                onCheckedChange={(checked) => updateFlag(flag.flag_key, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
