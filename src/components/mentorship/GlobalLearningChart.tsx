import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useDailyLogs,
  useFinancialEducation,
} from '@/hooks/data/useFinancialEducation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  TrendingUp, BookOpen, Flame, Trophy, Target, Calendar, 
  ChevronUp, ChevronDown, Sparkles, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { format, parseISO, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export function GlobalLearningChart() {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const { data: allLogs } = useDailyLogs();
  const { data: resources } = useFinancialEducation();

  const stats = useMemo(() => {
    if (!allLogs || allLogs.length === 0) {
      return {
        totalPages: 0,
        totalMinutes: 0,
        totalDays: 0,
        avgPagesPerDay: 0,
        avgMinutesPerDay: 0,
        currentStreak: 0,
        bestStreak: 0,
        weeklyTrend: 0,
        dailyData: [] as any[],
        weeklyData: [] as any[],
        resourceBreakdown: [] as any[],
      };
    }

    // Aggregate all logs by date
    const logsByDate = new Map<string, { pages: number; minutes: number; resources: Set<string> }>();
    
    allLogs.forEach(log => {
      const date = log.log_date;
      const existing = logsByDate.get(date) || { pages: 0, minutes: 0, resources: new Set<string>() };
      existing.pages += log.pages_read || 0;
      existing.minutes += log.minutes_consumed || 0;
      existing.resources.add(log.resource_id);
      logsByDate.set(date, existing);
    });

    // Sort dates
    const sortedDates = Array.from(logsByDate.keys()).sort();
    
    // Calculate totals
    let totalPages = 0;
    let totalMinutes = 0;
    allLogs.forEach(log => {
      totalPages += log.pages_read || 0;
      totalMinutes += log.minutes_consumed || 0;
    });

    const totalDays = logsByDate.size;
    const avgPagesPerDay = totalDays > 0 ? Math.round(totalPages / totalDays) : 0;
    const avgMinutesPerDay = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    // Calculate streak
    const today = startOfDay(new Date());
    let currentStreak = 0;
    let checkDate = today;
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (logsByDate.has(dateStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else if (currentStreak === 0 && format(subDays(today, 1), 'yyyy-MM-dd') === dateStr) {
        // Allow checking yesterday if today not logged yet
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = parseISO(sortedDates[i - 1]);
        const currDate = parseISO(sortedDates[i]);
        const diff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    // Weekly trend
    const last7Days = sortedDates.slice(-7);
    const prev7Days = sortedDates.slice(-14, -7);
    
    const last7Total = last7Days.reduce((sum, d) => sum + (logsByDate.get(d)?.pages || 0), 0);
    const prev7Total = prev7Days.reduce((sum, d) => sum + (logsByDate.get(d)?.pages || 0), 0);
    const weeklyTrend = prev7Total > 0 ? Math.round(((last7Total - prev7Total) / prev7Total) * 100) : 0;

    // Build daily data for chart (last 30 days)
    const last30Days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });

    let cumulative = 0;
    // Get cumulative from before 30 days
    sortedDates.forEach(d => {
      if (d < format(last30Days[0], 'yyyy-MM-dd')) {
        cumulative += logsByDate.get(d)?.pages || 0;
      }
    });

    const dailyData = last30Days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = logsByDate.get(dateStr);
      const pages = dayData?.pages || 0;
      cumulative += pages;
      
      return {
        date: format(day, 'dd/MM', { locale }),
        fullDate: dateStr,
        pages,
        minutes: dayData?.minutes || 0,
        cumulative,
        resourceCount: dayData?.resources?.size || 0,
        // 7-day moving average
        movingAvg: 0,
      };
    });

    // Calculate 7-day moving average
    for (let i = 0; i < dailyData.length; i++) {
      const start = Math.max(0, i - 6);
      const slice = dailyData.slice(start, i + 1);
      const avg = slice.reduce((sum, d) => sum + d.pages, 0) / slice.length;
      dailyData[i].movingAvg = Math.round(avg * 10) / 10;
    }

    // Weekly aggregation
    const weeklyData: any[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = subDays(today, (3 - i) * 7 + 6);
      const weekEnd = subDays(today, (3 - i) * 7);
      let weekPages = 0;
      let weekMinutes = 0;
      let weekDays = 0;

      eachDayOfInterval({ start: weekStart, end: weekEnd }).forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayData = logsByDate.get(dateStr);
        if (dayData) {
          weekPages += dayData.pages;
          weekMinutes += dayData.minutes;
          weekDays++;
        }
      });

      weeklyData.push({
        week: language === 'es' ? `Sem ${i + 1}` : `Week ${i + 1}`,
        pages: weekPages,
        minutes: weekMinutes,
        days: weekDays,
      });
    }

    // Resource breakdown
    const resourceStats = new Map<string, { pages: number; minutes: number; days: number }>();
    allLogs.forEach(log => {
      const existing = resourceStats.get(log.resource_id) || { pages: 0, minutes: 0, days: 0 };
      existing.pages += log.pages_read || 0;
      existing.minutes += log.minutes_consumed || 0;
      resourceStats.set(log.resource_id, existing);
    });

    // Count unique days per resource
    const resourceDays = new Map<string, Set<string>>();
    allLogs.forEach(log => {
      const existing = resourceDays.get(log.resource_id) || new Set<string>();
      existing.add(log.log_date);
      resourceDays.set(log.resource_id, existing);
    });

    const resourceBreakdown = Array.from(resourceStats.entries()).map(([resourceId, data]) => {
      const resource = resources?.find(r => r.id === resourceId);
      return {
        id: resourceId,
        title: resource?.title || 'Unknown',
        pages: data.pages,
        minutes: data.minutes,
        days: resourceDays.get(resourceId)?.size || 0,
        avgPagesPerDay: resourceDays.get(resourceId)?.size 
          ? Math.round(data.pages / resourceDays.get(resourceId)!.size) 
          : 0,
      };
    }).sort((a, b) => b.pages - a.pages);

    return {
      totalPages,
      totalMinutes,
      totalDays,
      avgPagesPerDay,
      avgMinutesPerDay,
      currentStreak,
      bestStreak,
      weeklyTrend,
      dailyData,
      weeklyData,
      resourceBreakdown,
    };
  }, [allLogs, resources, locale, language]);

  if (!allLogs || allLogs.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Productividad de Aprendizaje' : 'Learning Productivity'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {language === 'es' ? 'Global' : 'Global'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <span className="text-xl font-bold text-primary">{stats.totalPages}</span>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'páginas' : 'pages'}
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <span className="text-xl font-bold text-primary">{stats.avgPagesPerDay}</span>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'pág/día' : 'pg/day'}
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xl font-bold text-orange-500">{stats.currentStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'racha' : 'streak'}
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              {stats.weeklyTrend >= 0 ? (
                <ChevronUp className="h-4 w-4 text-green-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xl font-bold ${stats.weeklyTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.weeklyTrend}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'vs sem ant' : 'vs last wk'}
            </p>
          </div>
        </div>

        {/* Daily Productivity Chart with Moving Average */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {language === 'es' ? 'Últimos 30 días' : 'Last 30 days'}
          </p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.dailyData}>
                <defs>
                  <linearGradient id="colorGlobalPages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }} 
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'pages' 
                      ? (language === 'es' ? 'Páginas' : 'Pages')
                      : name === 'movingAvg'
                        ? (language === 'es' ? 'Promedio 7d' : '7d Average')
                        : name
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="pages" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorGlobalPages)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="movingAvg" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {language === 'es' ? 'Comparación semanal' : 'Weekly comparison'}
          </p>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar 
                  dataKey="pages" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name={language === 'es' ? 'Páginas' : 'Pages'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Resources */}
        {stats.resourceBreakdown.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {language === 'es' ? 'Rendimiento por libro' : 'Performance by book'}
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {stats.resourceBreakdown.slice(0, 5).map((resource, idx) => (
                <div 
                  key={resource.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    <span className="truncate">{resource.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{resource.pages} pág</span>
                    <span className="text-primary font-medium">{resource.avgPagesPerDay} pág/día</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational */}
        <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {stats.currentStreak >= 7
              ? (language === 'es' 
                  ? `¡${stats.currentStreak} días seguidos! Estás creando un hábito poderoso.`
                  : `${stats.currentStreak} days in a row! You're building a powerful habit.`)
              : stats.weeklyTrend > 0
                ? (language === 'es'
                    ? `¡Tu ritmo mejoró ${stats.weeklyTrend}% esta semana! Sigue así.`
                    : `Your pace improved ${stats.weeklyTrend}% this week! Keep going.`)
                : (language === 'es'
                    ? '¡Cada página cuenta! La constancia vence al talento.'
                    : 'Every page counts! Consistency beats talent.')
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
