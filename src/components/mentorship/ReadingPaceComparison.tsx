import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine 
} from 'recharts';
import { 
  BookOpen, 
  Zap, 
  Turtle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  FileText,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ResourcePace {
  id: string;
  title: string;
  resourceType: string;
  pagesPerDay: number;
  minutesPerDay: number;
  totalPages: number;
  pagesRead: number;
  totalMinutes: number;
  minutesConsumed: number;
  daysActive: number;
  progressPercentage: number;
  startedDate: string | null;
  status: string;
  estimatedDaysToComplete: number | null;
}

export const ReadingPaceComparison = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Fetch resources with daily logs for pace calculation
  const { data: resources, isLoading } = useQuery({
    queryKey: ['reading-pace-comparison', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: resourcesData, error: resourcesError } = await supabase
        .from('financial_education')
        .select('*')
        .eq('user_id', user.id)
        .not('started_date', 'is', null);

      if (resourcesError) throw resourcesError;

      const { data: logsData, error: logsError } = await supabase
        .from('education_daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });

      if (logsError) throw logsError;

      // Calculate pace for each resource
      const paceData: ResourcePace[] = resourcesData.map(resource => {
        const resourceLogs = logsData.filter(log => log.resource_id === resource.id);
        const uniqueDays = new Set(resourceLogs.map(log => log.log_date)).size;
        
        const totalPagesLogged = resourceLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0);
        const totalMinutesLogged = resourceLogs.reduce((sum, log) => sum + (log.minutes_consumed || 0), 0);

        const daysActive = uniqueDays || 1;
        const pagesPerDay = totalPagesLogged / daysActive;
        const minutesPerDay = totalMinutesLogged / daysActive;

        const pagesRemaining = (resource.total_pages || 0) - (resource.pages_read || 0);
        const estimatedDaysToComplete = pagesPerDay > 0 
          ? Math.ceil(pagesRemaining / pagesPerDay) 
          : null;

        return {
          id: resource.id,
          title: resource.title,
          resourceType: resource.resource_type,
          pagesPerDay: Math.round(pagesPerDay * 10) / 10,
          minutesPerDay: Math.round(minutesPerDay * 10) / 10,
          totalPages: resource.total_pages || 0,
          pagesRead: resource.pages_read || 0,
          totalMinutes: resource.total_minutes || 0,
          minutesConsumed: resource.minutes_consumed || 0,
          daysActive,
          progressPercentage: resource.progress_percentage || 0,
          startedDate: resource.started_date,
          status: resource.status || 'in_progress',
          estimatedDaysToComplete,
        };
      });

      return paceData.filter(p => p.daysActive > 0 && (p.pagesPerDay > 0 || p.minutesPerDay > 0));
    },
    enabled: !!user?.id,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!resources || resources.length === 0) return null;

    const booksOnly = resources.filter(r => r.resourceType === 'book' && r.pagesPerDay > 0);
    const videosOnly = resources.filter(r => r.resourceType !== 'book' && r.minutesPerDay > 0);

    const avgPagesPerDay = booksOnly.length > 0
      ? booksOnly.reduce((sum, r) => sum + r.pagesPerDay, 0) / booksOnly.length
      : 0;

    const avgMinutesPerDay = videosOnly.length > 0
      ? videosOnly.reduce((sum, r) => sum + r.minutesPerDay, 0) / videosOnly.length
      : 0;

    const fastestBook = booksOnly.length > 0
      ? booksOnly.reduce((max, r) => r.pagesPerDay > max.pagesPerDay ? r : max, booksOnly[0])
      : null;

    const slowestBook = booksOnly.length > 0
      ? booksOnly.reduce((min, r) => r.pagesPerDay < min.pagesPerDay ? r : min, booksOnly[0])
      : null;

    return {
      avgPagesPerDay: Math.round(avgPagesPerDay * 10) / 10,
      avgMinutesPerDay: Math.round(avgMinutesPerDay * 10) / 10,
      fastestBook,
      slowestBook,
      totalResources: resources.length,
      booksCount: booksOnly.length,
      videosCount: videosOnly.length,
    };
  }, [resources]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!resources) return [];
    
    return resources
      .filter(r => r.resourceType === 'book' && r.pagesPerDay > 0)
      .sort((a, b) => b.pagesPerDay - a.pagesPerDay)
      .slice(0, 10)
      .map(r => ({
        name: r.title.length > 20 ? r.title.slice(0, 20) + '...' : r.title,
        fullName: r.title,
        pagesPerDay: r.pagesPerDay,
        progress: r.progressPercentage,
        isFastest: stats?.fastestBook?.id === r.id,
        isSlowest: stats?.slowestBook?.id === r.id,
      }));
  }, [resources, stats]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="h-4 w-4" />;
      case 'video': case 'course': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPaceColor = (pace: number, avg: number) => {
    if (pace >= avg * 1.3) return 'text-green-600';
    if (pace <= avg * 0.7) return 'text-amber-600';
    return 'text-foreground';
  };

  const getBarColor = (entry: any) => {
    if (entry.isFastest) return 'hsl(var(--chart-1))';
    if (entry.isSlowest) return 'hsl(var(--chart-3))';
    return 'hsl(var(--chart-2))';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              {language === 'es' ? 'Cargando...' : 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === 'es' ? 'Comparación de Ritmo' : 'Pace Comparison'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>
              {language === 'es'
                ? 'Registra progreso diario en tus lecturas para ver comparaciones'
                : 'Log daily progress on your reading to see comparisons'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === 'es' ? 'Comparación de Ritmo de Lectura' : 'Reading Pace Comparison'}
            </CardTitle>
          </div>
          <Badge variant="outline">
            {stats?.totalResources} {language === 'es' ? 'recursos' : 'resources'}
          </Badge>
        </div>
        <CardDescription>
          {language === 'es'
            ? 'Identifica cuáles libros lees más rápido'
            : 'Identify which books you read faster'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-primary">
              {stats?.avgPagesPerDay || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {language === 'es' ? 'Págs/día promedio' : 'Avg pages/day'}
            </div>
          </div>

          {stats?.fastestBook && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-1 text-green-600 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {language === 'es' ? 'Más rápido' : 'Fastest'}
                </span>
              </div>
              <div className="text-sm font-medium truncate" title={stats.fastestBook.title}>
                {stats.fastestBook.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.fastestBook.pagesPerDay} {language === 'es' ? 'págs/día' : 'pages/day'}
              </div>
            </div>
          )}

          {stats?.slowestBook && stats.slowestBook.id !== stats?.fastestBook?.id && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Turtle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {language === 'es' ? 'Más lento' : 'Slowest'}
                </span>
              </div>
              <div className="text-sm font-medium truncate" title={stats.slowestBook.title}>
                {stats.slowestBook.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.slowestBook.pagesPerDay} {language === 'es' ? 'págs/día' : 'pages/day'}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold">
              {stats?.booksCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {language === 'es' ? 'Libros activos' : 'Active books'}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        {chartData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `${v}`} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-sm">{data.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.pagesPerDay} {language === 'es' ? 'páginas/día' : 'pages/day'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.progress}% {language === 'es' ? 'completado' : 'complete'}
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine 
                  x={stats?.avgPagesPerDay || 0} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: language === 'es' ? 'Promedio' : 'Average', 
                    position: 'top',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
                <Bar dataKey="pagesPerDay" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {language === 'es' ? 'Detalle por recurso' : 'Resource details'}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-full bg-primary/10">
                    {getResourceIcon(resource.resourceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" title={resource.title}>
                      {resource.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{resource.daysActive} {language === 'es' ? 'días activos' : 'active days'}</span>
                      <span>•</span>
                      <span>{resource.progressPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {resource.resourceType === 'book' ? (
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${getPaceColor(resource.pagesPerDay, stats?.avgPagesPerDay || 0)}`}>
                        {resource.pagesPerDay} <span className="text-xs font-normal">{language === 'es' ? 'págs/día' : 'p/day'}</span>
                      </div>
                      {resource.estimatedDaysToComplete && resource.status === 'in_progress' && (
                        <div className="text-xs text-muted-foreground">
                          ~{resource.estimatedDaysToComplete}d {language === 'es' ? 'restantes' : 'left'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {resource.minutesPerDay} <span className="text-xs font-normal">{language === 'es' ? 'min/día' : 'min/day'}</span>
                      </div>
                    </div>
                  )}

                  {resource.pagesPerDay > (stats?.avgPagesPerDay || 0) * 1.2 && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                  {resource.pagesPerDay < (stats?.avgPagesPerDay || 0) * 0.8 && resource.pagesPerDay > 0 && (
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground">
            💡 {language === 'es'
              ? 'Los libros que lees más rápido pueden indicar temas de mayor interés o facilidad. Considera dedicar más tiempo a los libros más lentos si son importantes para tus metas.'
              : 'Books you read faster may indicate topics of greater interest or ease. Consider dedicating more time to slower books if they are important to your goals.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
