import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkflowProgress } from '@/hooks/data/useWorkflowProgress';
import { useCountryContext } from '@/hooks/utils/useCountryContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import {
  Camera,
  Tag,
  Eye,
  TrendingUp,
  Download,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  Keyboard,
  FileText,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Clock,
  ShieldCheck,
  BookOpen,
  Inbox,
  ListChecks,
} from 'lucide-react';

// ─── Step configuration ───────────────────────────────────────────────────
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
  actions: FlowAction[];
  color: string;
  iconBg: string;
  bgColor: string;
  borderColor: string;
}

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
    title: {
      es: `Categorizar para ${taxAuthority}`,
      en: `Categorize for ${taxAuthority}`,
    },
    description: {
      es: 'Clasifica cada gasto: deducible de impuestos, reembolsable por cliente, o personal. La IA sugiere la clasificación.',
      en: 'Classify each expense: tax deductible, client reimbursable, or personal. AI suggests the classification.',
    },
    tip: {
      es: '💡 Usa "Clasificación Rápida" para procesar múltiples gastos con un solo clic usando IA.',
      en: '💡 Use "Quick Classify" to process multiple expenses with a single click using AI.',
    },
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

// ─── Component ────────────────────────────────────────────────────────────
export default function TaxReportFlow() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: progress, isLoading } = useWorkflowProgress('tax-preparation');
  const { currentCountry } = useCountryContext();
  const { formatCurrency } = useFormatCurrency();

  const taxAuthority = currentCountry === 'CL' ? 'SII' : 'CRA';
  const currentYear = new Date().getFullYear();
  const fiscalYear = currentYear - 1;
  const FLOW_STEPS = getFlowSteps(taxAuthority);

  const getStepStatus = (stepId: string) => {
    if (!progress) return 'pending';
    const step = progress.stepDetails.find(s => s.stepId === stepId);
    return step?.status || 'pending';
  };

  const getStepCount = (stepId: string) => {
    if (!progress) return undefined;
    return progress.stepDetails.find(s => s.stepId === stepId)?.count;
  };

  const overallProgress = progress
    ? Math.round((progress.currentStep / (progress.totalSteps - 1)) * 100)
    : 0;

  const completedSteps = progress?.stepDetails.filter(s => s.status === 'completed').length || 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <PageHeader
          title={language === 'es' ? `Reporte Fiscal ${fiscalYear}` : `Tax Report ${fiscalYear}`}
          description={language === 'es'
            ? `Guía completa paso a paso para preparar tu reporte para ${taxAuthority}`
            : `Complete step-by-step guide to prepare your report for ${taxAuthority}`
          }
        />

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">
                      {language === 'es' ? 'Tu Progreso' : 'Your Progress'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es'
                      ? `Año fiscal ${fiscalYear} • ${taxAuthority} • ${completedSteps}/5 pasos`
                      : `Fiscal year ${fiscalYear} • ${taxAuthority} • ${completedSteps}/5 steps`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-4xl font-black",
                    overallProgress === 100 ? "text-success" : "text-primary"
                  )}>
                    {overallProgress}%
                  </span>
                  {overallProgress === 100 && (
                    <p className="text-xs text-success font-medium mt-0.5">
                      {language === 'es' ? '¡Listo para exportar!' : 'Ready to export!'}
                    </p>
                  )}
                </div>
              </div>
              <Progress value={overallProgress} className="h-3 mb-3" />

              {/* Stats Row */}
              {progress && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
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

        {/* Intro Tip */}
        <Alert className="border-primary/20 bg-primary/5">
          <BookOpen className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            {language === 'es'
              ? 'Sigue los pasos en orden para asegurar un reporte completo. Puedes volver a cualquier paso en cualquier momento — tu progreso se guarda automáticamente.'
              : 'Follow the steps in order to ensure a complete report. You can return to any step at any time — your progress is saved automatically.'
            }
          </AlertDescription>
        </Alert>

        {/* Flow Steps with Timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 via-amber-300 via-emerald-300 to-green-300 dark:from-blue-700 dark:via-purple-700 dark:via-amber-700 dark:via-emerald-700 dark:to-green-700 hidden sm:block" />

          <div className="space-y-4">
            {FLOW_STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const isComplete = status === 'completed';
              const isCurrent = status === 'current';
              const isPending = status === 'pending';
              const count = getStepCount(step.id);
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  <Card
                    className={cn(
                      'transition-all duration-300 overflow-hidden sm:ml-12',
                      step.borderColor,
                      isCurrent && 'ring-2 ring-primary/40 shadow-xl shadow-primary/5',
                      isComplete && 'border-success/30',
                      isPending && 'opacity-60 hover:opacity-90'
                    )}
                  >
                    {/* Timeline dot (desktop) */}
                    <div className={cn(
                      'absolute -left-[1.15rem] top-6 w-10 h-10 rounded-xl items-center justify-center hidden sm:flex z-10',
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
                      {/* Step Header */}
                      <div className={cn('flex items-start gap-4 p-5', step.bgColor)}>
                        {/* Mobile step number */}
                        <div className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 sm:hidden',
                          'bg-gradient-to-br shadow-md',
                          isComplete ? 'from-success to-emerald-500' : step.iconBg,
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <Icon className="h-5 w-5 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs font-bold shrink-0 px-1.5 py-0.5 rounded-md", step.bgColor, step.color)}>
                              {step.number}
                            </span>
                            <h3 className="font-bold text-base">
                              {step.title[language]}
                            </h3>
                            {isComplete && (
                              <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-success/20 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {language === 'es' ? 'Completado' : 'Complete'}
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="text-[10px] gap-1 animate-pulse">
                                <ArrowRight className="h-3 w-3" />
                                {language === 'es' ? 'Paso actual' : 'Current step'}
                              </Badge>
                            )}
                            {count !== undefined && count > 0 && !isComplete && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {count} {language === 'es' ? 'pendientes' : 'pending'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            {step.description[language]}
                          </p>
                          {/* Contextual tip */}
                          <p className="text-xs text-muted-foreground/80 mt-2 italic">
                            {step.tip[language]}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-5 py-3.5 border-t border-border/40 bg-background/50">
                        <div className="flex flex-wrap gap-2">
                          {step.actions.map((action, ai) => {
                            const ActionIcon = action.icon;
                            const isPrimary = action.primary && isCurrent;
                            return (
                              <Button
                                key={ai}
                                variant={isPrimary ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => navigate(action.path)}
                                className={cn(
                                  "gap-1.5 text-xs transition-all",
                                  isPrimary && "shadow-md"
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
          transition={{ duration: 0.4, delay: 0.5 }}
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
                    ? `Un libro Excel profesional de 4 hojas diseñado para contadores: Resumen Fiscal con tasas de deducción, Detalle de Gastos, Checklist de Documentos ${taxAuthority} y Lista de Recibos Faltantes.`
                    : `A professional 4-sheet Excel workbook designed for accountants: Tax Summary with deduction rates, Expense Detail, ${taxAuthority} Document Checklist, and Missing Receipt List.`
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
