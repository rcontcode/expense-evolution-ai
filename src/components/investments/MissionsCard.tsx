import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMissions, DAILY_MISSIONS, WEEKLY_MISSIONS } from '@/hooks/data/useMissions';
import { CheckCircle2, Circle, Calendar, CalendarDays, Sparkles, Gift, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MissionsCard() {
  const { t, language } = useLanguage();
  const { 
    dailyMissions, 
    weeklyMissions, 
    dailyCompleted, 
    weeklyCompleted,
    totalDailyXP,
    totalWeeklyXP 
  } = useMissions();
  
  // Force re-render when mission progress updates
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setForceUpdate(prev => prev + 1);
    window.addEventListener('mission-progress-updated', handleUpdate);
    return () => window.removeEventListener('mission-progress-updated', handleUpdate);
  }, []);

  const getTimeRemaining = (type: 'daily' | 'weekly') => {
    const now = new Date();
    if (type === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } else {
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      return `${daysUntilSunday} ${language === 'es' ? 'días' : 'days'}`;
    }
  };

  const renderMissionItem = (mission: any) => {
    const title = language === 'es' ? mission.title_es : mission.title_en;
    const description = language === 'es' ? mission.description_es : mission.description_en;
    const progressPercent = (mission.progress / mission.target) * 100;
    
    return (
      <div 
        key={mission.key}
        className={cn(
          "p-3 rounded-lg border transition-all duration-300",
          mission.completed 
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
            : "bg-card hover:bg-muted/50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "text-2xl flex-shrink-0 transition-transform",
            mission.completed && "animate-bounce"
          )}>
            {mission.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={cn(
                "font-medium text-sm truncate",
                mission.completed && "text-emerald-700 dark:text-emerald-400"
              )}>
                {title}
              </h4>
              {mission.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/30 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            <div className="mt-2 flex items-center gap-2">
              <Progress 
                value={progressPercent} 
                className={cn(
                  "h-1.5 flex-1",
                  mission.completed && "[&>div]:bg-emerald-500"
                )}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {mission.progress}/{mission.target}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">+{mission.xp_reward} XP</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          {t('missions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('missions.daily')}
              <Badge variant="secondary" className="ml-1">
                {dailyCompleted}/{DAILY_MISSIONS.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('missions.weekly')}
              <Badge variant="secondary" className="ml-1">
                {weeklyCompleted}/{WEEKLY_MISSIONS.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3">
            {/* Daily Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{t('missions.timeRemaining')}</span>
              </div>
              <Badge variant="outline" className="bg-background">
                {getTimeRemaining('daily')}
              </Badge>
            </div>
            
            {/* XP Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('missions.dailyXP')}</span>
              <span className="font-medium text-amber-600">
                {dailyMissions.filter(m => m.completed).reduce((acc, m) => acc + m.xp_reward, 0)} / {totalDailyXP} XP
              </span>
            </div>
            
            {/* Mission List */}
            <div className="space-y-2">
              {dailyMissions.map(renderMissionItem)}
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-3">
            {/* Weekly Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-200/50 dark:border-violet-800/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">{t('missions.timeRemaining')}</span>
              </div>
              <Badge variant="outline" className="bg-background">
                {getTimeRemaining('weekly')}
              </Badge>
            </div>
            
            {/* XP Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('missions.weeklyXP')}</span>
              <span className="font-medium text-amber-600">
                {weeklyMissions.filter(m => m.completed).reduce((acc, m) => acc + m.xp_reward, 0)} / {totalWeeklyXP} XP
              </span>
            </div>
            
            {/* Mission List */}
            <div className="space-y-2">
              {weeklyMissions.map(renderMissionItem)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
