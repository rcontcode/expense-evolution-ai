import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  useDailyLogs,
  useLogDailyProgress,
  useUpdateEducationResource,
  FinancialEducationResource,
} from '@/hooks/data/useFinancialEducation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BookOpen, TrendingUp, Calendar, Target, Flame, Award, Clock, 
  Sparkles, LineChart, Bell, ChevronUp, ChevronDown, Zap, Trophy
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ReadingProgressTrackerProps {
  resource: FinancialEducationResource;
  onClose?: () => void;
}

const MOTIVATIONAL_READING_QUOTES = [
  { es: '¡Cada página te acerca a la libertad financiera!', en: 'Every page brings you closer to financial freedom!' },
  { es: '¡Los líderes son lectores!', en: 'Leaders are readers!' },
  { es: '¡Un libro al mes te hará millonario!', en: 'One book a month will make you a millionaire!' },
  { es: '¡Invierte en tu mente, es tu mejor activo!', en: 'Invest in your mind, it\'s your best asset!' },
  { es: '¡El conocimiento es el único activo que no te pueden quitar!', en: 'Knowledge is the only asset that can\'t be taken from you!' },
  { es: '¡Estás superando a la mayoría que no lee ni un libro al año!', en: 'You\'re outpacing most who don\'t read a single book a year!' },
  { es: '¡El éxito deja pistas en los libros!', en: 'Success leaves clues in books!' },
];

