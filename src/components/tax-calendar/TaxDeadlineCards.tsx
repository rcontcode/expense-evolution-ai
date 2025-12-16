import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addMonths, differenceInDays, isAfter } from "date-fns";
import { es, enCA } from "date-fns/locale";
import { Calendar, AlertTriangle, CheckCircle2, Clock, Building2, User, Briefcase, Calculator, Bell, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";

interface CardsProps {
  year: number;
  workTypes: string[];
  fiscalYearEnd?: string | null;
}

export function TaxDeadlineCards({ year, workTypes, fiscalYearEnd }: CardsProps) {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enCA;
  const isEs = language === 'es';
  const today = new Date();

  const hasCorp = workTypes.includes('corporation');
  const hasSole = workTypes.includes('contractor');

  // Calculate FYE-based dates for corporation
  const corpDates = useMemo(() => {
    if (!hasCorp) return null;
    let fyeDate: Date;
    if (fiscalYearEnd) {
      fyeDate = new Date(fiscalYearEnd);
      fyeDate.setFullYear(year - 1);
    } else {
      fyeDate = new Date(year - 1, 11, 31);
    }
    return {
      fyeDate,
      filingDeadline: addMonths(fyeDate, 6),
      paymentDeadline: addMonths(fyeDate, 3),
    };
  }, [hasCorp, fiscalYearEnd, year]);

  const handleSetReminder = (deadlineName: string, date: Date) => {
    // In a real app, this would integrate with notification system
    toast.success(
      isEs 
        ? `Recordatorio configurado para ${deadlineName} el ${format(date, 'PPP', { locale })}`
        : `Reminder set for ${deadlineName} on ${format(date, 'PPP', { locale })}`
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Personal Taxes Card */}
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>{isEs ? "Impuestos Personales" : "Personal Taxes"}</CardTitle>
                <CardDescription>T1 Return</CardDescription>
              </div>
            </div>
            <StatusBadge date={new Date(year, 3, 30)} today={today} isEs={isEs} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{isEs ? "Fecha Límite" : "Deadline"}</p>
              <p className="text-xl font-bold">
                {format(new Date(year, 3, 30), 'MMMM d', { locale })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isEs ? "Días Restantes" : "Days Left"}</p>
              <DaysRemaining date={new Date(year, 3, 30)} today={today} isEs={isEs} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{isEs ? "Aplica para:" : "Applies to:"}</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {isEs ? "Todos los residentes canadienses" : "All Canadian residents"}</li>
              <li>• {isEs ? "Ingresos de empleo (T4)" : "Employment income (T4)"}</li>
              <li>• {isEs ? "Inversiones y dividendos" : "Investments and dividends"}</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleSetReminder(isEs ? "Impuestos Personales" : "Personal Taxes", new Date(year, 3, 30))}
            >
              <Bell className="h-4 w-4 mr-2" />
              {isEs ? "Recordatorio" : "Reminder"}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="https://www.canada.ca/en/services/taxes/income-tax/personal-income-tax.html" target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4 mr-2" />
                CRA
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Self-Employed Card */}
      {hasSole && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle>{isEs ? "Autónomo" : "Self-Employed"}</CardTitle>
                  <CardDescription>T1 + T2125</CardDescription>
                </div>
              </div>
              <StatusBadge date={new Date(year, 5, 15)} today={today} isEs={isEs} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {isEs 
                  ? "⚠️ Pago sigue siendo Abril 30, solo la declaración es Junio 15"
                  : "⚠️ Payment still due April 30, only filing extends to June 15"
                }
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{isEs ? "Presentar" : "File By"}</p>
                <p className="text-xl font-bold text-amber-500">
                  {format(new Date(year, 5, 15), 'MMM d', { locale })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isEs ? "Pagar" : "Pay By"}</p>
                <p className="text-xl font-bold text-red-500">
                  {format(new Date(year, 3, 30), 'MMM d', { locale })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{isEs ? "Formularios:" : "Forms:"}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>T2125</strong> - {isEs ? "Estado de Actividades de Negocio" : "Business Activities Statement"}</li>
                <li>• {isEs ? "Anexar a tu declaración T1" : "Attach to your T1 return"}</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSetReminder(isEs ? "Autónomo" : "Self-Employed", new Date(year, 5, 15))}
              >
                <Bell className="h-4 w-4 mr-2" />
                {isEs ? "Recordatorio" : "Reminder"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html" target="_blank" rel="noopener">
                  <FileText className="h-4 w-4 mr-2" />
                  T2125
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Corporation Card */}
      {hasCorp && corpDates && (
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle>{isEs ? "Corporación" : "Corporation"}</CardTitle>
                  <CardDescription>T2 Return</CardDescription>
                </div>
              </div>
              <StatusBadge date={corpDates.filingDeadline} today={today} isEs={isEs} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">{isEs ? "Fin de Año Fiscal (FYE)" : "Fiscal Year End (FYE)"}</p>
              <p className="text-lg font-bold">{format(corpDates.fyeDate, 'MMMM d, yyyy', { locale })}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{isEs ? "Presentar (6 meses)" : "File (6 months)"}</p>
                <p className="text-xl font-bold text-purple-500">
                  {format(corpDates.filingDeadline, 'MMM d', { locale })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isEs ? "Pagar (3 meses)" : "Pay (3 months)"}</p>
                <p className="text-xl font-bold text-red-500">
                  {format(corpDates.paymentDeadline, 'MMM d', { locale })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSetReminder(isEs ? "Corporación" : "Corporation", corpDates.filingDeadline)}
              >
                <Bell className="h-4 w-4 mr-2" />
                {isEs ? "Recordatorio" : "Reminder"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2.html" target="_blank" rel="noopener">
                  <FileText className="h-4 w-4 mr-2" />
                  T2
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GST/HST Card */}
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <Calculator className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle>GST/HST</CardTitle>
                <CardDescription>{isEs ? "Impuesto sobre Bienes y Servicios" : "Goods and Services Tax"}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              {isEs 
                ? "Obligatorio si ingresos > $30,000 en 12 meses"
                : "Required if revenue > $30,000 in 12 months"
              }
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">{isEs ? "Fechas Trimestrales:" : "Quarterly Deadlines:"}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 border rounded-lg">
                <p className="text-muted-foreground">Q1 (Jan-Mar)</p>
                <p className="font-semibold">{isEs ? "Abril 30" : "April 30"}</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-muted-foreground">Q2 (Apr-Jun)</p>
                <p className="font-semibold">{isEs ? "Julio 31" : "July 31"}</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-muted-foreground">Q3 (Jul-Sep)</p>
                <p className="font-semibold">{isEs ? "Octubre 31" : "October 31"}</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-muted-foreground">Q4 (Oct-Dec)</p>
                <p className="font-semibold">{isEs ? "Enero 31" : "January 31"}</p>
              </div>
            </div>
          </div>

          <Button size="sm" variant="outline" asChild>
            <a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html" target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />
              {isEs ? "Más información" : "Learn more"}
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* RRSP Card */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-500/10">
                <Calendar className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <CardTitle>RRSP</CardTitle>
                <CardDescription>{isEs ? "Plan de Ahorro para Retiro" : "Retirement Savings Plan"}</CardDescription>
              </div>
            </div>
            <StatusBadge date={new Date(year, 2, 1)} today={today} isEs={isEs} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{isEs ? "Fecha Límite" : "Deadline"}</p>
              <p className="text-xl font-bold">
                {format(new Date(year, 2, 1), 'MMMM d', { locale })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isEs ? "Para año fiscal" : "For tax year"}</p>
              <p className="text-xl font-bold">{year - 1}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {isEs 
              ? "Último día para contribuir al RRSP y obtener la deducción en tu declaración del año anterior."
              : "Last day to contribute to your RRSP and claim the deduction on last year's return."
            }
          </p>

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleSetReminder("RRSP", new Date(year, 2, 1))}
          >
            <Bell className="h-4 w-4 mr-2" />
            {isEs ? "Recordatorio" : "Reminder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ date, today, isEs }: { date: Date; today: Date; isEs: boolean }) {
  const daysUntil = differenceInDays(date, today);
  
  if (daysUntil < 0) {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {isEs ? "Pasado" : "Past"}
      </Badge>
    );
  }
  
  if (daysUntil <= 7) {
    return (
      <Badge variant="destructive" className="animate-pulse">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {isEs ? "¡Urgente!" : "Urgent!"}
      </Badge>
    );
  }
  
  if (daysUntil <= 30) {
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-500">
        <Clock className="h-3 w-3 mr-1" />
        {isEs ? "Próximo" : "Soon"}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline">
      <Calendar className="h-3 w-3 mr-1" />
      {isEs ? "Pendiente" : "Upcoming"}
    </Badge>
  );
}

function DaysRemaining({ date, today, isEs }: { date: Date; today: Date; isEs: boolean }) {
  const daysUntil = differenceInDays(date, today);
  
  if (daysUntil < 0) {
    return <p className="text-xl font-bold text-muted-foreground">{isEs ? "Pasado" : "Passed"}</p>;
  }
  
  const colorClass = daysUntil <= 7 ? 'text-red-500' : daysUntil <= 30 ? 'text-amber-500' : 'text-green-500';
  
  return (
    <p className={`text-xl font-bold ${colorClass}`}>
      {daysUntil} {isEs ? "días" : "days"}
    </p>
  );
}
