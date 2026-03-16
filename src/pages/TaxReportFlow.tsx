import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkflowProgress } from '@/hooks/data/useWorkflowProgress';
import { useCountryContext } from '@/hooks/utils/useCountryContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/PageHeader';
import { CountryFlag } from '@/components/ui/country-flag';
import { cn } from '@/lib/utils';
import {
  Camera, Tag, Eye, TrendingUp, Download, ArrowRight, CheckCircle2,
  Loader2, Mic, Keyboard, FileText, Sparkles, ChevronRight, ChevronDown,
  AlertCircle, Clock, ShieldCheck, Inbox, ListChecks, CalendarClock,
  Zap, Timer, Play,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface FlowAction {
  label: { es: string; en: string };
  path: string;
  icon: React.ElementType;
  primary?: boolean;
}

interface FlowStep {
  id: string;
  icon: React.ElementType;
  number: number;
  title: { es: string; en: string };
  description: { es: string; en: string };
  tip: { es: string; en: string };
  timeEstimate: { es: string; en: string };
  actions: FlowAction[];
  color: string;
  iconBg: string;
  bgColor: string;
  borderColor: string;
}

// ─── Step configuration ───────────────────────────────────────────────────
const getFlowSteps = (taxAuthority: string): FlowStep[] => [
  {
    id: 'capture',
    icon: Camera,
    number: 1,
    title: { es: 'Capturar Gastos', en: 'Capture Expenses' },
    description: {
      es: 'Registra todos tus gastos del período fiscal. Usa el método que prefieras — la IA se encarga de extraer los datos.',
      en: 'Record all your expenses for the tax period. Use whichever method you prefer — AI handles data extraction.',
    },
    tip: {
      es: '💡 La foto de recibo es el método más rápido. La IA extrae vendedor, monto, fecha y categoría automáticamente.',
      en: '💡 Receipt photo is the fastest method. AI extracts vendor, amount, date and category automatically.',
    },
    timeEstimate: { es: '~30 seg por recibo', en: '~30 sec per receipt' },
    actions: [
      { label: { es: '📸 Foto de Recibo', en: '📸 Receipt Photo' }, path: '/capture', icon: Camera, primary: true },
      { label: { es: '🎤 Dictado por Voz', en: '🎤 Voice Dictation' }, path: '/capture', icon: Mic },
      { label: { es: '⌨️ Entrada Manual', en: '⌨️ Manual Entry' }, path: '/expenses', icon: Keyboard },
      { label: { es: '📥 Bandeja del Caos', en: '📥 Chaos Inbox' }, path: '/chaos', icon: Inbox },
    ],
    color: 'text-blue-600 dark:text-blue-400',
    iconBg: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50/80 dark:bg-blue-950/20',
    borderColor: 'border-blue-200/60 dark:border-blue-800/40',
  },
  {
    id: 'categorize',
    number: 2,
    icon: Tag,
    title: { es: `Categorizar para ${taxAuthority}`, en: `Categorize for ${taxAuthority}` },
    description: {
      es: 'Clasifica cada gasto: deducible de impuestos, reembolsable por cliente, o personal. La IA sugiere la clasificación.',
      en: 'Classify each expense: tax deductible, client reimbursable, or personal. AI suggests the classification.',
    },
    tip: {
      es: '💡 Usa "Clasificación Rápida" para procesar múltiples gastos con un solo clic usando IA.',
      en: '💡 Use "Quick Classify" to process multiple expenses with a single click using AI.',
    },
    timeEstimate: { es: '~2 min con IA', en: '~2 min with AI' },
    actions: [
      { label: { es: '🏷️ Ver y Clasificar', en: '🏷️ View & Classify' }, path: '/expenses', icon: Tag, primary: true },
      { label: { es: '⚡ Clasificación Rápida IA', en: '⚡ Quick AI Classify' }, path: '/expenses', icon: Sparkles },
    ],
    color: 'text-purple-600 dark:text-purple-400',
    iconBg: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50/80 dark:bg-purple-950/20',
    borderColor: 'border-purple-200/60 dark:border-purple-800/40',
  },
  {
    id: 'review',
    number: 3,
    icon: Eye,
    title: { es: 'Revisar Documentos', en: 'Review Documents' },
    description: {
      es: 'Verifica que cada gasto tenga su comprobante adjunto y que los datos extraídos sean correctos. Sin recibo = sin deducción.',
      en: 'Verify each expense has its receipt attached and extracted data is correct. No receipt = no deduction.',
    },
    tip: {
      es: `⚠️ ${taxAuthority} puede solicitar comprobantes hasta 6 años después. Asegúrate de tener todo respaldado.`,
      en: `⚠️ ${taxAuthority} can request receipts up to 6 years later. Make sure everything is backed up.`,
    },
    timeEstimate: { es: '~1 min por documento', en: '~1 min per document' },
    actions: [
      { label: { es: '📄 Centro de Revisión', en: '📄 Review Center' }, path: '/chaos', icon: Eye, primary: true },
      { label: { es: '📁 Mis Archivos', en: '📁 My Files' }, path: '/files', icon: FileText },
      { label: { es: '📋 Checklist Docs', en: '📋 Doc Checklist' }, path: '/tax-optimizer', icon: ListChecks },
    ],
    color: 'text-amber-600 dark:text-amber-400',
    iconBg: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50/80 dark:bg-amber-950/20',
    borderColor: 'border-amber-200/60 dark:border-amber-800/40',
  },
  {
    id: 'optimize',
    number: 4,
    icon: TrendingUp,
    title: { es: 'Optimizar Deducciones', en: 'Optimize Deductions' },
    description: {
      es: 'La IA analiza tus gastos para encontrar deducciones que podrías estar perdiendo y maximizar tu retorno fiscal.',
      en: 'AI analyzes your expenses to find deductions you might be missing and maximize your tax return.',
    },
    tip: {
      es: '💡 Revisa el Calendario Fiscal para no perder fechas límite de declaración o pagos provisionales.',
      en: '💡 Check the Tax Calendar to avoid missing filing deadlines or installment payments.',
    },
    timeEstimate: { es: '~5 min', en: '~5 min' },
    actions: [
      { label: { es: '🛡️ Optimizador Fiscal', en: '🛡️ Tax Optimizer' }, path: '/tax-optimizer', icon: TrendingUp, primary: true },
      { label: { es: '📅 Calendario Fiscal', en: '📅 Tax Calendar' }, path: '/tax-calendar', icon: Clock },
    ],
    color: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200/60 dark:border-emerald-800/40',
  },
  {
    id: 'export',
    number: 5,
    icon: Download,
    title: { es: 'Exportar Reporte al Contador', en: 'Export Accountant Report' },
    description: {
      es: 'Genera el libro Excel profesional de 4 hojas con todo lo que tu contador necesita para la declaración.',
      en: 'Generate the professional 4-sheet Excel workbook with everything your accountant needs for filing.',
    },
    tip: {
      es: '📊 El reporte incluye: Resumen Fiscal, Detalle de Gastos, Checklist de Documentos y Recibos Faltantes.',
      en: '📊 The report includes: Tax Summary, Expense Detail, Document Checklist, and Missing Receipts.',
    },
    timeEstimate: { es: '~1 min', en: '~1 min' },
    actions: [
      { label: { es: '📋 Reporte para Contador', en: '📋 Accountant Report' }, path: '/expenses?export=tax_report', icon: Download, primary: true },
      { label: { es: '📊 Reporte T2125', en: '📊 T2125 Report' }, path: '/expenses?export=t2125', icon: FileText },
    ],
    color: 'text-green-600 dark:text-green-400',
    iconBg: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50/80 dark:bg-green-950/20',
    borderColor: 'border-green-200/60 dark:border-green-800/40',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function getFilingDeadline(country: string, fiscalYear: number) {
  // CRA: April 30 for employed, June 15 for self-employed (use April 30 as safe default)
  // SII: April 30 (Operación Renta)
  const deadlineMonth = 3; // April (0-indexed)
  const deadlineDay = 30;
  return new Date(fiscalYear + 1, deadlineMonth, deadlineDay);
}

function getDaysUntil(date: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Component ────────────────────────────────────────────────────────────
export default function TaxReportFlow() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: progress, isLoading } = useWorkflowProgress('tax-preparation');
  const { currentCountry } = useCountryContext();
  const { formatCurrency } = useFormatCurrency();
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set());

  const taxAuthority = currentCountry === 'CL' ? 'SII' : 'CRA';
  const taxAuthorityFull = currentCountry === 'CL'
    ? 'Servicio de Impuestos Internos (SII)'
    : 'Canada Revenue Agency (CRA)';
  const countryName = currentCountry === 'CL'
    ? (language === 'es' ? 'Chile' : 'Chile')
    : (language === 'es' ? 'Canadá' : 'Canada');
  const currentYear = new Date().getFullYear();
  const fiscalYear = currentYear - 1;
  const FLOW_STEPS = getFlowSteps(taxAuthority);

  const getStepStatus = (stepId: string) => {
    if (!progress) return 'pending';
    return progress.stepDetails.find(s => s.stepId === stepId)?.status || 'pending';
  };

  const getStepCount = (stepId: string) => {
    if (!progress) return undefined;
    return progress.stepDetails.find(s => s.stepId === stepId)?.count;
  };

  const overallProgress = progress
    ? Math.round((progress.currentStep / (progress.totalSteps - 1)) * 100)
    : 0;

  const completedSteps = progress?.stepDetails.filter(s => s.status === 'completed').length || 0;

  // Smart continue: find current step and its primary action
  const currentStepData = useMemo(() => {
    if (!progress) return null;
    const currentDetail = progress.stepDetails.find(s => s.status === 'current');
    if (!currentDetail) return null;
    const step = FLOW_STEPS.find(s => s.id === currentDetail.stepId);
    if (!step) return null;
    const primaryAction = step.actions.find(a => a.primary) || step.actions[0];
    return { step, action: primaryAction, count: currentDetail.count };
  }, [progress, FLOW_STEPS]);

  // Filing deadline
  const deadline = getFilingDeadline(currentCountry || 'CA', fiscalYear);
  const daysUntilDeadline = getDaysUntil(deadline);
  const deadlineUrgent = daysUntilDeadline <= 30;
  const deadlinePassed = daysUntilDeadline < 0;

  // Bottleneck detection
  const bottleneck = useMemo(() => {
    if (!progress) return null;
    const maxPending = progress.stepDetails
      .filter(s => s.status !== 'completed' && (s.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0))[0];
    if (!maxPending || !maxPending.count) return null;
    const step = FLOW_STEPS.find(s => s.id === maxPending.stepId);
    return step ? { step, count: maxPending.count } : null;
  }, [progress, FLOW_STEPS]);

  const toggleCollapse = (stepId: string) => {
    setCollapsedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-5 pb-12">
        {/* Header */}
        <div className="space-y-2">
          <PageHeader
            title={language === 'es'
              ? `Reporte Fiscal — Año ${fiscalYear}`
              : `Tax Report — Year ${fiscalYear}`
            }
            description={language === 'es'
              ? `Declaración a presentar en ${currentYear} por el año fiscal ${fiscalYear}`
              : `Filing due in ${currentYear} for fiscal year ${fiscalYear}`
            }
          />
          <div className="flex items-center gap-2 ml-1">
            <CountryFlag code={currentCountry || 'CA'} size="sm" className="rounded-sm shadow-sm" />
            <span className="text-sm text-muted-foreground font-medium">
              {countryName} • {taxAuthorityFull}
            </span>
          </div>
        </div>

        {/* Smart Action Bar: Continue + Deadline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={cn(
            "overflow-hidden border-2",
            deadlineUrgent && !deadlinePassed ? "border-amber-400/50" : "border-primary/20"
          )}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Continue CTA */}
                <div className="flex-1 min-w-0">
                  {currentStepData ? (
                    <Button
                      size="lg"
                      onClick={() => navigate(currentStepData.action.path)}
                      className="gap-2 shadow-md w-full sm:w-auto"
                    >
                      <Play className="h-4 w-4" />
                      {language === 'es' ? 'Continuar: ' : 'Continue: '}
                      {currentStepData.step.title[language]}
                      {currentStepData.count ? ` (${currentStepData.count})` : ''}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : overallProgress === 100 ? (
                    <Button
                      size="lg"
                      onClick={() => navigate('/expenses?export=tax_report')}
                      className="gap-2 shadow-md w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      {language === 'es' ? '¡Listo! Generar Reporte' : 'Ready! Generate Report'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => navigate('/capture')}
                      className="gap-2 shadow-md w-full sm:w-auto"
                    >
                      <Camera className="h-4 w-4" />
                      {language === 'es' ? 'Comenzar a Capturar' : 'Start Capturing'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Deadline countdown */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shrink-0",
                  deadlinePassed
                    ? "bg-destructive/10 text-destructive"
                    : deadlineUrgent
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                )}>
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  {deadlinePassed ? (
                    <span>{language === 'es' ? '⚠️ Plazo vencido' : '⚠️ Deadline passed'}</span>
                  ) : (
                    <span>
                      {daysUntilDeadline} {language === 'es' ? 'días para declarar' : 'days to file'}
                      <span className="hidden sm:inline text-xs opacity-70 ml-1">
                        ({deadline.toLocaleDateString(language === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric' })})
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottleneck alert */}
              {bottleneck && bottleneck.count > 3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 rounded-md px-3 py-2"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  {language === 'es'
                    ? `Cuello de botella: ${bottleneck.count} ítems pendientes en "${bottleneck.step.title.es}". Enfócate aquí para avanzar más rápido.`
                    : `Bottleneck: ${bottleneck.count} items pending in "${bottleneck.step.title.en}". Focus here to move faster.`
                  }
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Overview with per-step mini bars */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border border-border/60 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm">
                      {language === 'es' ? 'Progreso General' : 'Overall Progress'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CountryFlag code={currentCountry || 'CA'} size="xs" className="rounded-sm" />
                    <span>{completedSteps}/5 {language === 'es' ? 'pasos completados' : 'steps completed'}</span>
                  </div>
                </div>
                <span className={cn(
                  "text-3xl font-black",
                  overallProgress === 100 ? "text-success" : "text-primary"
                )}>
                  {overallProgress}%
                </span>
              </div>

              <Progress value={overallProgress} className="h-2.5 mb-4" />

              {/* Per-step mini indicators */}
              <div className="grid grid-cols-5 gap-2">
                {FLOW_STEPS.map((step) => {
                  const status = getStepStatus(step.id);
                  const isComplete = status === 'completed';
                  const isCurrent = status === 'current';
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="text-center space-y-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all",
                        isComplete && "bg-success/15 text-success",
                        isCurrent && "bg-primary/15 text-primary ring-2 ring-primary/30",
                        !isComplete && !isCurrent && "bg-muted/50 text-muted-foreground/50",
                      )}>
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <p className={cn(
                        "text-[10px] leading-tight",
                        isComplete && "text-success font-medium",
                        isCurrent && "text-primary font-medium",
                        !isComplete && !isCurrent && "text-muted-foreground/60",
                      )}>
                        {step.title[language].split(' ')[0]}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Stats Row */}
              {progress && progress.stats.length > 0 && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mt-4 pt-3 border-t border-border/40">
                  {progress.stats.map((stat, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      <span className="font-semibold text-foreground">
                        {stat.type === 'currency' ? formatCurrency(stat.value) : stat.value}
                      </span>
                      {stat.label[language]}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Flow Steps */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 via-amber-300 via-emerald-300 to-green-300 dark:from-blue-700 dark:via-purple-700 dark:via-amber-700 dark:via-emerald-700 dark:to-green-700 hidden sm:block" />

          <div className="space-y-3">
            {FLOW_STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const isComplete = status === 'completed';
              const isCurrent = status === 'current';
              const isPending = status === 'pending';
              const count = getStepCount(step.id);
              const Icon = step.icon;
              const isCollapsed = isComplete && collapsedSteps.has(step.id);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                >
                  <Card
                    className={cn(
                      'transition-all duration-300 overflow-hidden sm:ml-12',
                      step.borderColor,
                      isCurrent && 'ring-2 ring-primary/40 shadow-lg shadow-primary/5',
                      isComplete && 'border-success/30',
                      isPending && 'opacity-50 hover:opacity-80'
                    )}
                  >
                    {/* Timeline dot (desktop) */}
                    <div className={cn(
                      'absolute -left-[1.15rem] top-4 w-10 h-10 rounded-xl items-center justify-center hidden sm:flex z-10',
                      'bg-gradient-to-br shadow-md',
                      isComplete ? 'from-success to-emerald-500' : step.iconBg,
                      isPending && 'opacity-50',
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : isLoading ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5 text-white" />
                      )}
                    </div>

                    <CardContent className="p-0">
                      {/* Step Header — clickable for completed steps */}
                      <div
                        className={cn(
                          'flex items-start gap-3 p-4',
                          step.bgColor,
                          isComplete && 'cursor-pointer hover:opacity-80'
                        )}
                        onClick={isComplete ? () => toggleCollapse(step.id) : undefined}
                      >
                        {/* Mobile icon */}
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 sm:hidden',
                          'bg-gradient-to-br shadow-md',
                          isComplete ? 'from-success to-emerald-500' : step.iconBg,
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          ) : (
                            <Icon className="h-4 w-4 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-[11px] font-bold shrink-0 px-1.5 py-0.5 rounded", step.bgColor, step.color)}>
                              {step.number}
                            </span>
                            <h3 className="font-bold text-sm">
                              {step.title[language]}
                            </h3>
                            {isComplete && (
                              <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-success/20 gap-0.5 px-1.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {language === 'es' ? 'Listo' : 'Done'}
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="text-[10px] gap-0.5 px-1.5">
                                <ArrowRight className="h-3 w-3" />
                                {language === 'es' ? 'Actual' : 'Current'}
                              </Badge>
                            )}
                            {count !== undefined && count > 0 && !isComplete && (
                              <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5">
                                <AlertCircle className="h-3 w-3" />
                                {count} {language === 'es' ? 'pendientes' : 'pending'}
                              </Badge>
                            )}
                            {/* Time estimate */}
                            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 ml-auto">
                              <Timer className="h-3 w-3" />
                              {step.timeEstimate[language]}
                            </span>
                            {/* Collapse indicator for completed */}
                            {isComplete && (
                              <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform ml-1",
                                isCollapsed && "-rotate-90"
                              )} />
                            )}
                          </div>

                          {/* Description — hidden when collapsed */}
                          <AnimatePresence initial={false}>
                            {!isCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                  {step.description[language]}
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1.5 italic">
                                  {step.tip[language]}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Action Buttons — hidden when collapsed */}
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 py-3 border-t border-border/40 bg-background/50">
                              <div className="flex flex-wrap gap-2">
                                {step.actions.map((action, ai) => {
                                  const ActionIcon = action.icon;
                                  const isPrimaryAction = action.primary && isCurrent;
                                  return (
                                    <Button
                                      key={ai}
                                      variant={isPrimaryAction ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => navigate(action.path)}
                                      className={cn(
                                        "gap-1.5 text-xs",
                                        isPrimaryAction && "shadow-md"
                                      )}
                                    >
                                      <ActionIcon className="h-3.5 w-3.5" />
                                      {action.label[language]}
                                      <ChevronRight className="h-3 w-3 opacity-50" />
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-2 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-primary/3 pointer-events-none" />
            <CardContent className="p-8 text-center space-y-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl">
                  {language === 'es'
                    ? '¿Listo? Genera tu reporte final'
                    : 'Ready? Generate your final report'
                  }
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  {language === 'es'
                    ? `Excel profesional de 4 hojas: Resumen Fiscal, Detalle de Gastos, Checklist ${taxAuthority} y Recibos Faltantes.`
                    : `Professional 4-sheet Excel: Tax Summary, Expense Detail, ${taxAuthority} Checklist, and Missing Receipts.`
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate('/expenses?export=tax_report')}
                  className="gap-2 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  {language === 'es' ? 'Generar Reporte para Contador' : 'Generate Accountant Report'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {taxAuthority === 'CRA' && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/expenses?export=t2125')}
                    className="gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    {language === 'es' ? 'Exportar T2125' : 'Export T2125'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
