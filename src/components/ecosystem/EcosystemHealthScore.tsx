import { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useEcosystemData } from '@/contexts/EcosystemContext';
import { openFokusparkTool } from '@/lib/ecosystem/deeplinks';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

export const EcosystemHealthScore = memo(() => {
  const { language } = useLanguage();
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { data: dashData, isLoading, isError, refetch } = useEcosystemData();
  const isEs = language === 'es';

  if (flagsLoading || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={refetch} compact />;
  if (isLoading || !dashData) return null;

  const score = dashData.healthScore;

  const getColor = (s: number) => {
    if (s >= 75) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStrokeColor = (s: number) => {
    if (s >= 75) return '#10b981';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (s: number) => {
    if (s >= 75) return isEs ? 'Excelente' : 'Excellent';
    if (s >= 50) return isEs ? 'Bueno' : 'Good';
    if (s >= 25) return isEs ? 'Regular' : 'Fair';
    return isEs ? 'Necesita atención' : 'Needs attention';
  };

  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - score / 100);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {isEs ? 'Salud del Ecosistema' : 'Ecosystem Health'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg className="-rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
              <circle
                cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                stroke={getStrokeColor(score)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getColor(score)}`}>{score}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${getColor(score)}`}>{getLabel(score)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isEs
                ? 'Basado en ahorro, enfoque, estrés y estabilidad'
                : 'Based on savings, focus, stress & stability'}
            </p>
            {score < 50 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-[10px] h-6 px-2 gap-1"
                onClick={() => openFokusparkTool('breathing', 'health-score')}
              >
                <ExternalLink className="h-3 w-3" />
                {isEs ? 'Mejorar con Fokuspark' : 'Improve with Fokuspark'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemHealthScore.displayName = 'EcosystemHealthScore';
