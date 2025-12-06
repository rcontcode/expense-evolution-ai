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
import { useScanSessions, DailyStats, WeeklyComparison } from '@/hooks/data/useScanSessions';
import { 
  History, Calendar, Receipt, CheckCircle2, 
  TrendingUp, TrendingDown, Clock, Smartphone, Monitor,
  ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight, Minus
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

interface ChangeIndicatorProps {
  value: number;
  label: string;
}

function ChangeIndicator({ value, label }: ChangeIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium",
      isPositive && "text-success",
      !isPositive && !isNeutral && "text-destructive",
      isNeutral && "text-muted-foreground"
    )}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span>{isPositive ? '+' : ''}{value}%</span>
    </div>
  );
}

export function ScanSessionHistory({ className }: ScanSessionHistoryProps) {
  const { language, t } = useLanguage();
  const { sessions, dailyStats, weeklyComparison, isLoading } = useScanSessions();
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
          {t('scanHistory.title').split(' ')[0]}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('scanHistory.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Weekly Comparison */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('scanHistory.weeklyComparison')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('scanHistory.currentWeek')}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{t('scanHistory.receipts')}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{weeklyComparison.currentWeek.receipts}</span>
                        <ChangeIndicator value={weeklyComparison.changes.receipts} label="receipts" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{t('scanHistory.approved')}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{weeklyComparison.currentWeek.approved}</span>
                        <ChangeIndicator value={weeklyComparison.changes.approved} label="approved" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{t('scanHistory.amount')}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${weeklyComparison.currentWeek.amount.toFixed(0)}</span>
                        <ChangeIndicator value={weeklyComparison.changes.amount} label="amount" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-l pl-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('scanHistory.previousWeek')}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{t('scanHistory.receipts')}</span>
                      <span className="text-muted-foreground">{weeklyComparison.previousWeek.receipts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{t('scanHistory.approved')}</span>
                      <span className="text-muted-foreground">{weeklyComparison.previousWeek.approved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{t('scanHistory.amount')}</span>
                      <span className="text-muted-foreground">${weeklyComparison.previousWeek.amount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Receipt className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{totalReceipts}</p>
                <p className="text-xs text-muted-foreground">
                  {t('scanHistory.totalCaptured')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" />
                <p className="text-xl font-bold">{totalApproved}</p>
                <p className="text-xs text-muted-foreground">
                  {t('scanHistory.approved')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-warning mb-1" />
                <p className="text-xl font-bold">${totalAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">
                  {t('scanHistory.totalAmount')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xl font-bold">{avgPerSession}</p>
                <p className="text-xs text-muted-foreground">
                  {t('scanHistory.avgPerSession')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('scanHistory.last7Days')}
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
                        name={t('scanHistory.captured')}
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name={t('scanHistory.approved')}
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
                {t('scanHistory.recentSessions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('scanHistory.loading')}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {t('scanHistory.noSessions')}
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
                                {t('scanHistory.active')}
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
