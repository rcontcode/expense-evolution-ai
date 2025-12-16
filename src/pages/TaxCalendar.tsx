import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, CalendarDays, Clock, AlertTriangle, CheckCircle2, Info, ExternalLink, Building2, User, Briefcase, HelpCircle, Bell, FileText, Calculator, BookOpen, ChevronRight, Target, Lightbulb } from "lucide-react";
import { useProfile } from "@/hooks/data/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addDays, differenceInDays, setMonth, setDate, addMonths, isBefore, isAfter, startOfYear, endOfYear } from "date-fns";
import { es, enCA } from "date-fns/locale";
import { TaxDeadlineTimeline } from "@/components/tax-calendar/TaxDeadlineTimeline";
import { TaxDeadlineCards } from "@/components/tax-calendar/TaxDeadlineCards";
import { TaxProfileSetup } from "@/components/tax-calendar/TaxProfileSetup";
import { TaxResources } from "@/components/tax-calendar/TaxResources";

export default function TaxCalendar() {
  const { data: profile } = useProfile();
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enCA;
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showSetup, setShowSetup] = useState(false);

  // Determine user's business type from profile
  const workTypes = profile?.work_types || [];
  const hasCorporation = workTypes.includes('corporation');
  const hasContractor = workTypes.includes('contractor');
  const hasEmployee = workTypes.includes('employee');
  const fiscalYearEnd = profile?.fiscal_year_end;

  // Check if profile is complete for tax purposes
  const profileComplete = workTypes.length > 0;

  return (
    <Layout>
      <PageHeader
        title={language === 'es' ? "Calendario Fiscal CRA" : "CRA Tax Calendar"}
        description={language === 'es' 
          ? "Fechas límites, recordatorios y guía completa para tus obligaciones fiscales"
          : "Deadlines, reminders and complete guide for your tax obligations"
        }
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Status Alert */}
        {!profileComplete && (
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">
              {language === 'es' ? "Perfil Incompleto" : "Incomplete Profile"}
            </AlertTitle>
            <AlertDescription className="text-amber-400">
              {language === 'es' 
                ? "Para mostrarte las fechas correctas, necesitamos conocer tu tipo de negocio. Completa tu perfil fiscal abajo."
                : "To show you the correct dates, we need to know your business type. Complete your tax profile below."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {language === 'es' ? "Tipo de Negocio" : "Business Type"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {hasCorporation && <Badge variant="secondary">Corporation</Badge>}
                {hasContractor && <Badge variant="secondary">Sole Proprietor</Badge>}
                {hasEmployee && <Badge variant="outline">Employee</Badge>}
                {!profileComplete && (
                  <Badge variant="destructive">
                    {language === 'es' ? "Sin configurar" : "Not configured"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                {language === 'es' ? "Fin de Año Fiscal" : "Fiscal Year End"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {fiscalYearEnd 
                  ? format(new Date(fiscalYearEnd), "MMMM d", { locale })
                  : (language === 'es' ? "Diciembre 31 (por defecto)" : "December 31 (default)")
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                {language === 'es' ? "Próxima Fecha Límite" : "Next Deadline"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NextDeadlineDisplay 
                workTypes={workTypes} 
                fiscalYearEnd={fiscalYearEnd}
                language={language}
              />
            </CardContent>
          </Card>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <Label>{language === 'es' ? "Año Fiscal:" : "Tax Year:"}</Label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowSetup(!showSetup)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            {language === 'es' ? "Configurar Perfil Fiscal" : "Configure Tax Profile"}
          </Button>
        </div>

        {/* Tax Profile Setup Panel */}
        {showSetup && (
          <TaxProfileSetup onClose={() => setShowSetup(false)} />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? "Fechas Límites" : "Deadlines"}
              </span>
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? "Guía" : "Guide"}
              </span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? "Recursos" : "Resources"}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <TaxDeadlineTimeline 
              year={selectedYear}
              workTypes={workTypes}
              fiscalYearEnd={fiscalYearEnd}
            />
          </TabsContent>

          <TabsContent value="deadlines" className="space-y-4">
            <TaxDeadlineCards 
              year={selectedYear}
              workTypes={workTypes}
              fiscalYearEnd={fiscalYearEnd}
            />
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <TaxGuideContent language={language} />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <TaxResources language={language} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Next Deadline Display Component
function NextDeadlineDisplay({ 
  workTypes, 
  fiscalYearEnd,
  language 
}: { 
  workTypes: string[];
  fiscalYearEnd?: string | null;
  language: string;
}) {
  const nextDeadline = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const deadlines: { date: Date; name: string }[] = [];

    // Personal tax deadline - April 30
    deadlines.push({
      date: new Date(currentYear, 3, 30),
      name: language === 'es' ? "Impuestos Personales" : "Personal Taxes"
    });

    // Self-employed deadline - June 15
    if (workTypes.includes('contractor')) {
      deadlines.push({
        date: new Date(currentYear, 5, 15),
        name: language === 'es' ? "Autónomo (T1)" : "Self-Employed (T1)"
      });
    }

    // Corporation - 6 months after fiscal year end
    if (workTypes.includes('corporation') && fiscalYearEnd) {
      const fyeDate = new Date(fiscalYearEnd);
      const corpDeadline = addMonths(fyeDate, 6);
      deadlines.push({
        date: corpDeadline,
        name: language === 'es' ? "Corporación (T2)" : "Corporation (T2)"
      });
    }

    // GST/HST quarterly deadlines
    [0, 3, 6, 9].forEach(month => {
      const quarterEnd = new Date(currentYear, month + 2, 0);
      const gstDeadline = addMonths(quarterEnd, 1);
      deadlines.push({
        date: gstDeadline,
        name: "GST/HST"
      });
    });

    // Find next upcoming deadline
    const upcoming = deadlines
      .filter(d => isAfter(d.date, now))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming[0] || null;
  }, [workTypes, fiscalYearEnd, language]);

  if (!nextDeadline) {
    return <p className="text-muted-foreground">{language === 'es' ? "No hay fechas próximas" : "No upcoming dates"}</p>;
  }

  const daysUntil = differenceInDays(nextDeadline.date, new Date());
  const isUrgent = daysUntil <= 30;

  return (
    <div>
      <p className={`text-lg font-semibold ${isUrgent ? 'text-amber-500' : ''}`}>
        {format(nextDeadline.date, "MMM d, yyyy")}
      </p>
      <p className="text-sm text-muted-foreground">{nextDeadline.name}</p>
      <Badge variant={isUrgent ? "destructive" : "secondary"} className="mt-1">
        {daysUntil} {language === 'es' ? "días" : "days"}
      </Badge>
    </div>
  );
}

// Tax Guide Content Component
function TaxGuideContent({ language }: { language: string }) {
  const isEs = language === 'es';

  return (
    <div className="space-y-6">
      {/* How to Determine Your Filing Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {isEs ? "¿Cómo Saber Cuándo Debo Presentar?" : "How Do I Know When to File?"}
          </CardTitle>
          <CardDescription>
            {isEs 
              ? "La fecha límite depende de tu tipo de negocio y situación fiscal"
              : "Your deadline depends on your business type and tax situation"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>{isEs ? "¿No estás seguro de tu situación?" : "Not sure about your situation?"}</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{isEs 
                ? "Aquí está lo que necesitas investigar para determinar tus obligaciones fiscales:"
                : "Here's what you need to find out to determine your tax obligations:"
              }</p>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>
                  <strong>{isEs ? "Revisa tu Aviso de Incorporación" : "Check your Articles of Incorporation"}</strong>
                  {isEs ? " - Contiene la fecha de fin de año fiscal de tu corporación" : " - Contains your corporation's fiscal year end date"}
                </li>
                <li>
                  <strong>{isEs ? "Consulta tu Notice of Assessment anterior" : "Check your previous Notice of Assessment"}</strong>
                  {isEs ? " - CRA te indica el tipo de declaración que presentaste" : " - CRA tells you what type of return you filed"}
                </li>
                <li>
                  <strong>{isEs ? "Accede a CRA My Account" : "Access CRA My Account"}</strong>
                  {isEs ? " - Ve tu historial de declaraciones y fechas límites personalizadas" : " - See your filing history and personalized deadlines"}
                </li>
                <li>
                  <strong>{isEs ? "Pregunta a tu contador" : "Ask your accountant"}</strong>
                  {isEs ? " - Si tienes uno, ellos conocen tu situación específica" : " - If you have one, they know your specific situation"}
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Accordion for Each Business Type */}
      <Accordion type="multiple" className="space-y-4">
        {/* Personal Taxes */}
        <AccordionItem value="personal" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{isEs ? "Impuestos Personales (T1)" : "Personal Taxes (T1)"}</p>
                <p className="text-sm text-muted-foreground">{isEs ? "Empleados y todos los individuos" : "Employees and all individuals"}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-500">{isEs ? "Fecha Límite" : "Deadline"}</h4>
                <p className="text-2xl font-bold">30 {isEs ? "de Abril" : "April"}</p>
                <p className="text-sm text-muted-foreground">
                  {isEs 
                    ? "Para presentar Y pagar cualquier saldo adeudado"
                    : "To file AND pay any balance owing"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">{isEs ? "Qué Incluye" : "What's Included"}</h4>
                <ul className="text-sm space-y-1">
                  <li>• {isEs ? "Ingresos de empleo (T4)" : "Employment income (T4)"}</li>
                  <li>• {isEs ? "Inversiones y dividendos" : "Investments and dividends"}</li>
                  <li>• {isEs ? "Deducciones personales (RRSP, etc.)" : "Personal deductions (RRSP, etc.)"}</li>
                  <li>• {isEs ? "Créditos fiscales" : "Tax credits"}</li>
                </ul>
              </div>
            </div>
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                {isEs 
                  ? "Si debes dinero y no pagas antes del 30 de abril, comenzarás a acumular intereses."
                  : "If you owe money and don't pay by April 30, you'll start accumulating interest."
                }
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        {/* Self-Employed / Sole Proprietorship */}
        <AccordionItem value="selfemployed" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Briefcase className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{isEs ? "Autónomo / Sole Proprietorship (T1)" : "Self-Employed / Sole Proprietorship (T1)"}</p>
                <p className="text-sm text-muted-foreground">{isEs ? "Trabajadores independientes y freelancers" : "Independent contractors and freelancers"}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-500">{isEs ? "Fecha Límite para PRESENTAR" : "Filing Deadline"}</h4>
                <p className="text-2xl font-bold">15 {isEs ? "de Junio" : "June"}</p>
                <p className="text-sm text-muted-foreground">
                  {isEs 
                    ? "Tienes hasta junio 15 para presentar tu declaración"
                    : "You have until June 15 to file your return"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-red-500">{isEs ? "Fecha Límite para PAGAR" : "Payment Deadline"}</h4>
                <p className="text-2xl font-bold">30 {isEs ? "de Abril" : "April"}</p>
                <p className="text-sm text-muted-foreground">
                  {isEs 
                    ? "⚠️ PERO el pago sigue siendo el 30 de abril"
                    : "⚠️ BUT payment is still due April 30"
                  }
                </p>
              </div>
            </div>
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{isEs ? "¡Importante!" : "Important!"}</AlertTitle>
              <AlertDescription>
                {isEs 
                  ? "Aunque puedes presentar hasta junio 15, los intereses sobre cualquier saldo adeudado comienzan el 1 de mayo. Estima y paga antes del 30 de abril para evitar intereses."
                  : "Although you can file until June 15, interest on any balance owing starts May 1. Estimate and pay before April 30 to avoid interest."
                }
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <h4 className="font-semibold">{isEs ? "Formularios Requeridos" : "Required Forms"}</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>T2125</strong> - {isEs ? "Estado de Actividades de Negocio o Profesionales" : "Statement of Business or Professional Activities"}</li>
                <li>• {isEs ? "Anexar a tu declaración T1 personal" : "Attached to your personal T1 return"}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Corporation */}
        <AccordionItem value="corporation" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{isEs ? "Corporación (T2)" : "Corporation (T2)"}</p>
                <p className="text-sm text-muted-foreground">{isEs ? "Empresas incorporadas" : "Incorporated businesses"}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-500">{isEs ? "Fecha Límite" : "Deadline"}</h4>
                <p className="text-2xl font-bold">{isEs ? "6 meses después del FYE" : "6 months after FYE"}</p>
                <p className="text-sm text-muted-foreground">
                  {isEs 
                    ? "Después del fin de tu año fiscal (Fiscal Year End)"
                    : "After your Fiscal Year End (FYE)"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-red-500">{isEs ? "Pago de Impuestos" : "Tax Payment"}</h4>
                <p className="text-2xl font-bold">{isEs ? "2-3 meses después del FYE" : "2-3 months after FYE"}</p>
                <p className="text-sm text-muted-foreground">
                  {isEs 
                    ? "Depende del tipo de corporación"
                    : "Depends on corporation type"
                  }
                </p>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-semibold">{isEs ? "Ejemplos de Fechas Límites:" : "Example Deadlines:"}</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>{isEs ? "FYE Diciembre 31:" : "FYE December 31:"}</span>
                  <span className="font-semibold">{isEs ? "Presentar antes de Junio 30" : "File by June 30"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEs ? "FYE Marzo 31:" : "FYE March 31:"}</span>
                  <span className="font-semibold">{isEs ? "Presentar antes de Septiembre 30" : "File by September 30"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEs ? "FYE Junio 30:" : "FYE June 30:"}</span>
                  <span className="font-semibold">{isEs ? "Presentar antes de Diciembre 31" : "File by December 31"}</span>
                </div>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{isEs ? "¿Dónde encontrar tu FYE?" : "Where to find your FYE?"}</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• {isEs ? "Articles of Incorporation (Certificado de Incorporación)" : "Articles of Incorporation"}</li>
                  <li>• {isEs ? "Notice of Assessment anterior de T2" : "Previous T2 Notice of Assessment"}</li>
                  <li>• {isEs ? "CRA My Business Account" : "CRA My Business Account"}</li>
                  <li>• {isEs ? "Tu contador o abogado corporativo" : "Your accountant or corporate lawyer"}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        {/* GST/HST */}
        <AccordionItem value="gst" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <Calculator className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold">GST/HST</p>
                <p className="text-sm text-muted-foreground">{isEs ? "Impuesto sobre bienes y servicios" : "Goods and Services Tax"}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>{isEs ? "¿Necesitas registrarte?" : "Do you need to register?"}</AlertTitle>
              <AlertDescription>
                {isEs 
                  ? "Debes registrarte para GST/HST si tus ingresos brutos superan $30,000 en un período de 12 meses."
                  : "You must register for GST/HST if your gross revenues exceed $30,000 in any 12-month period."
                }
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <h4 className="font-semibold">{isEs ? "Frecuencia de Presentación" : "Filing Frequency"}</h4>
              <div className="grid gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold">{isEs ? "Anual" : "Annual"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isEs 
                      ? "Ingresos < $1.5M - 3 meses después del año fiscal"
                      : "Revenue < $1.5M - 3 months after fiscal year"
                    }
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold">{isEs ? "Trimestral" : "Quarterly"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isEs 
                      ? "Ingresos $1.5M - $6M - 1 mes después del trimestre"
                      : "Revenue $1.5M - $6M - 1 month after quarter end"
                    }
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-semibold">{isEs ? "Mensual" : "Monthly"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isEs 
                      ? "Ingresos > $6M - 1 mes después de cada mes"
                      : "Revenue > $6M - 1 month after each month end"
                    }
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