export function ReadingProgressTracker({ resource, onClose }: ReadingProgressTrackerProps) {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const [dailyProgress, setDailyProgress] = useState({ pages: 0, minutes: 0, notes: '' });
  const [editingTotal, setEditingTotal] = useState(false);
  const [newTotalPages, setNewTotalPages] = useState(resource.total_pages || 0);
  const [dailyGoal, setDailyGoal] = useState(resource.daily_goal_pages || 10);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  
  const { data: dailyLogs } = useDailyLogs(resource.id);
  const logDailyProgress = useLogDailyProgress();
  const updateResource = useUpdateEducationResource();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!dailyLogs || dailyLogs.length === 0) {
      return {
        totalPagesRead: resource.pages_read || 0,
        totalMinutes: resource.minutes_consumed || 0,
        averagePagesPerDay: 0,
        averageMinutesPerDay: 0,
        readingDays: 0,
        currentStreak: 0,
        bestStreak: 0,
        pagesRemaining: (resource.total_pages || 0) - (resource.pages_read || 0),
        progressPercent: resource.progress_percentage || 0,
        estimatedDaysToComplete: 0,
        estimatedCompletionDate: null as Date | null,
        trend: 0,
        chartData: [] as any[],
      };
    }

    const sortedLogs = [...dailyLogs].sort((a, b) => 
      new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
    );

    const totalPagesRead = resource.pages_read || sortedLogs.reduce((sum, l) => sum + (l.pages_read || 0), 0);
    const totalMinutes = resource.minutes_consumed || sortedLogs.reduce((sum, l) => sum + (l.minutes_consumed || 0), 0);
    const readingDays = sortedLogs.length;
    const averagePagesPerDay = readingDays > 0 ? Math.round(totalPagesRead / readingDays) : 0;
    const averageMinutesPerDay = readingDays > 0 ? Math.round(totalMinutes / readingDays) : 0;

    const pagesRemaining = Math.max(0, (resource.total_pages || 0) - totalPagesRead);
    const progressPercent = resource.total_pages && resource.total_pages > 0
      ? Math.min(100, Math.round((totalPagesRead / resource.total_pages) * 100))
      : 0;

    // Calculate streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    
    for (let i = sortedLogs.length - 1; i >= 0; i--) {
      const logDate = new Date(sortedLogs[i].log_date);
      const daysAgo = differenceInDays(today, logDate);
      
      if (i === sortedLogs.length - 1 && daysAgo <= 1) {
        tempStreak = 1;
      } else if (i < sortedLogs.length - 1) {
        const prevDate = new Date(sortedLogs[i + 1].log_date);
        const daysDiff = differenceInDays(prevDate, logDate);
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
    }
    currentStreak = tempStreak;

    // Calculate best streak
    tempStreak = 1;
    for (let i = 1; i < sortedLogs.length; i++) {
      const prevDate = new Date(sortedLogs[i - 1].log_date);
      const currDate = new Date(sortedLogs[i].log_date);
      const daysDiff = differenceInDays(currDate, prevDate);
      if (daysDiff === 1) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    // Estimate completion
    const estimatedDaysToComplete = averagePagesPerDay > 0 
      ? Math.ceil(pagesRemaining / averagePagesPerDay)
      : 0;
    
    const estimatedCompletionDate = estimatedDaysToComplete > 0
      ? addDays(new Date(), estimatedDaysToComplete)
      : null;

    // Calculate trend (comparing last 7 days to previous 7)
    const last7Days = sortedLogs.slice(-7);
    const prev7Days = sortedLogs.slice(-14, -7);
    const last7Avg = last7Days.length > 0 
      ? last7Days.reduce((sum, l) => sum + (l.pages_read || 0), 0) / last7Days.length 
      : 0;
    const prev7Avg = prev7Days.length > 0 
      ? prev7Days.reduce((sum, l) => sum + (l.pages_read || 0), 0) / prev7Days.length 
      : 0;
    const trend = prev7Avg > 0 ? Math.round(((last7Avg - prev7Avg) / prev7Avg) * 100) : 0;

    // Build chart data with cumulative progress
    let cumulative = 0;
    const chartData = sortedLogs.map((log) => {
      cumulative += log.pages_read || 0;
      return {
        date: format(parseISO(log.log_date), 'dd/MM', { locale }),
        pages: log.pages_read || 0,
        cumulative,
        minutes: log.minutes_consumed || 0,
        goal: dailyGoal,
      };
    });

    return {
      totalPagesRead,
      totalMinutes,
      averagePagesPerDay,
      averageMinutesPerDay,
      readingDays,
      currentStreak,
      bestStreak,
      pagesRemaining,
      progressPercent,
      estimatedDaysToComplete,
      estimatedCompletionDate,
      trend,
      chartData,
    };
  }, [dailyLogs, resource, dailyGoal, locale]);

  const randomQuote = useMemo(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_READING_QUOTES.length);
    return MOTIVATIONAL_READING_QUOTES[idx];
  }, []);

  const handleLogProgress = () => {
    if (dailyProgress.pages > 0 || dailyProgress.minutes > 0) {
      logDailyProgress.mutate({
        resource_id: resource.id,
        pages_read: dailyProgress.pages,
        minutes_consumed: dailyProgress.minutes,
        notes: dailyProgress.notes,
      });
      setDailyProgress({ pages: 0, minutes: 0, notes: '' });
    }
  };

  const handleUpdateTotalPages = () => {
    if (newTotalPages > 0) {
      updateResource.mutate({
        id: resource.id,
        resource_type: resource.resource_type,
        title: resource.title,
        total_pages: newTotalPages,
        daily_goal_pages: dailyGoal,
      });
      setEditingTotal(false);
    }
  };

  const handleUpdateDailyGoal = (goal: number) => {
    setDailyGoal(goal);
    updateResource.mutate({
      id: resource.id,
      resource_type: resource.resource_type,
      title: resource.title,
      daily_goal_pages: goal,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{resource.title}</h3>
          </div>
          {resource.status === 'completed' && (
            <Badge className="bg-green-500">
              <Trophy className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Completado' : 'Completed'}
            </Badge>
          )}
        </div>

        {/* Total Pages Configuration */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          {editingTotal ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                type="number"
                value={newTotalPages}
                onChange={(e) => setNewTotalPages(parseInt(e.target.value) || 0)}
                className="w-24"
                min={1}
              />
              <span className="text-sm text-muted-foreground">
                {language === 'es' ? 'páginas totales' : 'total pages'}
              </span>
              <Button size="sm" onClick={handleUpdateTotalPages}>
                {language === 'es' ? 'Guardar' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingTotal(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-2xl font-bold text-primary">{stats.totalPagesRead}</span>
                <span className="text-muted-foreground"> / {resource.total_pages || '?'} </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'es' ? 'páginas' : 'pages'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditingTotal(true)}>
                {language === 'es' ? 'Editar total' : 'Edit total'}
              </Button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'es' ? 'Progreso' : 'Progress'}
            </span>
            <span className="font-bold text-lg text-primary">{stats.progressPercent}%</span>
          </div>
          <Progress value={stats.progressPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {language === 'es' ? 'Faltan' : 'Remaining'}: {stats.pagesRemaining} {language === 'es' ? 'páginas' : 'pages'}
            </span>
            {stats.estimatedCompletionDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {language === 'es' ? 'Terminarás el' : 'You\'ll finish on'} {format(stats.estimatedCompletionDate, 'dd MMM yyyy', { locale })}
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="log" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Hoy' : 'Today'}
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Stats' : 'Stats'}
          </TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">
            <LineChart className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Curva' : 'Chart'}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Config' : 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4 mt-4">
          {/* Motivational Quote */}
          <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'es' ? randomQuote.es : randomQuote.en}
            </p>
          </div>

          {/* Daily Goal Progress */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                {language === 'es' ? 'Meta diaria' : 'Daily goal'}
              </span>
              <span className="text-sm">
                {dailyProgress.pages}/{dailyGoal} {language === 'es' ? 'páginas' : 'pages'}
              </span>
            </div>
            <Progress 
              value={Math.min(100, (dailyProgress.pages / dailyGoal) * 100)} 
              className="h-2" 
            />
          </div>

          {/* Log Progress Form */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {language === 'es' ? 'Registrar progreso de hoy' : 'Log today\'s progress'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Páginas leídas hoy' : 'Pages read today'}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={dailyProgress.pages || ''}
                  onChange={(e) => setDailyProgress({ ...dailyProgress, pages: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Minutos dedicados' : 'Minutes spent'}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={dailyProgress.minutes || ''}
                  onChange={(e) => setDailyProgress({ ...dailyProgress, minutes: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
            <Textarea
              value={dailyProgress.notes}
              onChange={(e) => setDailyProgress({ ...dailyProgress, notes: e.target.value })}
              placeholder={language === 'es' ? 'Notas de hoy (opcional)...' : 'Today\'s notes (optional)...'}
              rows={2}
            />

            {/* XP Preview */}
            {(dailyProgress.pages > 0 || dailyProgress.minutes > 0) && (
              <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-800">
                <span className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {language === 'es' ? 'XP a ganar:' : 'XP to earn:'}
                </span>
                <span className="text-lg font-bold text-purple-600">
                  +{dailyProgress.pages + Math.floor(dailyProgress.minutes / 2)} XP
                </span>
              </div>
            )}

            <Button 
              onClick={handleLogProgress} 
              className="w-full" 
              size="sm"
              disabled={dailyProgress.pages === 0 && dailyProgress.minutes === 0}
            >
              <Flame className="h-4 w-4 mr-2" />
              {language === 'es' ? '¡Registrar y ganar XP!' : 'Log and earn XP!'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4 mt-4">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <span className="text-2xl font-bold text-primary">{stats.averagePagesPerDay}</span>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'pág/día promedio' : 'avg pages/day'}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <span className="text-2xl font-bold text-primary">{stats.readingDays}</span>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'días de lectura' : 'reading days'}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-2xl font-bold text-orange-500">{stats.currentStreak}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'racha actual' : 'current streak'}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-500">{stats.bestStreak}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'mejor racha' : 'best streak'}
              </p>
            </div>
          </div>

          {/* Trend Indicator */}
          {stats.trend !== 0 && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              stats.trend > 0 
                ? 'bg-green-500/10 border border-green-200 dark:border-green-800' 
                : 'bg-red-500/10 border border-red-200 dark:border-red-800'
            }`}>
              {stats.trend > 0 ? (
                <ChevronUp className="h-5 w-5 text-green-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stats.trend > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}% {language === 'es' ? 'vs semana anterior' : 'vs last week'}
              </span>
            </div>
          )}

          {/* Estimated Completion */}
          {stats.estimatedDaysToComplete > 0 && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {language === 'es' 
                      ? `A este ritmo terminarás en ${stats.estimatedDaysToComplete} días`
                      : `At this pace you'll finish in ${stats.estimatedDaysToComplete} days`}
                  </p>
                  {stats.estimatedCompletionDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      📅 {format(stats.estimatedCompletionDate, 'EEEE, dd MMMM yyyy', { locale })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Motivational based on performance */}
          <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {stats.averagePagesPerDay >= dailyGoal
                ? (language === 'es' 
                    ? '¡Excelente! Estás superando tu meta diaria. ¡Sigue así!' 
                    : 'Excellent! You\'re exceeding your daily goal. Keep it up!')
                : (language === 'es'
                    ? `¡Aumenta ${dailyGoal - stats.averagePagesPerDay} páginas/día para alcanzar tu meta!`
                    : `Increase by ${dailyGoal - stats.averagePagesPerDay} pages/day to reach your goal!`)
              }
            </p>
          </div>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4 mt-4">
          {stats.chartData.length > 0 ? (
            <>
              {/* Daily Pages Chart */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {language === 'es' ? 'Páginas por día' : 'Pages per day'}
                </p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <ReferenceLine 
                        y={dailyGoal} 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="5 5"
                        label={{ 
                          value: language === 'es' ? 'Meta' : 'Goal', 
                          position: 'right',
                          fontSize: 10,
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pages" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorPages)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cumulative Progress Chart */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  {language === 'es' ? 'Progreso acumulado' : 'Cumulative progress'}
                </p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      {resource.total_pages && (
                        <ReferenceLine 
                          y={resource.total_pages} 
                          stroke="hsl(var(--chart-4))" 
                          strokeDasharray="5 5"
                          label={{ 
                            value: language === 'es' ? 'Total' : 'Total', 
                            position: 'right',
                            fontSize: 10,
                          }}
                        />
                      )}
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--chart-2))" 
                        fillOpacity={1} 
                        fill="url(#colorCumulative)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'es' 
                  ? 'Registra tu progreso diario para ver las curvas' 
                  : 'Log your daily progress to see charts'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Daily Goal Setting */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'es' ? 'Meta diaria de páginas' : 'Daily page goal'}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={dailyGoal}
                onChange={(e) => handleUpdateDailyGoal(parseInt(e.target.value) || 10)}
                min={1}
                max={100}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {language === 'es' ? 'páginas por día' : 'pages per day'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' 
                ? `A ${dailyGoal} pág/día, terminarás en ${Math.ceil(stats.pagesRemaining / dailyGoal)} días`
                : `At ${dailyGoal} pages/day, you'll finish in ${Math.ceil(stats.pagesRemaining / dailyGoal)} days`}
            </p>
          </div>

          {/* Reading Reminder Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {language === 'es' ? 'Recordatorios de lectura' : 'Reading reminders'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'Recibe notificaciones diarias para continuar leyendo'
                  : 'Receive daily notifications to continue reading'}
              </p>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {/* Quick Goal Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'es' ? 'Presets de meta' : 'Goal presets'}
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50].map((preset) => (
                <Button
                  key={preset}
                  variant={dailyGoal === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateDailyGoal(preset)}
                >
                  {preset} {language === 'es' ? 'pág' : 'pg'}
                </Button>
              ))}
            </div>
          </div>

          {/* Motivational Tip */}
          <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'es' 
                ? 'Tip: Lee 10 páginas al día = 3,650 páginas al año = ~15 libros!'
                : 'Tip: Read 10 pages/day = 3,650 pages/year = ~15 books!'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
