import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  TrendingUp, 
  Bell,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  DollarSign,
  Calendar,
  ArrowUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
import { format, parseISO, differenceInDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'high_variance' | 'new_recurring' | 'unusual_amount' | 'duplicate' | 'spike';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  amount?: number;
  historicalAvg?: number;
  percentageChange?: number;
  vendor?: string;
  date?: string;
  dismissed?: boolean;
}

export function AnomalyAlerts() {
  const { language } = useLanguage();
  const { data: transactions } = useBankTransactions();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  const alerts = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const detectedAlerts: Alert[] = [];
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);

    // Group transactions by description/vendor
    const vendorGroups: Record<string, { amounts: number[]; dates: string[]; description: string }> = {};
    
    transactions.forEach((t) => {
      const key = (t.description || 'unknown').toLowerCase().trim();
      if (!vendorGroups[key]) {
        vendorGroups[key] = { amounts: [], dates: [], description: t.description || 'Unknown' };
      }
      vendorGroups[key].amounts.push(Math.abs(Number(t.amount)));
      vendorGroups[key].dates.push(t.transaction_date);
    });

    // Detect alerts for each vendor
    Object.entries(vendorGroups).forEach(([key, group]) => {
      if (group.amounts.length < 2) return;

      const sortedDates = [...group.dates].sort();
      const lastAmount = group.amounts[group.amounts.length - 1];
      const avgAmount = group.amounts.slice(0, -1).reduce((a, b) => a + b, 0) / (group.amounts.length - 1);
      
      // High variance detection (last charge significantly different from average)
      if (group.amounts.length >= 3 && avgAmount > 0) {
        const percentageChange = ((lastAmount - avgAmount) / avgAmount) * 100;
        
        if (percentageChange > 30) { // 30% increase threshold
          detectedAlerts.push({
            id: `high-${key}`,
            type: 'high_variance',
            severity: percentageChange > 50 ? 'critical' : 'warning',
            title: language === 'es' 
              ? `Cobro inusualmente alto: ${group.description}`
              : `Unusually high charge: ${group.description}`,
            description: language === 'es'
              ? `El último cobro de $${lastAmount.toFixed(2)} es ${percentageChange.toFixed(0)}% más alto que tu promedio de $${avgAmount.toFixed(2)}`
              : `The last charge of $${lastAmount.toFixed(2)} is ${percentageChange.toFixed(0)}% higher than your average of $${avgAmount.toFixed(2)}`,
            amount: lastAmount,
            historicalAvg: avgAmount,
            percentageChange,
            vendor: group.description,
            date: sortedDates[sortedDates.length - 1],
          });
        }

        // Spike detection (sudden significant increase)
        if (percentageChange > 100) {
          detectedAlerts.push({
            id: `spike-${key}`,
            type: 'spike',
            severity: 'critical',
            title: language === 'es'
              ? `⚠️ Pico de gasto detectado: ${group.description}`
              : `⚠️ Spending spike detected: ${group.description}`,
            description: language === 'es'
              ? `Este cobro es más del doble de lo normal. Verifica si es correcto.`
              : `This charge is more than double the normal amount. Please verify.`,
            amount: lastAmount,
            historicalAvg: avgAmount,
            percentageChange,
            vendor: group.description,
            date: sortedDates[sortedDates.length - 1],
          });
        }
      }

      // New recurring payment detection
      if (group.amounts.length === 2) {
        const daysBetween = differenceInDays(
          parseISO(sortedDates[1]),
          parseISO(sortedDates[0])
        );
        
        // Monthly-ish pattern detected
        if (daysBetween >= 25 && daysBetween <= 35) {
          const variance = Math.abs(group.amounts[0] - group.amounts[1]) / Math.max(group.amounts[0], group.amounts[1]);
          if (variance < 0.15) { // Similar amounts
            detectedAlerts.push({
              id: `new-recurring-${key}`,
              type: 'new_recurring',
              severity: 'info',
              title: language === 'es'
                ? `Nuevo pago recurrente detectado: ${group.description}`
                : `New recurring payment detected: ${group.description}`,
              description: language === 'es'
                ? `Se detectaron 2 cobros similares (~$${avgAmount.toFixed(2)}) con ~30 días de diferencia`
                : `Detected 2 similar charges (~$${avgAmount.toFixed(2)}) about 30 days apart`,
              amount: lastAmount,
              vendor: group.description,
            });
          }
        }
      }

      // Duplicate detection (same amount, same day or adjacent days)
      for (let i = 1; i < group.amounts.length; i++) {
        const daysApart = Math.abs(differenceInDays(
          parseISO(group.dates[i]),
          parseISO(group.dates[i - 1])
        ));
        
        if (daysApart <= 1 && group.amounts[i] === group.amounts[i - 1]) {
          detectedAlerts.push({
            id: `duplicate-${key}-${i}`,
            type: 'duplicate',
            severity: 'warning',
            title: language === 'es'
              ? `Posible cobro duplicado: ${group.description}`
              : `Possible duplicate charge: ${group.description}`,
            description: language === 'es'
              ? `Se encontraron 2 cobros de $${group.amounts[i].toFixed(2)} en días consecutivos`
              : `Found 2 charges of $${group.amounts[i].toFixed(2)} on consecutive days`,
            amount: group.amounts[i],
            vendor: group.description,
            date: group.dates[i],
          });
        }
      }
    });

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return detectedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [transactions, language]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  const visibleAlerts = showDismissed 
    ? alerts 
    : alerts.filter(a => !dismissedAlerts.has(a.id));

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-500/5';
      case 'info':
        return 'border-l-4 border-l-blue-500 bg-blue-500/5';
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'high_variance':
        return <TrendingUp className="h-4 w-4" />;
      case 'spike':
        return <Zap className="h-4 w-4" />;
      case 'new_recurring':
        return <Bell className="h-4 w-4" />;
      case 'duplicate':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {language === 'es' ? 'Alertas y Anomalías' : 'Alerts & Anomalies'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="font-medium">
              {language === 'es' ? '¡Todo en orden!' : 'All clear!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'es' 
                ? 'No se detectaron cobros inusuales o anomalías'
                : 'No unusual charges or anomalies detected'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {language === 'es' ? 'Alertas y Anomalías' : 'Alerts & Anomalies'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} {language === 'es' ? 'críticas' : 'critical'}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                  {warningCount} {language === 'es' ? 'advertencias' : 'warnings'}
                </Badge>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDismissed(!showDismissed)}
            className="text-xs"
          >
            {showDismissed ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showDismissed 
              ? (language === 'es' ? 'Ocultar descartadas' : 'Hide dismissed')
              : (language === 'es' ? 'Mostrar todas' : 'Show all')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {visibleAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`${getSeverityStyles(alert.severity)} ${
                  dismissedAlerts.has(alert.id) ? 'opacity-50' : ''
                }`}
              >
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {getTypeIcon(alert.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      
                      {alert.percentageChange && alert.percentageChange > 0 && (
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-destructive">
                            <ArrowUp className="h-3 w-3" />
                            +{alert.percentageChange.toFixed(0)}%
                          </span>
                          {alert.historicalAvg && (
                            <span className="text-muted-foreground">
                              {language === 'es' ? 'Promedio:' : 'Avg:'} ${alert.historicalAvg.toFixed(2)}
                            </span>
                          )}
                          {alert.date && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(alert.date), 'dd MMM', { 
                                locale: language === 'es' ? es : undefined 
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!dismissedAlerts.has(alert.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
