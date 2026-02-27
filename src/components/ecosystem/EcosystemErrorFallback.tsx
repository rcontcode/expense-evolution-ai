import { memo } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface EcosystemErrorFallbackProps {
  onRetry?: () => void;
  compact?: boolean;
}

export const EcosystemErrorFallback = memo(({ onRetry, compact = false }: EcosystemErrorFallbackProps) => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground">
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[10px]">
          {isEs ? 'Sin conexión' : 'Offline'}
        </span>
        {onRetry && (
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-dashed border-muted-foreground/20">
      <CardContent className="p-3 flex items-center gap-3">
        <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">
            {isEs
              ? 'No se pudieron cargar los datos. Verifica tu conexión.'
              : 'Could not load data. Check your connection.'}
          </p>
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" className="shrink-0 text-[10px] h-6 px-2 gap-1" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" />
            {isEs ? 'Reintentar' : 'Retry'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

EcosystemErrorFallback.displayName = 'EcosystemErrorFallback';
