import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Target, Lightbulb, Trophy, Star, Sparkles, 
  Plus, Edit, Trash2, DollarSign, Brain, Flame, Quote
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestmentGoals, useDeleteInvestmentGoal } from '@/hooks/data/useInvestmentGoals';
import { useUserLevel, useUserAchievements, LEVELS, ACHIEVEMENTS } from '@/hooks/data/useGamification';
import { MENTOR_QUOTES, getRandomQuote } from '@/lib/constants/mentor-quotes';
import { InvestmentGoalDialog } from './InvestmentGoalDialog';
import { FinancialProfileDialog } from './FinancialProfileDialog';
import { PassiveIncomeSuggestions } from './PassiveIncomeSuggestions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function InvestmentSection() {
  const { t } = useLanguage();
  const { data: goals, isLoading: goalsLoading } = useInvestmentGoals();
  const { data: userLevel } = useUserLevel();
  const { data: achievements } = useUserAchievements();
  const deleteGoal = useDeleteInvestmentGoal();
  
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [dailyQuote] = useState(() => getRandomQuote());

  const currentLevel = LEVELS.find(l => l.level === (userLevel?.level || 1)) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === (userLevel?.level || 1) + 1);
  const xpProgress = nextLevel 
    ? ((userLevel?.experience_points || 0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP) * 100
    : 100;

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  };

  const handleDeleteGoal = () => {
    if (deleteGoalId) {
      deleteGoal.mutate(deleteGoalId);
      setDeleteGoalId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Daily Quote Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Quote className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-lg italic text-foreground">"{dailyQuote.quote}"</p>
              <p className="text-sm text-muted-foreground mt-2">
                — {dailyQuote.author}
                {dailyQuote.book && <span className="text-xs"> ({dailyQuote.book})</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gamification Level Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{currentLevel.icon}</div>
              <div>
                <h3 className="text-xl font-bold">{t('gamification.level')} {userLevel?.level || 1}</h3>
                <p className="text-violet-200">{currentLevel.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Flame className="h-5 w-5 text-orange-300" />
                <span className="font-bold">{userLevel?.streak_days || 0}</span>
                <span className="text-sm text-violet-200">{t('gamification.dayStreak')}</span>
              </div>
              <p className="text-sm text-violet-200">{userLevel?.experience_points || 0} XP</p>
            </div>
          </div>
          {nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-violet-200 mb-1">
                <span>{t('gamification.nextLevel')}: {nextLevel.name}</span>
                <span>{nextLevel.minXP - (userLevel?.experience_points || 0)} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2 bg-violet-800" />
            </div>
          )}
        </div>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {t('gamification.achievements')}
            </h4>
            <span className="text-sm text-muted-foreground">
              {achievements?.length || 0} / {Object.keys(ACHIEVEMENTS).length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ACHIEVEMENTS).map(([key, value]) => {
              const unlocked = achievements?.some(a => a.achievement_key === key);
              return (
                <Badge 
                  key={key}
                  variant={unlocked ? "default" : "outline"}
                  className={`${unlocked ? 'bg-amber-500 hover:bg-amber-600' : 'opacity-50'}`}
                  title={t(`gamification.achievements.${key}`)}
                >
                  {value.icon}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Investment Content */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('investments.goals')}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {t('investments.suggestions')}
          </TabsTrigger>
          <TabsTrigger value="learn" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {t('investments.learn')}
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{t('investments.investmentGoals')}</h3>
              <p className="text-sm text-muted-foreground">{t('investments.trackPassiveIncome')}</p>
            </div>
            <Button onClick={() => { setEditingGoal(null); setGoalDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              {t('investments.addGoal')}
            </Button>
          </div>

          {goals && goals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => {
                const progress = goal.target_amount > 0 
                  ? (goal.current_amount / goal.target_amount) * 100 
                  : 0;
                
                return (
                  <Card key={goal.id} className="relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: goal.color }}
                    />
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" style={{ color: goal.color }} />
                          <div>
                            <h4 className="font-semibold">{goal.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {goal.goal_type === 'passive_income' ? t('investments.passiveIncome') : goal.goal_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteGoalId(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('savingsGoals.progress')}</span>
                          <span className="font-medium">{Math.min(progress, 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span>${goal.current_amount?.toLocaleString()}</span>
                          <span className="text-muted-foreground">/ ${goal.target_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {goal.monthly_target > 0 && (
                        <div className="mt-3 p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span>{t('investments.monthlyTarget')}: ${goal.monthly_target.toLocaleString()}/mes</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-semibold text-lg">{t('investments.noGoals')}</h4>
                <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
                  {t('investments.createFirstGoal')}
                </p>
                <Button className="mt-4" onClick={() => setGoalDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('investments.addGoal')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <PassiveIncomeSuggestions onOpenProfile={() => setProfileDialogOpen(true)} />
        </TabsContent>

        {/* Learn Tab - Mentor Wisdom */}
        <TabsContent value="learn" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{t('investments.mentorWisdom')}</h3>
              <p className="text-sm text-muted-foreground">{t('investments.learnFromBest')}</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {MENTOR_QUOTES.slice(0, 8).map((quote, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                    <div>
                      <p className="italic text-sm">"{quote.quote}"</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        — {quote.author}
                        {quote.book && <span> ({quote.book})</span>}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {quote.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvestmentGoalDialog 
        open={goalDialogOpen} 
        onOpenChange={setGoalDialogOpen}
        editingGoal={editingGoal}
      />
      
      <FinancialProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
      />

      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('investments.deleteGoalConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('investments.deleteGoalWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
