import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, Sparkles, Settings2, DollarSign, Clock, 
  TrendingUp, AlertTriangle, ChevronRight, Quote, Brain
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PassiveIncomeIdea {
  name: string;
  description: string;
  initial_investment: string;
  time_to_income: string;
  monthly_potential: string;
  difficulty: number;
  risk: 'bajo' | 'medio' | 'alto';
  steps: string[];
  mentor_quote: string;
  mentor_name: string;
}

interface Suggestions {
  ideas: PassiveIncomeIdea[];
  general_advice: string;
}

interface PassiveIncomeSuggestionsProps {
  onOpenProfile: () => void;
}

export function PassiveIncomeSuggestions({ onOpenProfile }: PassiveIncomeSuggestionsProps) {
  const { t } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useFinancialProfile();
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);

  const hasCompleteProfile = profile && 
    (profile.passions?.length > 0 || profile.talents?.length > 0 || profile.interests?.length > 0);

  const generateSuggestions = async () => {
    if (!profile) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-passive-income', {
        body: { profile }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error(t('investments.rateLimitError'));
        } else if (error.message?.includes('402')) {
          toast.error(t('investments.creditsError'));
        } else {
          throw error;
        }
        return;
      }

      setSuggestions(data);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error(t('investments.suggestionError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'bajo': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medio': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'alto': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return '';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Status */}
      {!hasCompleteProfile ? (
        <Card className="border-dashed border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Sparkles className="h-12 w-12 text-primary mb-4" />
            <h4 className="font-semibold text-lg">{t('investments.completeProfile')}</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
              {t('investments.completeProfileDescription')}
            </p>
            <Button className="mt-4" onClick={onOpenProfile}>
              <Settings2 className="mr-2 h-4 w-4" />
              {t('investments.configureProfile')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('investments.aiSuggestions')}</h3>
            <p className="text-sm text-muted-foreground">{t('investments.basedOnProfile')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onOpenProfile}>
              <Settings2 className="mr-2 h-4 w-4" />
              {t('investments.editProfile')}
            </Button>
            <Button onClick={generateSuggestions} disabled={isGenerating}>
              <Brain className="mr-2 h-4 w-4" />
              {isGenerating ? t('investments.generating') : t('investments.generateIdeas')}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <span>{t('investments.analyzingProfile')}</span>
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Suggestions */}
      {suggestions && !isGenerating && (
        <div className="space-y-6">
          {/* General Advice */}
          {suggestions.general_advice && (
            <Alert className="bg-primary/5 border-primary/20">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>{suggestions.general_advice}</AlertDescription>
            </Alert>
          )}

          {/* Ideas */}
          <div className="grid gap-4">
            {suggestions.ideas.map((idea, index) => (
              <Card 
                key={index} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedIdea(expandedIdea === idea.name ? null : idea.name)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {idea.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{idea.description}</CardDescription>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${expandedIdea === idea.name ? 'rotate-90' : ''}`} />
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">{t('investments.investment')}:</span>
                      <span className="font-medium">{idea.initial_investment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">{t('investments.timeToIncome')}:</span>
                      <span className="font-medium">{idea.time_to_income}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">{t('investments.potential')}:</span>
                      <span className="font-medium">{idea.monthly_potential}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRiskColor(idea.risk)}>
                        {t(`investments.risk_${idea.risk}`)}
                      </Badge>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="text-muted-foreground">{t('investments.difficulty')}:</span>
                    <span className="text-amber-500">{getDifficultyStars(idea.difficulty)}</span>
                  </div>

                  {/* Expanded Content */}
                  {expandedIdea === idea.name && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Steps */}
                      <div>
                        <h5 className="font-semibold mb-2">{t('investments.stepsToStart')}</h5>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {idea.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Mentor Quote */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Quote className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="italic text-sm">"{idea.mentor_quote}"</p>
                            <p className="text-xs text-muted-foreground mt-1">— {idea.mentor_name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasCompleteProfile && !suggestions && !isGenerating && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-semibold text-lg">{t('investments.readyToGenerate')}</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
              {t('investments.clickToGenerate')}
            </p>
            <Button className="mt-4" onClick={generateSuggestions}>
              <Brain className="mr-2 h-4 w-4" />
              {t('investments.generateIdeas')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
