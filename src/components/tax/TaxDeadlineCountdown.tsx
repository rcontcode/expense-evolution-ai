import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useEntityOptional } from '@/contexts/EntityContext';
import { CalendarClock, AlertTriangle, CheckCircle2, Clock, Bell } from 'lucide-react';
import { differenceInDays, format, isBefore, addYears } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';

interface TaxDeadline {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  date: Date;
  category: 'filing' | 'payment' | 'planning';
  importance: 'critical' | 'high' | 'medium';
}

function getCanadianDeadlines(year: number): TaxDeadline[] {
  return [
    {
      id: 'ca-t1-filing',
      name: { es: 'Declaración T1 Personal', en: 'T1 Personal Filing' },
      description: { es: 'Fecha límite para declarar impuestos personales', en: 'Personal tax filing deadline' },
      date: new Date(year, 3, 30), // April 30
      category: 'filing',
      importance: 'critical',
    },
    {
      id: 'ca-self-employed',
      name: { es: 'Declaración Trabajadores Independientes', en: 'Self-Employed Filing' },
      description: { es: 'Fecha límite extendida para autónomos', en: 'Extended deadline for self-employed' },
      date: new Date(year, 5, 15), // June 15
      category: 'filing',
      importance: 'critical',
    },
    {
      id: 'ca-tax-payment',
      name: { es: 'Pago de Impuestos Adeudados', en: 'Tax Payment Due' },
      description: { es: 'Pago completo de impuestos adeudados', en: 'Full payment of taxes owed' },
      date: new Date(year, 3, 30), // April 30
      category: 'payment',
      importance: 'critical',
    },
    {
      id: 'ca-rrsp',
      name: { es: 'Contribución RRSP', en: 'RRSP Contribution' },
      description: { es: 'Último día para contribuir al RRSP del año anterior', en: 'Last day to contribute to prior year RRSP' },
      date: new Date(year, 2, 1), // March 1
      category: 'planning',
      importance: 'high',
    },
    {
      id: 'ca-instalment-q1',
      name: { es: 'Pago Trimestral Q1', en: 'Q1 Instalment' },
      description: { es: 'Primer pago de impuestos trimestrales', en: 'First quarterly tax instalment' },
      date: new Date(year, 2, 15), // March 15
      category: 'payment',
      importance: 'medium',
    },
    {
      id: 'ca-instalment-q2',
      name: { es: 'Pago Trimestral Q2', en: 'Q2 Instalment' },
      description: { es: 'Segundo pago de impuestos trimestrales', en: 'Second quarterly tax instalment' },
      date: new Date(year, 5, 15), // June 15
      category: 'payment',
      importance: 'medium',
    },
    {
      id: 'ca-gst-annual',
      name: { es: 'Declaración Anual GST/HST', en: 'Annual GST/HST Return' },
      description: { es: 'Reporte anual de GST/HST para autónomos', en: 'Annual GST/HST return for sole proprietors' },
      date: new Date(year, 5, 15), // June 15
      category: 'filing',
      importance: 'high',
    },
  ];
}

function getChileanDeadlines(year: number): TaxDeadline[] {
  return [
    {
      id: 'cl-renta',
      name: { es: 'Declaración Renta Anual (F22)', en: 'Annual Income Tax (F22)' },
      description: { es: 'Declaración anual ante el SII', en: 'Annual filing with SII' },
      date: new Date(year, 3, 30), // April 30
      category: 'filing',
      importance: 'critical',
    },
    {
      id: 'cl-iva-monthly',
      name: { es: 'Declaración IVA Mensual (F29)', en: 'Monthly VAT (F29)' },
      description: { es: 'Declaración mensual de IVA', en: 'Monthly VAT declaration' },
      date: new Date(year, new Date().getMonth(), 12), // 12th of current month
      category: 'filing',
      importance: 'high',
    },
    {
      id: 'cl-ppm',
      name: { es: 'PPM Mensual', en: 'Monthly PPM' },
      description: { es: 'Pago provisional mensual de impuestos', en: 'Monthly provisional tax payment' },
      date: new Date(year, new Date().getMonth(), 12),
      category: 'payment',
      importance: 'high',
    },
    {
      id: 'cl-dj',
      name: { es: 'Declaraciones Juradas', en: 'Sworn Declarations' },
      description: { es: 'Declaraciones juradas anuales al SII', en: 'Annual sworn declarations to SII' },
      date: new Date(year, 2, 31), // March 31
      category: 'filing',
      importance: 'critical',
    },
    {
      id: 'cl-apv',
      name: { es: 'APV para Beneficio Tributario', en: 'APV Tax Benefit' },
      description: { es: 'Último aporte APV para rebaja fiscal del año', en: 'Last APV contribution for tax year benefit' },
      date: new Date(year, 11, 30), // December 30
      category: 'planning',
      importance: 'high',
    },
  ];
}

