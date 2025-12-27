import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  Camera, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Info,
  Shield,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface GuideStep {
  icon: React.ReactNode;
  title: { es: string; en: string };
  description: { es: string; en: string };
  tooltip: { es: string; en: string };
  badge?: { es: string; en: string };
}

const GUIDE_STEPS: GuideStep[] = [
  {
    icon: <Upload className="h-5 w-5" />,
    title: { 
      es: 'Importar Estado de Cuenta', 
      en: 'Import Bank Statement' 
    },
    description: { 
      es: 'Sube tu estado bancario en formato CSV, foto o PDF', 
      en: 'Upload your bank statement as CSV, photo or PDF' 
    },
    tooltip: { 
      es: 'Aceptamos archivos CSV de cualquier banco canadiense, fotos de estados impresos (usamos IA para extraer datos), y PDFs de estados electrónicos. Los datos nunca se comparten con terceros.', 
      en: 'We accept CSV files from any Canadian bank, photos of printed statements (we use AI to extract data), and PDFs of electronic statements. Data is never shared with third parties.' 
    },
    badge: { es: 'Paso 1', en: 'Step 1' }
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: { 
      es: 'Procesamiento Automático', 
      en: 'Automatic Processing' 
    },
    description: { 
      es: 'La IA analiza y categoriza cada transacción', 
      en: 'AI analyzes and categorizes each transaction' 
    },
    tooltip: { 
      es: 'Nuestra IA detecta automáticamente: comercios conocidos, pagos recurrentes (suscripciones), categorías de gasto, y posibles anomalías. Todo en segundos.', 
      en: 'Our AI automatically detects: known merchants, recurring payments (subscriptions), spending categories, and possible anomalies. All in seconds.' 
    },
    badge: { es: 'Automático', en: 'Automatic' }
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    title: { 
      es: 'Conciliación Inteligente', 
      en: 'Smart Reconciliation' 
    },
    description: { 
      es: 'Empareja transacciones bancarias con tus gastos registrados', 
      en: 'Match bank transactions with your recorded expenses' 
    },
    tooltip: { 
      es: 'El sistema sugiere automáticamente coincidencias entre tus transacciones bancarias y los gastos que has registrado manualmente o con recibos. Puedes aprobar, rechazar o ajustar cada coincidencia.', 
      en: 'The system automatically suggests matches between your bank transactions and expenses you\'ve recorded manually or with receipts. You can approve, reject, or adjust each match.' 
    },
    badge: { es: 'Paso 2', en: 'Step 2' }
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: { 
      es: 'Alertas y Anomalías', 
      en: 'Alerts & Anomalies' 
    },
    description: { 
      es: 'Detectamos cobros sospechosos y gastos inusuales', 
      en: 'We detect suspicious charges and unusual expenses' 
    },
    tooltip: { 
      es: 'Recibirás alertas sobre: cobros duplicados, aumentos inesperados en suscripciones, transacciones en horarios inusuales, y patrones de gasto atípicos para tu historial.', 
      en: 'You\'ll receive alerts about: duplicate charges, unexpected subscription increases, transactions at unusual times, and atypical spending patterns for your history.' 
    },
    badge: { es: 'Alertas', en: 'Alerts' }
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: { 
      es: 'Búsqueda Inteligente', 
      en: 'Smart Search' 
    },
    description: { 
      es: 'Pregunta sobre tus transacciones en lenguaje natural', 
      en: 'Ask about your transactions in natural language' 
    },
    tooltip: { 
      es: 'Puedes preguntar cosas como: "¿Cuánto gasté en restaurantes este mes?", "¿Cuáles son mis suscripciones más caras?", "¿Hay cobros duplicados?". La IA responde con datos reales de tus transacciones.', 
      en: 'You can ask things like: "How much did I spend on restaurants this month?", "What are my most expensive subscriptions?", "Are there duplicate charges?". The AI responds with real data from your transactions.' 
    },
    badge: { es: 'IA', en: 'AI' }
  }
];

const FAQ_ITEMS = [
  {
    question: { 
      es: '¿Qué formatos de archivo aceptan?', 
      en: 'What file formats do you accept?' 
    },
    answer: { 
      es: 'Aceptamos CSV (de cualquier banco), fotos JPG/PNG de estados impresos, y archivos PDF de estados electrónicos. Para CSV, el archivo debe tener columnas de fecha, descripción y monto.', 
      en: 'We accept CSV (from any bank), JPG/PNG photos of printed statements, and PDF files of electronic statements. For CSV, the file should have date, description, and amount columns.' 
    }
  },
  {
    question: { 
      es: '¿Es seguro subir mis estados de cuenta?', 
      en: 'Is it safe to upload my bank statements?' 
    },
    answer: { 
      es: 'Sí. Los datos se procesan con encriptación end-to-end, nunca almacenamos credenciales bancarias, y no compartimos información con terceros. Los archivos originales se eliminan después del procesamiento.', 
      en: 'Yes. Data is processed with end-to-end encryption, we never store bank credentials, and we don\'t share information with third parties. Original files are deleted after processing.' 
    }
  },
  {
    question: { 
      es: '¿Cómo funciona la detección de suscripciones?', 
      en: 'How does subscription detection work?' 
    },
    answer: { 
      es: 'Analizamos patrones de cobros recurrentes: mismo monto, mismo comercio, intervalos regulares. Detectamos suscripciones mensuales, semanales y anuales automáticamente.', 
      en: 'We analyze patterns of recurring charges: same amount, same merchant, regular intervals. We detect monthly, weekly, and annual subscriptions automatically.' 
    }
  }
];

