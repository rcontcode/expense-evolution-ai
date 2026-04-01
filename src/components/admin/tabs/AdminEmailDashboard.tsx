import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, CheckCircle2, XCircle, AlertTriangle, Clock, Filter } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  language: string;
}

type TimeRange = '24h' | '7d' | '30d';

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  dlq: 'bg-red-500/20 text-red-400 border-red-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  suppressed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  bounced: 'bg-red-600/20 text-red-300 border-red-600/30',
  complained: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export const AdminEmailDashboard = ({ language }: Props) => {
  const isEs = language === 'es';
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const startDate = useMemo(() => {
    if (timeRange === '24h') return subHours(new Date(), 24);
    if (timeRange === '7d') return subDays(new Date(), 7);
    return subDays(new Date(), 30);
  }, [timeRange]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['email-send-log', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_send_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const deduped = useMemo(() => {
    if (!logs) return [];
    const map = new Map<string, typeof logs[0]>();
    for (const log of logs) {
      const key = log.message_id || log.id;
      const existing = map.get(key);
      if (!existing || new Date(log.created_at) > new Date(existing.created_at)) {
        map.set(key, log);
      }
    }
    return Array.from(map.values());
  }, [logs]);

  const templates = useMemo(() => {
    const set = new Set(deduped.map(l => l.template_name));
    return Array.from(set).sort();
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter(l => {
      if (templateFilter !== 'all' && l.template_name !== templateFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      return true;
    });
  }, [deduped, templateFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const sent = filtered.filter(l => l.status === 'sent').length;
    const failed = filtered.filter(l => l.status === 'dlq' || l.status === 'failed').length;
    const suppressed = filtered.filter(l => l.status === 'suppressed').length;
    const pending = filtered.filter(l => l.status === 'pending').length;
    return { total, sent, failed, suppressed, pending };
  }, [filtered]);

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Mail className="h-5 w-5 mx-auto mb-1 text-blue-400" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{isEs ? 'Total Emails' : 'Total Emails'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold text-emerald-400">{stats.sent}</p>
            <p className="text-xs text-muted-foreground">{isEs ? 'Enviados' : 'Sent'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">{isEs ? 'Fallidos' : 'Failed'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-400" />
            <p className="text-2xl font-bold text-orange-400">{stats.suppressed}</p>
            <p className="text-xs text-muted-foreground">{isEs ? 'Suprimidos' : 'Suppressed'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">{isEs ? 'Pendientes' : 'Pending'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <div className="flex gap-1">
              {(['24h', '7d', '30d'] as TimeRange[]).map(range => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => { setTimeRange(range); setPage(0); }}
                  className="text-xs h-7"
                >
                  {range === '24h' ? '24h' : range === '7d' ? '7 días' : '30 días'}
                </Button>
              ))}
            </div>

            <Select value={templateFilter} onValueChange={v => { setTemplateFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder={isEs ? 'Plantilla' : 'Template'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isEs ? 'Todas' : 'All'}</SelectItem>
                {templates.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isEs ? 'Todos' : 'All'}</SelectItem>
                <SelectItem value="sent">{isEs ? 'Enviado' : 'Sent'}</SelectItem>
                <SelectItem value="failed">{isEs ? 'Fallido' : 'Failed'}</SelectItem>
                <SelectItem value="dlq">DLQ</SelectItem>
                <SelectItem value="suppressed">{isEs ? 'Suprimido' : 'Suppressed'}</SelectItem>
                <SelectItem value="pending">{isEs ? 'Pendiente' : 'Pending'}</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} {isEs ? 'emails únicos' : 'unique emails'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {isEs ? 'Cargando...' : 'Loading...'}
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isEs ? 'No hay emails en este período' : 'No emails in this period'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isEs ? 'Plantilla' : 'Template'}</TableHead>
                    <TableHead className="text-xs">{isEs ? 'Destinatario' : 'Recipient'}</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">{isEs ? 'Fecha' : 'Date'}</TableHead>
                    <TableHead className="text-xs">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(log => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="font-mono text-[11px]">{log.template_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[log.status] || ''}`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM HH:mm', { locale: isEs ? es : undefined })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-red-400">
                        {log.error_message || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="text-xs h-7"
                  >
                    ← {isEs ? 'Anterior' : 'Previous'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="text-xs h-7"
                  >
                    {isEs ? 'Siguiente' : 'Next'} →
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
