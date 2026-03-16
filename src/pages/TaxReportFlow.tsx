import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkflowProgress } from '@/hooks/data/useWorkflowProgress';
import { useCountryContext } from '@/hooks/utils/useCountryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Circle,
  Loader2,
  Mic,
  Keyboard,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const FLOW_STEPS = [
  {
    id: 'capture',
    icon: Camera,
    number: 1,
    title: { es: 'Capturar Gastos', en: 'Capture Expenses' },
    description: {
      es: 'Registra todos tus gastos del período fiscal usando cualquier método disponible.',
      en: 'Record all your expenses for the tax period using any available method.',
    },
    actions: [
      { label: { es: '📸 Foto de Recibo', en: '📸 Receipt Photo' }, path: '/capture', icon: Camera },
      { label: { es: '🎤 Dictado por Voz', en: '🎤 Voice Dictation' }, path: '/capture', icon: Mic },
      { label: { es: '⌨️ Entrada Manual', en: '⌨️ Manual Entry' }, path: '/expenses', icon: Keyboard },
      { label: { es: '📥 Bandeja del Caos', en: '📥 Chaos Inbox' }, path: '/chaos', icon: FileText },
    ],
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'categorize',
    number: 2,
    icon: Tag,
    title: { es: 'Categorizar para CRA/SII', en: 'Categorize for CRA/SII' },
    description: {
      es: 'Clasifica cada gasto como deducible, reembolsable o personal. La IA te ayuda automáticamente.',
      en: 'Classify each expense as deductible, reimbursable, or personal. AI helps automatically.',
    },
    actions: [
      { label: { es: '🏷️ Clasificar Gastos', en: '🏷️ Classify Expenses' }, path: '/expenses', icon: Tag },
      { label: { es: '🤖 Clasificación Rápida', en: '🤖 Quick Classify' }, path: '/expenses', icon: Sparkles },
    ],
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    id: 'review',
    number: 3,
    icon: Eye,
    title: { es: 'Revisar Documentos', en: 'Review Documents' },
    description: {
      es: 'Asegúrate de que cada gasto tiene su comprobante adjunto y los datos son correctos.',
      en: 'Make sure each expense has its receipt attached and data is correct.',
    },
    actions: [
      { label: { es: '📄 Centro de Revisión', en: '📄 Review Center' }, path: '/chaos', icon: Eye },
      { label: { es: '📁 Mis Archivos', en: '📁 My Files' }, path: '/files', icon: FileText },
    ],
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'optimize',
    number: 4,
    icon: TrendingUp,
    title: { es: 'Optimizar Deducciones', en: 'Optimize Deductions' },
    description: {
      es: 'Usa la IA para encontrar deducciones que podrías estar perdiendo y maximizar tu retorno.',
      en: 'Use AI to find deductions you might be missing and maximize your return.',
    },
    actions: [
      { label: { es: '🛡️ Optimizador Fiscal', en: '🛡️ Tax Optimizer' }, path: '/tax-optimizer', icon: TrendingUp },
      { label: { es: '📅 Calendario Fiscal', en: '📅 Tax Calendar' }, path: '/tax-calendar', icon: FileText },
    ],
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'export',
    number: 5,
    icon: Download,
    title: { es: 'Exportar Reporte al Contador', en: 'Export Accountant Report' },
    description: {
      es: 'Genera el Excel completo con todo lo que tu contador necesita: resumen fiscal, detalle, checklist de documentos y recibos faltantes.',
      en: 'Generate the complete Excel with everything your accountant needs: tax summary, detail, document checklist, and missing receipts.',
    },
    actions: [
      { label: { es: '📋 Generar Reporte', en: '📋 Generate Report' }, path: '/expenses?export=tax_report', icon: Download },
      { label: { es: '📊 Reporte T2125', en: '📊 T2125 Report' }, path: '/expenses?export=t2125', icon: FileText },
    ],
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
];

export default function TaxReportFlow() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: progress, isLoading } = useWorkflowProgress('tax-preparation');
  const { currentCountry } = useCountryContext();

  const taxAuthority = currentCountry === 'CL' ? 'SII' : 'CRA';
  const currentYear = new Date().getFullYear() - 1;

  const getStepStatus = (stepId: string) => {
    if (!progress) return 'pending';
    const step = progress.stepDetails.find(s => s.stepId === stepId);
    return step?.status || 'pending';
  };

  const overallProgress = progress
    ? Math.round((progress.currentStep / (progress.totalSteps - 1)) * 100)
    : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <PageHeader
          title={language === 'es' ? `Reporte Fiscal ${currentYear}` : `Tax Report ${currentYear}`}
          description={language === 'es'
            ? `Guía paso a paso para preparar tu reporte completo para ${taxAuthority}`
            : `Step-by-step guide to prepare your complete report for ${taxAuthority}`
          }
        />

        {/* Overall Progress Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">
                  {language === 'es' ? 'Tu Progreso' : 'Your Progress'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'es'
                    ? `Año fiscal ${currentYear} • ${taxAuthority}`
                    : `Fiscal year ${currentYear} • ${taxAuthority}`
                  }
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary">{overallProgress}%</span>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3" />
            {progress && (
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                {progress.stats.map((stat, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">{stat.value}</span>
                    {stat.label[language]}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flow Steps */}
        <div className="space-y-4">
          {FLOW_STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const isComplete = status === 'completed';
            const isCurrent = status === 'current';
            const Icon = step.icon;

            return (
              <Card
                key={step.id}
                className={cn(
                  'transition-all duration-300 overflow-hidden',
                  step.borderColor,
                  isCurrent && 'ring-2 ring-primary/30 shadow-lg',
                  isComplete && 'opacity-80'
                )}
              >
                <CardContent className="p-0">
                  {/* Step Header */}
                  <div className={cn('flex items-center gap-4 p-5', step.bgColor)}>
                    {/* Step Number Circle */}
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                      'bg-gradient-to-br shadow-lg',
                      step.color,
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : isLoading ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <span className="text-lg font-black text-white">{step.number}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">
                          {step.title[language]}
                        </h3>
                        {isComplete && (
                          <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
                            {language === 'es' ? '✓ Listo' : '✓ Done'}
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge className="text-xs animate-pulse">
                            {language === 'es' ? '← Estás aquí' : '← You are here'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description[language]}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {step.actions.map((action, ai) => (
                        <Button
                          key={ai}
                          variant={isCurrent && ai === 0 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => navigate(action.path)}
                          className="gap-2 text-xs"
                        >
                          {action.label[language]}
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-bold text-lg">
              {language === 'es'
                ? '¿Todo listo? Genera tu reporte final'
                : 'All set? Generate your final report'
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {language === 'es'
                ? `Un Excel profesional con 4 hojas: resumen fiscal, detalle de gastos, checklist de documentos ${taxAuthority} y recibos faltantes.`
                : `A professional Excel with 4 sheets: tax summary, expense detail, ${taxAuthority} document checklist, and missing receipts.`
              }
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/expenses?export=tax_report')}
              className="gap-2 mt-2"
            >
              <Download className="h-5 w-5" />
              {language === 'es' ? 'Generar Reporte para Contador' : 'Generate Accountant Report'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