interface BankingIntegrationGuideProps {
  onImportClick?: () => void;
}

export function BankingIntegrationGuide({ onImportClick }: BankingIntegrationGuideProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <TooltipProvider>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {language === 'es' ? 'Guía de Integración Bancaria' : 'Banking Integration Guide'}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            {language === 'es' 
                              ? 'Esta guía te explica paso a paso cómo importar y analizar tus estados de cuenta bancarios de forma segura.'
                              : 'This guide explains step by step how to import and analyze your bank statements securely.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? 'Aprende a importar y analizar tus transacciones' 
                        : 'Learn to import and analyze your transactions'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="group-hover:bg-muted">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Import Methods */}
              <div className="grid gap-3 md:grid-cols-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-help">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">CSV</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Archivo exportado' : 'Exported file'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">
                      {language === 'es' ? 'Importar CSV' : 'Import CSV'}
                    </p>
                    <p className="text-sm">
                      {language === 'es' 
                        ? 'Descarga el CSV desde tu banca en línea. Debe incluir fecha, descripción y monto. Compatble con todos los bancos canadienses.'
                        : 'Download the CSV from your online banking. It should include date, description, and amount. Compatible with all Canadian banks.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-help">
                      <div className="flex items-center gap-3">
                        <Camera className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {language === 'es' ? 'Foto' : 'Photo'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Con IA' : 'With AI'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">
                      {language === 'es' ? 'Importar con Foto' : 'Import with Photo'}
                    </p>
                    <p className="text-sm">
                      {language === 'es' 
                        ? 'Toma una foto clara de tu estado de cuenta impreso. Nuestra IA extrae automáticamente las transacciones. Ideal para estados que llegan por correo.'
                        : 'Take a clear photo of your printed statement. Our AI automatically extracts the transactions. Ideal for statements that arrive by mail.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-help">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="font-medium">PDF</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Estado digital' : 'Digital statement'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium mb-1">
                      {language === 'es' ? 'Importar PDF' : 'Import PDF'}
                    </p>
                    <p className="text-sm">
                      {language === 'es' 
                        ? 'Sube el PDF de tu estado de cuenta electrónico. La IA analiza el documento y extrae las transacciones automáticamente.'
                        : 'Upload the PDF of your electronic statement. The AI analyzes the document and extracts transactions automatically.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Step by Step Guide */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {language === 'es' ? 'Proceso Paso a Paso' : 'Step by Step Process'}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {language === 'es' 
                          ? 'Hover sobre cada paso para más detalles'
                          : 'Hover over each step for more details'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </h4>

                <div className="grid gap-2">
                  {GUIDE_STEPS.map((step, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-help group">
                          <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {step.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {language === 'es' ? step.title.es : step.title.en}
                              </p>
                              {step.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {language === 'es' ? step.badge.es : step.badge.en}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {language === 'es' ? step.description.es : step.description.en}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <p className="text-sm">
                          {language === 'es' ? step.tooltip.es : step.tooltip.en}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Security Note */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 cursor-help">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {language === 'es' ? 'Datos Seguros y Privados' : 'Secure & Private Data'}
                      </p>
                      <p className="text-xs text-green-600/80 dark:text-green-500/80">
                        {language === 'es' 
                          ? 'Encriptación end-to-end, sin almacenamiento de credenciales'
                          : 'End-to-end encryption, no credential storage'}
                      </p>
                    </div>
                    <HelpCircle className="h-4 w-4 text-green-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm">
                    {language === 'es' 
                      ? 'Tus datos están protegidos con encriptación de nivel bancario. Nunca almacenamos credenciales de acceso a tu banco. Los archivos originales se eliminan después de procesar. Cumplimos con PIPEDA y estándares de seguridad canadienses.'
                      : 'Your data is protected with bank-level encryption. We never store bank access credentials. Original files are deleted after processing. We comply with PIPEDA and Canadian security standards.'}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* FAQ Section */}
              <div className="space-y-2">
                <h4 className="font-medium">
                  {language === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
                </h4>
                {FAQ_ITEMS.map((item, index) => (
                  <Collapsible 
                    key={index} 
                    open={expandedFaq === index} 
                    onOpenChange={(open) => setExpandedFaq(open ? index : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                        <p className="text-sm font-medium">
                          {language === 'es' ? item.question.es : item.question.en}
                        </p>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0">
                        <p className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
                          {language === 'es' ? item.answer.es : item.answer.en}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {/* CTA */}
              {onImportClick && (
                <Button onClick={onImportClick} className="w-full bg-gradient-primary">
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Comenzar a Importar' : 'Start Importing'}
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}
