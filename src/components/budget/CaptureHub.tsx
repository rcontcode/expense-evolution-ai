import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Camera, MessageSquareText, Landmark, ChevronDown, ChevronRight, Inbox, Sparkles, ArrowRight, HelpCircle, FileText, Zap, ScanLine, Repeat } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function CaptureHub() {
  const { language } = useLanguage();
  const l = language === 'es';
  const navigate = useNavigate();

  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureTab, setCaptureTab] = useState<'photo' | 'text'>('photo');
  const [bankOpen, setBankOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Count pending review expenses
  const { data: pendingExpenses } = useExpenses({ statuses: ['revision' as any] });
  const pendingCount = pendingExpenses?.length || 0;

  const openPhoto = () => { setCaptureTab('photo'); setCaptureOpen(true); };
  const openText = () => { setCaptureTab('text'); setCaptureOpen(true); };
  const openBank = () => setBankOpen(true);

  const captureButtons = [
    {
      icon: Camera,
      title: l ? 'Foto' : 'Photo',
      description: l ? 'Boletas, cuentas, recibos, e-transfers' : 'Receipts, bills, invoices, e-transfers',
      destination: l ? '→ Va a Bandeja del Caos para revisión' : '→ Goes to Chaos Inbox for review',
      onClick: openPhoto,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageSquareText,
      title: l ? 'Texto' : 'Text',
      description: l ? '"pagué $50 de luz", "recibí $2000 de salario"' : '"paid $50 for electricity", "received $2000 salary"',
      destination: l ? '→ Crea gasto/ingreso directo con IA' : '→ Creates expense/income directly with AI',
      onClick: openText,
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Landmark,
      title: l ? 'Banco' : 'Bank',
      description: l ? 'CSV, PDF o foto de extracto bancario' : 'CSV, PDF or bank statement photo',
      destination: l ? '→ Importa al Análisis Bancario' : '→ Imports to Banking Analysis',
      onClick: openBank,
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  const steps = l
    ? [
        { icon: FileText, text: 'Sube cualquier documento financiero' },
        { icon: Sparkles, text: 'La IA extrae datos y clasifica' },
        { icon: Repeat, text: 'Detecta suscripciones y pagos recurrentes' },
        { icon: Zap, text: 'Todo aparece organizado en tu presupuesto' },
      ]
    : [
        { icon: FileText, text: 'Upload any financial document' },
        { icon: Sparkles, text: 'AI extracts data and classifies' },
        { icon: Repeat, text: 'Detects subscriptions & recurring payments' },
        { icon: Zap, text: 'Everything appears organized in your budget' },
      ];

  const examples = l
    ? ['Extractos bancarios', 'Boletas de luz/agua/gas', 'Cuentas de celular', 'E-transfers', 'Recibos de compra', 'Facturas de servicios']
    : ['Bank statements', 'Utility bills (electric/water/gas)', 'Phone bills', 'E-transfers', 'Purchase receipts', 'Service invoices'];

  return (
    <>
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />

        <CardContent className="relative p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {l ? 'Centro de Captura' : 'Capture Hub'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {l ? 'Registra todo aquí' : 'Register everything here'}
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate('/chaos-inbox')}
              >
                <ScanLine className="h-4 w-4" />
                {l ? `${pendingCount} pendientes` : `${pendingCount} pending`}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* 3 Capture Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {captureButtons.map((btn, i) => (
              <motion.button
                key={btn.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={btn.onClick}
                className={cn(
                  "group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent",
                  "bg-card hover:border-primary/30 hover:shadow-lg hover:-translate-y-1",
                  "transition-all duration-200 active:scale-[0.97] active:shadow-inner cursor-pointer text-center"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg",
                  btn.gradient
                )}>
                  <btn.icon className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm">{btn.title}</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {btn.description}
                </span>
                <span className="text-[10px] text-primary/70 font-medium leading-tight">
                  {btn.destination}
                </span>
              </motion.button>
            ))}
          </div>

          {/* How it works */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-1.5 p-1.5 sm:p-2 rounded-lg bg-muted/50 min-w-0">
                <Badge variant="secondary" className="shrink-0 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                  {i + 1}
                </Badge>
                <span className="text-[10px] sm:text-[11px] lg:text-xs text-muted-foreground leading-snug break-words min-w-0">{step.text}</span>
              </div>
            ))}
          </div>

          {/* Collapsible: Which one should I use? */}
          <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer">
                <HelpCircle className="h-3.5 w-3.5" />
                {l ? '¿Cuál uso? + ¿Qué puedo subir?' : 'Which one? + What can I upload?'}
                {helpOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                {/* Comparison table */}
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-semibold">{l ? 'Método' : 'Method'}</th>
                        <th className="text-left p-2 font-semibold">{l ? 'Resultado' : 'Result'}</th>
                        <th className="text-left p-2 font-semibold">{l ? 'Mejor para' : 'Best for'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border/30">
                        <td className="p-2 font-medium">📸 {l ? 'Foto' : 'Photo'}</td>
                        <td className="p-2 text-muted-foreground">{l ? 'Va a Bandeja del Caos → revisas → se crea gasto' : 'Goes to Chaos Inbox → you review → expense created'}</td>
                        <td className="p-2 text-muted-foreground">{l ? 'Recibos, facturas, comprobantes' : 'Receipts, invoices, vouchers'}</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="p-2 font-medium">✍️ {l ? 'Texto' : 'Text'}</td>
                        <td className="p-2 text-muted-foreground">{l ? 'Crea gasto/ingreso directamente (sin revisión)' : 'Creates expense/income directly (no review)'}</td>
                        <td className="p-2 text-muted-foreground">{l ? 'Transacciones simples sin comprobante' : 'Simple transactions without receipt'}</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="p-2 font-medium">🏦 {l ? 'Banco' : 'Bank'}</td>
                        <td className="p-2 text-muted-foreground">{l ? 'Importa al Análisis Bancario → concilia con gastos' : 'Imports to Banking Analysis → reconciles with expenses'}</td>
                        <td className="p-2 text-muted-foreground">{l ? 'Extractos completos, detectar suscripciones' : 'Full statements, detect subscriptions'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* What can I upload */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                    {l ? '📎 Tipos de documentos aceptados:' : '📎 Accepted document types:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {examples.map((ex) => (
                      <Badge key={ex} variant="outline" className="text-xs font-normal">
                        {ex}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <QuickCaptureDialog open={captureOpen} onClose={() => setCaptureOpen(false)} defaultTab={captureTab} />
      <BankImportDialog open={bankOpen} onClose={() => setBankOpen(false)} />
    </>
  );
}
