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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, CalendarDays, Clock, AlertTriangle, CheckCircle2, Info, ExternalLink, Building2, User, Briefcase, HelpCircle, BookOpen, Calculator, Lightbulb, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/data/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addMonths, differenceInDays, isAfter } from "date-fns";
import { es, enCA } from "date-fns/locale";
import { TaxDeadlineTimeline } from "@/components/tax-calendar/TaxDeadlineTimeline";
import { TaxDeadlineCards } from "@/components/tax-calendar/TaxDeadlineCards";
import { TaxSituationWizard } from "@/components/tax-calendar/TaxSituationWizard";
import { TaxResources } from "@/components/tax-calendar/TaxResources";
import { TaxEstimator } from "@/components/tax-calendar/TaxEstimator";
import { TaxInfoVersionBadge } from "@/components/tax-calendar/TaxInfoVersionBadge";
import type { CountryCode } from "@/lib/constants/country-tax-config";

export default function TaxCalendar() {
  const { data: profile } = useProfile();
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enCA;
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showWizard, setShowWizard] = useState(false);

  // Determine user's business type from profile
  const workTypes = profile?.work_types || [];
  const hasCorporation = workTypes.includes('corporation');
  const hasContractor = workTypes.includes('contractor');
  const hasEmployee = workTypes.includes('employee');
  const fiscalYearEnd = profile?.fiscal_year_end;
  const businessStartDate = profile?.business_start_date;

  // Check if profile is complete for tax purposes
  const profileComplete = workTypes.length > 0;

  // Check if business started recently (first year)
  const isFirstTaxYear = businessStartDate && 
    new Date(businessStartDate).getFullYear() >= new Date().getFullYear() - 1;

  const countryCode = (profile?.country || 'CA') as CountryCode;

  return (
    <Layout>
      <PageHeader
        title={profile?.country === 'CL' ? "Centro Fiscal SII" : (language === 'es' ? "Centro Fiscal CRA" : "CRA Tax Center")}
        description={profile?.country === 'CL' 
          ? "Gestiona tus obligaciones tributarias con el Servicio de Impuestos Internos"
          : (language === 'es'
            ? "Calendario, estimador, recordatorios y guía completa para tus obligaciones fiscales"
            : "Calendar, estimator, reminders and complete guide for your tax obligations")
        }
      >
        <TaxInfoVersionBadge country={countryCode} />
      </PageHeader>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Status Alert */}
        {!profileComplete && (
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">
              {language === 'es' ? "Configuración Requerida" : "Setup Required"}
            </AlertTitle>
            <AlertDescription className="text-amber-400">
              {language === 'es' 
                ? "Para mostrarte información personalizada, necesitamos conocer tu situación fiscal. Usa el asistente de configuración."
                : "To show you personalized information, we need to know your tax situation. Use the setup wizard."
              }
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 mt-2"
                onClick={() => setShowWizard(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {language === 'es' ? "Configurar Ahora" : "Configure Now"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* First Tax Year Alert */}
        {isFirstTaxYear && profileComplete && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">
              {language === 'es' ? "Primer Año Fiscal" : "First Tax Year"}
            </AlertTitle>
            <AlertDescription className="text-blue-400">
              {language === 'es' 
                ? `Tu negocio comenzó en ${format(new Date(businessStartDate!), "MMMM yyyy", { locale })}. Tu primera declaración cubrirá solo desde esa fecha. Las fechas mostradas aplican desde tu siguiente año fiscal completo.`
                : `Your business started in ${format(new Date(businessStartDate!), "MMMM yyyy", { locale })}. Your first return will cover only from that date. Dates shown apply from your next full fiscal year.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Status Cards */}
        <div className="grid gap-4 md:grid-cols-4" data-highlight="tax-status-cards">
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
                {hasCorporation && fiscalYearEnd 
                  ? format(new Date(fiscalYearEnd), "MMMM d", { locale })
                  : (language === 'es' ? "Diciembre 31" : "December 31")
                }
              </p>
              {!hasCorporation && (
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? "(Año calendario)" : "(Calendar year)"}
                </p>
              )}
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
                country={profile?.country || 'CA'}
              />
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-purple-500" />
                {profile?.country === 'CL' ? "IVA" : (language === 'es' ? "GST/HST" : "GST/HST Status")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {profile?.country === 'CL'
                  ? (profile?.tax_regime 
                      ? (profile.tax_regime === 'general' ? 'Régimen General' : 
                         profile.tax_regime === 'pyme' ? 'PyME' : 'Pro PyME')
                      : (language === 'es' ? "Sin configurar" : "Not configured"))
                  : (profile?.gst_hst_registered 
                      ? (language === 'es' ? "Registrado" : "Registered")
                      : (language === 'es' ? "No registrado" : "Not Registered"))
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Year Selector & Config Button */}
        <div className="flex items-center gap-4 flex-wrap">
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
          <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            {language === 'es' 
              ? (profileComplete ? "Actualizar Configuración" : "Asistente de Configuración")
              : (profileComplete ? "Update Configuration" : "Setup Wizard")
            }
          </Button>
        </div>

        {/* Tax Situation Wizard */}
        {showWizard && (
          <TaxSituationWizard 
            onClose={() => setShowWizard(false)} 
            onComplete={() => setShowWizard(false)}
          />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4" data-highlight="tax-tabs">
          <TabsList className="grid w-full grid-cols-5" data-highlight="tax-tab-list">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? "Fechas" : "Deadlines"}
              </span>
            </TabsTrigger>
            <TabsTrigger value="estimator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? "Estimador" : "Estimator"}
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
              country={profile?.country || 'CA'}
            />
          </TabsContent>

          <TabsContent value="estimator" className="space-y-4">
            <div data-highlight="tax-estimator">
              <TaxEstimator />
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <TaxGuideContent language={language} country={profile?.country || 'CA'} />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <TaxResources language={language} country={profile?.country || 'CA'} />
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
  language,
  country = 'CA'
}: { 
  workTypes: string[];
  fiscalYearEnd?: string | null;
  language: string;
  country?: string;
}) {
  const nextDeadline = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const deadlines: { date: Date; name: string }[] = [];
    const isChile = country === 'CL';

    if (isChile) {
      // Chile: F22 - Abril 30
      deadlines.push({
        date: new Date(currentYear, 3, 30),
        name: "Formulario 22 (Renta Anual)"
      });

      // Chile: F29 - día 12 de cada mes
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();
      if (currentDay <= 12) {
        deadlines.push({
          date: new Date(currentYear, currentMonth, 12),
          name: "Formulario 29 (IVA/PPM)"
        });
      } else {
        deadlines.push({
          date: new Date(currentYear, currentMonth + 1, 12),
          name: "Formulario 29 (IVA/PPM)"
        });
      }

      // Chile: APV - Diciembre 30
      deadlines.push({
        date: new Date(currentYear, 11, 30),
        name: "APV (Ahorro Previsional)"
      });
    } else {
      // Canada: Personal tax deadline - April 30
      deadlines.push({
        date: new Date(currentYear, 3, 30),
        name: language === 'es' ? "Impuestos Personales" : "Personal Taxes"
      });

      // Canada: Self-employed deadline - June 15
      if (workTypes.includes('contractor')) {
        deadlines.push({
          date: new Date(currentYear, 5, 15),
          name: language === 'es' ? "Autónomo (T1)" : "Self-Employed (T1)"
        });
      }

      // Canada: Corporation - 6 months after fiscal year end
      if (workTypes.includes('corporation') && fiscalYearEnd) {
        const fyeDate = new Date(fiscalYearEnd);
        const corpDeadline = addMonths(fyeDate, 6);
        deadlines.push({
          date: corpDeadline,
          name: language === 'es' ? "Corporación (T2)" : "Corporation (T2)"
        });
      }

      // Canada: GST/HST quarterly deadlines
      [0, 3, 6, 9].forEach(month => {
        const quarterEnd = new Date(currentYear, month + 2, 0);
        const gstDeadline = addMonths(quarterEnd, 1);
        deadlines.push({
          date: gstDeadline,
          name: "GST/HST"
        });
      });
    }

    // Find next upcoming deadline
    const upcoming = deadlines
      .filter(d => isAfter(d.date, now))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming[0] || null;
  }, [workTypes, fiscalYearEnd, language, country]);

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
function TaxGuideContent({ language, country = 'CA' }: { language: string; country?: string }) {
  const isEs = language === 'es';
  const isChile = country === 'CL';

  if (isChile) {
    return (
      <div className="space-y-6">
        {/* Disclaimer Chile */}
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Aviso Legal Importante</AlertTitle>
          <AlertDescription className="text-sm">
            Esta información es solo referencial y no constituye asesoría tributaria profesional. 
            Las normas del SII cambian frecuentemente. Consulta siempre con un contador autorizado 
            o directamente con el Servicio de Impuestos Internos para tu situación específica.
          </AlertDescription>
        </Alert>

        {/* Chile: How to Determine Your Filing Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              ¿Cómo Saber Qué Debo Declarar?
            </CardTitle>
            <CardDescription>
              Tus obligaciones dependen de tu tipo de renta y régimen tributario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>¿No estás seguro de tu situación?</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>Aquí está lo que necesitas verificar:</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li><strong>Revisa tu inicio de actividades</strong> - En sii.cl/servicios_online puedes ver tu situación tributaria</li>
                  <li><strong>Consulta tu régimen tributario</strong> - General (27%), Pro PyME (25%), 14D N°8</li>
                  <li><strong>Verifica tus obligaciones mensuales</strong> - F29 si emites boletas o facturas</li>
                  <li><strong>Consulta a un contador</strong> - Especialmente si tienes múltiples fuentes de ingreso</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Accordion for Chile Business Types */}
        <Accordion type="multiple" className="space-y-4">
          {/* F22 - Declaración Anual */}
          <AccordionItem value="f22" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Formulario 22 - Declaración Anual</p>
                  <p className="text-sm text-muted-foreground">Todos los contribuyentes</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-500">Fecha Límite</h4>
                  <p className="text-2xl font-bold">30 de Abril</p>
                  <p className="text-sm text-muted-foreground">
                    Para presentar y pagar (o recibir devolución)
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Qué Incluye</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Rentas de Primera Categoría (empresas)</li>
                    <li>• Rentas de Segunda Categoría (sueldos, honorarios)</li>
                    <li>• Créditos por APV, gastos de educación</li>
                    <li>• Reliquidación de impuestos</li>
                  </ul>
                </div>
              </div>
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  El SII prepara una propuesta de declaración basada en la información que posee. 
                  Revísala cuidadosamente antes de aceptar.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* F29 - IVA Mensual */}
          <AccordionItem value="f29" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Calculator className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Formulario 29 - IVA y PPM Mensual</p>
                  <p className="text-sm text-muted-foreground">Contribuyentes afectos a IVA</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-500">Fecha Límite</h4>
                  <p className="text-2xl font-bold">12 de cada mes</p>
                  <p className="text-sm text-muted-foreground">
                    Por el período del mes anterior
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Qué Incluye</h4>
                  <ul className="text-sm space-y-1">
                    <li>• IVA Débito Fiscal (ventas)</li>
                    <li>• IVA Crédito Fiscal (compras)</li>
                    <li>• PPM (Pagos Provisionales Mensuales)</li>
                    <li>• Retenciones de honorarios</li>
                  </ul>
                </div>
              </div>
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Importante!</AlertTitle>
                <AlertDescription>
                  La declaración y pago fuera de plazo genera multas e intereses. 
                  Si no tuviste movimientos, igual debes declarar "sin movimiento".
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Boletas de Honorarios */}
          <AccordionItem value="honorarios" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Boletas de Honorarios - Segunda Categoría</p>
                  <p className="text-sm text-muted-foreground">Profesionales independientes</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-500">Retención Actual</h4>
                  <p className="text-2xl font-bold">13.75% (2024)</p>
                  <p className="text-sm text-muted-foreground">
                    Aumentando progresivamente hasta 17%
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Obligaciones</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Emitir boletas electrónicas en sii.cl</li>
                    <li>• Declarar en F22 anual</li>
                    <li>• Cotizaciones previsionales obligatorias</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Cotizaciones Obligatorias (desde 2019)</h4>
                <p className="text-sm text-muted-foreground">
                  Los trabajadores a honorarios deben pagar cotizaciones de salud (7%) y AFP 
                  con cargo a la retención del 13.75%. El SII calcula automáticamente en el F22.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Régimen Pro PyME */}
          <AccordionItem value="propyme" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Régimen Pro PyME (14D N°3)</p>
                  <p className="text-sm text-muted-foreground">Micro, pequeñas y medianas empresas</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-500">Tasa de Impuesto</h4>
                  <p className="text-2xl font-bold">25%</p>
                  <p className="text-sm text-muted-foreground">
                    vs 27% del régimen general
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Requisitos</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Ingresos anuales hasta 75.000 UF</li>
                    <li>• Capital efectivo hasta 85.000 UF</li>
                    <li>• Contabilidad simplificada</li>
                  </ul>
                </div>
              </div>
              <Alert className="bg-purple-500/10 border-purple-500/30">
                <Info className="h-4 w-4 text-purple-500" />
                <AlertDescription>
                  El régimen Pro PyME permite tributar sobre base de flujos de caja (ingresos percibidos 
                  menos gastos pagados), simplificando significativamente la contabilidad.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  // Canada content (original)
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
