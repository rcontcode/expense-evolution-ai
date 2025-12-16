import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addMonths, differenceInDays, isAfter, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { es, enCA } from "date-fns/locale";
import { Calendar, AlertTriangle, CheckCircle2, Clock, Building2, User, Briefcase, Calculator } from "lucide-react";

interface TimelineProps {
  year: number;
  workTypes: string[];
  fiscalYearEnd?: string | null;
}

interface Deadline {
  date: Date;
  name: string;
  nameEs: string;
  type: 'personal' | 'selfemployed' | 'corporation' | 'gst' | 'payment';
  description: string;
  descriptionEs: string;
  icon: React.ReactNode;
  color: string;
}

export function TaxDeadlineTimeline({ year, workTypes, fiscalYearEnd }: TimelineProps) {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enCA;
  const isEs = language === 'es';
  const today = new Date();

  const deadlines = useMemo(() => {
    const items: Deadline[] = [];
    const hasCorp = workTypes.includes('corporation');
    const hasSole = workTypes.includes('contractor');

    // RRSP Deadline - March 1 (or Feb 29 in leap year)
    items.push({
      date: new Date(year, 2, 1),
      name: "RRSP Contribution Deadline",
      nameEs: "Fecha Límite Contribución RRSP",
      type: 'personal',
      description: "Last day to contribute to RRSP for previous tax year deduction",
      descriptionEs: "Último día para contribuir al RRSP y deducir en el año fiscal anterior",
      icon: <User className="h-4 w-4" />,
      color: "bg-blue-500"
    });

    // Personal Tax Payment - April 30
    items.push({
      date: new Date(year, 3, 30),
      name: "Personal Tax Payment Due",
      nameEs: "Pago de Impuestos Personales",
      type: 'payment',
      description: "Pay any balance owing to avoid interest",
      descriptionEs: "Pagar cualquier saldo adeudado para evitar intereses",
      icon: <Calculator className="h-4 w-4" />,
      color: "bg-red-500"
    });

    // Personal Tax Filing - April 30
    items.push({
      date: new Date(year, 3, 30),
      name: "Personal Tax Filing (T1)",
      nameEs: "Declaración Personal (T1)",
      type: 'personal',
      description: "Deadline for employees to file T1 return",
      descriptionEs: "Fecha límite para empleados para presentar declaración T1",
      icon: <User className="h-4 w-4" />,
      color: "bg-blue-500"
    });

    // Self-Employed Filing - June 15
    if (hasSole) {
      items.push({
        date: new Date(year, 5, 15),
        name: "Self-Employed Filing (T1+T2125)",
        nameEs: "Declaración Autónomo (T1+T2125)",
        type: 'selfemployed',
        description: "Extended deadline for self-employed to file (payment still due April 30)",
        descriptionEs: "Fecha extendida para autónomos (el pago sigue siendo abril 30)",
        icon: <Briefcase className="h-4 w-4" />,
        color: "bg-amber-500"
      });
    }

    // Corporation - 6 months after fiscal year end
    if (hasCorp) {
      let fyeDate: Date;
      if (fiscalYearEnd) {
        fyeDate = new Date(fiscalYearEnd);
        fyeDate.setFullYear(year - 1); // FYE of previous year
      } else {
        fyeDate = new Date(year - 1, 11, 31); // Dec 31 of previous year
      }
      
      const corpFilingDeadline = addMonths(fyeDate, 6);
      const corpPaymentDeadline = addMonths(fyeDate, 3);

      items.push({
        date: corpPaymentDeadline,
        name: "Corporation Tax Payment (T2)",
        nameEs: "Pago Impuestos Corporación (T2)",
        type: 'payment',
        description: `Tax payment due 3 months after fiscal year end (${format(fyeDate, 'MMM d')})`,
        descriptionEs: `Pago de impuestos 3 meses después del fin del año fiscal (${format(fyeDate, 'MMM d', { locale: es })})`,
        icon: <Calculator className="h-4 w-4" />,
        color: "bg-red-500"
      });

      items.push({
        date: corpFilingDeadline,
        name: "Corporation Filing (T2)",
        nameEs: "Declaración Corporación (T2)",
        type: 'corporation',
        description: `Filing deadline 6 months after fiscal year end (${format(fyeDate, 'MMM d')})`,
        descriptionEs: `Fecha límite 6 meses después del fin del año fiscal (${format(fyeDate, 'MMM d', { locale: es })})`,
        icon: <Building2 className="h-4 w-4" />,
        color: "bg-purple-500"
      });
    }

    // GST/HST Quarterly deadlines (if registered)
    const quarters = [
      { end: new Date(year, 2, 31), name: "Q1" },
      { end: new Date(year, 5, 30), name: "Q2" },
      { end: new Date(year, 8, 30), name: "Q3" },
      { end: new Date(year, 11, 31), name: "Q4" },
    ];

    quarters.forEach(q => {
      const deadline = addMonths(q.end, 1);
      items.push({
        date: deadline,
        name: `GST/HST ${q.name}`,
        nameEs: `GST/HST ${q.name}`,
        type: 'gst',
        description: `GST/HST return for ${q.name} ${year}`,
        descriptionEs: `Declaración GST/HST para ${q.name} ${year}`,
        icon: <Calculator className="h-4 w-4" />,
        color: "bg-green-500"
      });
    });

    // Sort by date
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [year, workTypes, fiscalYearEnd]);

  // Group deadlines by month
  const monthlyDeadlines = useMemo(() => {
    const grouped: { [key: string]: Deadline[] } = {};
    deadlines.forEach(d => {
      const monthKey = format(d.date, 'yyyy-MM');
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(d);
    });
    return grouped;
  }, [deadlines]);

  return (
    <div className="space-y-6">
      {/* Visual Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEs ? `Línea de Tiempo ${year}` : `${year} Timeline`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month-by-month view */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {Object.entries(monthlyDeadlines).map(([monthKey, items]) => {
                const monthDate = new Date(monthKey + '-01');
                const isPast = isBefore(endOfMonth(monthDate), today);
                const isCurrent = isBefore(startOfMonth(monthDate), today) && isAfter(endOfMonth(monthDate), today);

                return (
                  <div key={monthKey} className="relative pl-10">
                    {/* Month marker */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                        isPast ? 'bg-muted text-muted-foreground' : 'bg-background border-2 border-primary text-primary'}`}>
                      {format(monthDate, 'MMM', { locale }).slice(0, 3).toUpperCase()}
                    </div>

                    <div className="space-y-3">
                      <p className={`text-sm font-semibold ${isPast ? 'text-muted-foreground' : ''}`}>
                        {format(monthDate, 'MMMM yyyy', { locale })}
                      </p>

                      {items.map((item, idx) => {
                        const daysUntil = differenceInDays(item.date, today);
                        const isPastDeadline = daysUntil < 0;
                        const isUrgent = daysUntil >= 0 && daysUntil <= 30;
                        const isVeryUrgent = daysUntil >= 0 && daysUntil <= 7;

                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-lg border transition-all
                              ${isPastDeadline ? 'bg-muted/30 border-muted opacity-60' : 
                                isVeryUrgent ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/20' :
                                isUrgent ? 'bg-amber-500/10 border-amber-500/50' : 
                                'bg-card border-border hover:border-primary/50'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${item.color}/10`}>
                                  {item.icon}
                                </div>
                                <div>
                                  <p className="font-medium">{isEs ? item.nameEs : item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {isEs ? item.descriptionEs : item.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold">{format(item.date, 'MMM d', { locale })}</p>
                                {isPastDeadline ? (
                                  <Badge variant="secondary" className="mt-1">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {isEs ? "Pasado" : "Past"}
                                  </Badge>
                                ) : isVeryUrgent ? (
                                  <Badge variant="destructive" className="mt-1 animate-pulse">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {daysUntil} {isEs ? "días" : "days"}
                                  </Badge>
                                ) : isUrgent ? (
                                  <Badge variant="outline" className="mt-1 border-amber-500 text-amber-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {daysUntil} {isEs ? "días" : "days"}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="mt-1">
                                    {daysUntil} {isEs ? "días" : "days"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30">
          <User className="h-3 w-3 mr-1" /> {isEs ? "Personal" : "Personal"}
        </Badge>
        <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30">
          <Briefcase className="h-3 w-3 mr-1" /> {isEs ? "Autónomo" : "Self-Employed"}
        </Badge>
        <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30">
          <Building2 className="h-3 w-3 mr-1" /> {isEs ? "Corporación" : "Corporation"}
        </Badge>
        <Badge variant="outline" className="bg-green-500/10 border-green-500/30">
          <Calculator className="h-3 w-3 mr-1" /> GST/HST
        </Badge>
        <Badge variant="outline" className="bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" /> {isEs ? "Pago" : "Payment"}
        </Badge>
      </div>
    </div>
  );
}
