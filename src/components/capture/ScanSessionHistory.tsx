import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScanSessions, DailyStats } from '@/hooks/data/useScanSessions';
import { 
  History, Calendar, Receipt, CheckCircle2, 
  TrendingUp, Clock, Smartphone, Monitor,
  ChevronRight, BarChart3
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ScanSessionHistoryProps {
  className?: string;
}

export function ScanSessionHistory({ className }: ScanSessionHistoryProps) {
  const { language } = useLanguage();
  const { sessions, dailyStats, isLoading } = useScanSessions();
  const [open, setOpen] = useState(false);

  const locale = language === 'es' ? es : enUS;

  // Calculate totals
  const totalReceipts = sessions.reduce((sum, s) => sum + (s.receipts_captured || 0), 0);
  const totalApproved = sessions.reduce((sum, s) => sum + (s.receipts_approved || 0), 0);
  const totalAmount = sessions.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const avgPerSession = sessions.length > 0 ? Math.round(totalReceipts / sessions.length) : 0;

  // Prepare chart data (last 7 days)
  const chartData = dailyStats.slice(0, 7).reverse().map(stat => ({
    date: format(parseISO(stat.date), 'EEE', { locale }),
    receipts: stat.receipts_captured,
    approved: stat.receipts_approved,
    amount: stat.total_amount,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <History className="h-4 w-4 mr-2" />
          {language === 'es' ? 'Historial' : 'History'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Historial de Escaneo' : 'Scan History'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Receipt className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{totalReceipts}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Total Capturados' : 'Total Captured'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" />
                <p className="text-xl font-bold">{totalApproved}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Aprobados' : 'Approved'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-warning mb-1" />
                <p className="text-xl font-bold">${totalAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Monto Total' : 'Total Amount'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xl font-bold">{avgPerSession}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Promedio/Sesión' : 'Avg/Session'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'es' ? 'Últimos 7 días' : 'Last 7 days'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="receipts"
                        name={language === 'es' ? 'Capturados' : 'Captured'}
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name={language === 'es' ? 'Aprobados' : 'Approved'}
                        stroke="hsl(var(--success))"
                        fill="hsl(var(--success) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {language === 'es' ? 'Sesiones Recientes' : 'Recent Sessions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {language === 'es' ? 'Cargando...' : 'Loading...'}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {language === 'es' 
                        ? 'No hay sesiones de escaneo aún'
                        : 'No scan sessions yet'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {sessions.map((session) => (
                      <div 
                        key={session.id}
                        className="p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {session.device_type === 'mobile' ? (
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {format(parseISO(session.started_at), 'PPp', { locale })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(parseISO(session.started_at), { 
                                  addSuffix: true,
                                  locale 
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Receipt className="h-3 w-3 mr-1" />
                              {session.receipts_captured || 0}
                            </Badge>
                            {session.receipts_approved > 0 && (
                              <Badge variant="outline" className="text-xs text-success border-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {session.receipts_approved}
                              </Badge>
                            )}
                            {session.total_amount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                ${Number(session.total_amount).toFixed(0)}
                              </Badge>
                            )}
                            {!session.ended_at && (
                              <Badge className="text-xs bg-success text-success-foreground animate-pulse">
                                {language === 'es' ? 'Activa' : 'Active'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
