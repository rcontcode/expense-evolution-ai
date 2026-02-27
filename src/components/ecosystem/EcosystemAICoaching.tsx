import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

interface AIInsight {
  emoji: string;
  title: string;
  advice: string;
}

/**
 * AI-powered coaching using backend edge function + Gemini model.
 * Falls back to rule-based insights if AI is unavailable.
 */
export const EcosystemAICoaching = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ecosystem-ai-coaching', user?.id, language],
    queryFn: async (): Promise<{ insights: AIInsight[]; source: string }> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { insights: [], source: 'none' };

      const response = await supabase.functions.invoke('ecosystem-coaching', {
        body: { language },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data || { insights: [], source: 'error' };
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={() => refetch()} />;
  if (isLoading) {
    return (
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <CardContent className="py-6 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span className="text-xs text-muted-foreground">
            {isEs ? 'Analizando tu ecosistema...' : 'Analyzing your ecosystem...'}
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.insights.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
            {isEs ? 'Coach IA del Ecosistema' : 'Ecosystem AI Coach'}
            <span className="text-[9px] font-normal bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
              {data.source === 'ai' ? 'Gemini' : 'Smart'}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {data.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
              <span className="text-base shrink-0">{insight.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-foreground">{insight.title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{insight.advice}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemAICoaching.displayName = 'EcosystemAICoaching';
