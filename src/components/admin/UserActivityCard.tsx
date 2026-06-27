/**
 * Per-user activity panel (admin only).
 *
 * Reads `feature_usage_logs` for a single user and shows:
 *  - last seen, sessions in last 30d, estimated total time
 *  - top features and top pages
 *  - day-of-week × hour heatmap
 *  - sessions per day (last 14d)
 *
 * Session duration is approximated as MAX(created_at) - MIN(created_at)
 * per session_id, capped at 60 min per session to ignore idle tabs.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, MousePointerClick, Flame, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  userId: string;
  language: 'es' | 'en';
}

type LogRow = {
  feature_name: string;
  page_path: string | null;
  action_type: string | null;
  session_id: string | null;
  created_at: string;
};

const DAYS = 30;
const SESSION_CAP_MIN = 60;

export const UserActivityCard = ({ userId, language }: Props) => {
  const isEs = language === 'es';
  const sinceIso = useMemo(() => subDays(new Date(), DAYS).toISOString(), []);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-user-activity', userId, DAYS],
    queryFn: async (): Promise<LogRow[]> => {
      const { data, error } = await supabase
        .from('feature_usage_logs')
        .select('feature_name, page_path, action_type, session_id, created_at')
        .eq('user_id', userId)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data as LogRow[]) || [];
    },
    enabled: !!userId,
  });

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    const sessions = new Map<string, { min: number; max: number; count: number }>();
    const featureCount = new Map<string, number>();
    const pageCount = new Map<string, number>();
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const daily = new Map<string, number>();

    for (const l of logs) {
      const t = new Date(l.created_at).getTime();
      const sid = l.session_id || 'no-session';
      const s = sessions.get(sid);
      if (s) {
        s.min = Math.min(s.min, t);
        s.max = Math.max(s.max, t);
        s.count++;
      } else {
        sessions.set(sid, { min: t, max: t, count: 1 });
      }

      featureCount.set(l.feature_name, (featureCount.get(l.feature_name) || 0) + 1);
      if (l.page_path) pageCount.set(l.page_path, (pageCount.get(l.page_path) || 0) + 1);

      const d = new Date(l.created_at);
      heatmap[d.getDay()][d.getHours()]++;

      const dayKey = format(startOfDay(d), 'yyyy-MM-dd');
      daily.set(dayKey, (daily.get(dayKey) || 0) + 1);
    }

    let totalMinutes = 0;
    for (const s of sessions.values()) {
      const dur = Math.min((s.max - s.min) / 60000, SESSION_CAP_MIN);
      // Single-event sessions count as 1 minute
      totalMinutes += dur > 0 ? dur : 1;
    }

    const topFeatures = [...featureCount.entries()]
      .filter(([k]) => k !== 'page_view')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const topPages = [...pageCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const heatMax = Math.max(1, ...heatmap.flat());
    const dailyArr = Array.from({ length: 14 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      const key = format(d, 'yyyy-MM-dd');
      return { date: d, count: daily.get(key) || 0 };
    });
    const dailyMax = Math.max(1, ...dailyArr.map(d => d.count));

    return {
      lastSeen: new Date(logs[0].created_at),
      sessionCount: sessions.size,
      totalMinutes: Math.round(totalMinutes),
      totalEvents: logs.length,
      topFeatures,
      topPages,
      heatmap,
      heatMax,
      daily: dailyArr,
      dailyMax,
    };
  }, [logs]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          {isEs ? 'Cargando actividad…' : 'Loading activity…'}
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isEs ? 'Actividad en la app' : 'In-app activity'}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {isEs
                ? 'Sin eventos registrados en los últimos 30 días. La instrumentación está activa: los datos aparecerán cuando el usuario navegue por la app.'
                : 'No events tracked in the last 30 days. Tracking is active: data will appear once the user navigates the app.'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysEs = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const daysEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayLabels = isEs ? daysEs : daysEn;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isEs ? 'Actividad (últ. 30 días)' : 'Activity (last 30 days)'}</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {stats.totalEvents} {isEs ? 'eventos' : 'events'}
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isEs ? 'Última' : 'Last seen'}</p>
            <p className="text-xs font-bold leading-tight mt-0.5">
              {formatDistanceToNow(stats.lastSeen, { addSuffix: false, locale: isEs ? esLocale : undefined })}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isEs ? 'Sesiones' : 'Sessions'}</p>
            <p className="text-base font-bold leading-tight">{stats.sessionCount}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isEs ? 'Tiempo' : 'Time'}</p>
            <p className="text-base font-bold leading-tight">
              {stats.totalMinutes >= 60
                ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
                : `${stats.totalMinutes}m`}
            </p>
          </div>
        </div>

        {/* Daily sessions (14d sparkline) */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            {isEs ? 'Eventos por día (14d)' : 'Events per day (14d)'}
          </p>
          <div className="flex items-end gap-0.5 h-12">
            {stats.daily.map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/70 hover:bg-primary rounded-sm transition-all relative group"
                style={{ height: `${Math.max(4, (d.count / stats.dailyMax) * 100)}%` }}
                title={`${format(d.date, 'dd MMM', { locale: isEs ? esLocale : undefined })}: ${d.count}`}
              />
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            {isEs ? 'Horario habitual (día × hora)' : 'Usage pattern (day × hour)'}
          </p>
          <div className="space-y-0.5">
            {stats.heatmap.map((row, day) => (
              <div key={day} className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground w-3">{dayLabels[day]}</span>
                <div className="flex gap-[1px] flex-1">
                  {row.map((v, h) => (
                    <div
                      key={h}
                      className={cn('h-2.5 flex-1 rounded-[1px]', v === 0 ? 'bg-muted/40' : 'bg-primary')}
                      style={v > 0 ? { opacity: 0.25 + (v / stats.heatMax) * 0.75 } : undefined}
                      title={`${dayLabels[day]} ${h}:00 — ${v} ${isEs ? 'eventos' : 'events'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1 pl-4">
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
        </div>

        {/* Top features */}
        {stats.topFeatures.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
              <Flame className="h-3 w-3" /> {isEs ? 'Funciones más usadas' : 'Top features'}
            </p>
            <div className="space-y-1">
              {stats.topFeatures.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] truncate">{name}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top pages */}
        {stats.topPages.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
              <MousePointerClick className="h-3 w-3" /> {isEs ? 'Páginas más visitadas' : 'Top pages'}
            </p>
            <div className="space-y-1">
              {stats.topPages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] truncate">{path}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1 border-t">
          <Clock className="h-3 w-3" />
          {isEs
            ? 'Tiempo estimado por sesión (máx 60 min/sesión, idle ignorado).'
            : 'Estimated from session duration (capped at 60 min/session, idle ignored).'}
        </p>
      </CardContent>
    </Card>
  );
};