export function TaxDeadlineCountdown() {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const entityCtx = useEntityOptional();
  const country = entityCtx?.currentCountry || profile?.country || 'CA';
  const now = new Date();
  const currentYear = now.getFullYear();

  const deadlines = useMemo(() => {
    const getDeadlines = country === 'CL' ? getChileanDeadlines : getCanadianDeadlines;
    const thisYear = getDeadlines(currentYear);
    const nextYear = getDeadlines(currentYear + 1);
    const all = [...thisYear, ...nextYear];

    return all
      .filter(d => differenceInDays(d.date, now) >= -7) // include recently passed (7 days)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [country, currentYear]);

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'text-destructive';
    if (daysLeft <= 7) return 'text-destructive';
    if (daysLeft <= 30) return 'text-warning';
    if (daysLeft <= 60) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getUrgencyBg = (daysLeft: number) => {
    if (daysLeft < 0) return 'bg-destructive/10 border-destructive/30';
    if (daysLeft <= 7) return 'bg-destructive/5 border-destructive/20';
    if (daysLeft <= 30) return 'bg-warning/5 border-warning/20';
    return 'bg-card border-border';
  };

  const getUrgencyIcon = (daysLeft: number) => {
    if (daysLeft < 0) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (daysLeft <= 7) return <Bell className="h-4 w-4 text-destructive animate-pulse" />;
    if (daysLeft <= 30) return <Clock className="h-4 w-4 text-warning" />;
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  };

  const getCategoryBadge = (category: TaxDeadline['category']) => {
    const labels = {
      filing: { es: 'Declaración', en: 'Filing' },
      payment: { es: 'Pago', en: 'Payment' },
      planning: { es: 'Planificación', en: 'Planning' },
    };
    const colors = {
      filing: 'bg-primary/10 text-primary',
      payment: 'bg-destructive/10 text-destructive',
      planning: 'bg-success/10 text-success',
    };
    return (
      <Badge variant="outline" className={`${colors[category]} text-xs border-0`}>
        {labels[category][language]}
      </Badge>
    );
  };

  const nextCritical = deadlines.find(d => d.importance === 'critical' && differenceInDays(d.date, now) >= 0);
  const daysToNext = nextCritical ? differenceInDays(nextCritical.date, now) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <CalendarClock className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                {language === 'es' ? 'Calendario Fiscal' : 'Tax Calendar'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {country === 'CL' ? 'SII' : 'CRA'} — {language === 'es' ? 'Próximas fechas' : 'Upcoming dates'}
              </p>
            </div>
          </div>
          {daysToNext !== null && (
            <div className="text-right">
              <p className={`text-2xl font-bold ${getUrgencyColor(daysToNext)}`}>
                {daysToNext}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'días' : 'days'}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {deadlines.map(deadline => {
          const daysLeft = differenceInDays(deadline.date, now);
          const isPast = daysLeft < 0;

          return (
            <div
              key={deadline.id + deadline.date.getFullYear()}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getUrgencyBg(daysLeft)} transition-colors`}
            >
              {getUrgencyIcon(daysLeft)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${isPast ? 'line-through opacity-60' : ''}`}>
                    {deadline.name[language]}
                  </p>
                  {getCategoryBadge(deadline.category)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(deadline.date, 'dd MMM yyyy', { locale: language === 'es' ? esLocale : undefined })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${getUrgencyColor(daysLeft)}`}>
                  {isPast
                    ? (language === 'es' ? `Hace ${Math.abs(daysLeft)}d` : `${Math.abs(daysLeft)}d ago`)
                    : daysLeft === 0
                      ? (language === 'es' ? '¡HOY!' : 'TODAY!')
                      : `${daysLeft}d`
                  }
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
