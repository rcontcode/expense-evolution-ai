import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Camera, Mic, PenLine, Building2, Inbox, 
  Bot, ArrowRightLeft, ShieldAlert,
  Receipt, DollarSign, LayoutDashboard, PiggyBank, BarChart3, FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowNode {
  id: string;
  emoji: React.ReactNode;
  label: { es: string; en: string };
  path?: string;
  color: string;
}

const INPUT_NODES: FlowNode[] = [
  { id: 'photo', emoji: <Camera className="h-4 w-4" />, label: { es: 'Captura Foto', en: 'Photo Capture' }, path: '/capture', color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 shadow-blue-500/15' },
  { id: 'voice', emoji: <Mic className="h-4 w-4" />, label: { es: 'Phoenix Voz', en: 'Phoenix Voice' }, path: '/phoenix', color: 'from-violet-500/20 to-violet-600/20 border-violet-500/30 shadow-violet-500/15' },
  { id: 'manual', emoji: <PenLine className="h-4 w-4" />, label: { es: 'Texto Manual', en: 'Manual Entry' }, path: '/expenses', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 shadow-emerald-500/15' },
  { id: 'bank', emoji: <Building2 className="h-4 w-4" />, label: { es: 'Import Banco', en: 'Bank Import' }, path: '/banking', color: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 shadow-cyan-500/15' },
  { id: 'chaos', emoji: <Inbox className="h-4 w-4" />, label: { es: 'Chaos Inbox', en: 'Chaos Inbox' }, path: '/chaos', color: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 shadow-amber-500/15' },
];

const PROCESS_NODES: FlowNode[] = [
  { id: 'ai', emoji: <Bot className="h-4 w-4" />, label: { es: 'IA Clasificación', en: 'AI Classification' }, color: 'from-primary/20 to-primary/30 border-primary/40 shadow-primary/15' },
  { id: 'reconcile', emoji: <ArrowRightLeft className="h-4 w-4" />, label: { es: 'Conciliación', en: 'Reconciliation' }, color: 'from-primary/20 to-primary/30 border-primary/40 shadow-primary/15' },
  { id: 'anomaly', emoji: <ShieldAlert className="h-4 w-4" />, label: { es: 'Detección Anomalías', en: 'Anomaly Detection' }, color: 'from-primary/20 to-primary/30 border-primary/40 shadow-primary/15' },
];

const OUTPUT_NODES: FlowNode[] = [
  { id: 'expenses', emoji: <Receipt className="h-4 w-4" />, label: { es: 'Gastos', en: 'Expenses' }, path: '/expenses', color: 'from-rose-500/20 to-rose-600/20 border-rose-500/30 shadow-rose-500/15' },
  { id: 'income', emoji: <DollarSign className="h-4 w-4" />, label: { es: 'Ingresos', en: 'Income' }, path: '/income', color: 'from-green-500/20 to-green-600/20 border-green-500/30 shadow-green-500/15' },
  { id: 'dashboard', emoji: <LayoutDashboard className="h-4 w-4" />, label: { es: 'Dashboard', en: 'Dashboard' }, path: '/dashboard', color: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 shadow-indigo-500/15' },
  { id: 'budget', emoji: <PiggyBank className="h-4 w-4" />, label: { es: 'Presupuesto', en: 'Budget' }, path: '/budget', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 shadow-orange-500/15' },
  { id: 'analytics', emoji: <BarChart3 className="h-4 w-4" />, label: { es: 'Análisis', en: 'Analytics' }, path: '/analytics', color: 'from-teal-500/20 to-teal-600/20 border-teal-500/30 shadow-teal-500/15' },
  { id: 'tax', emoji: <FileText className="h-4 w-4" />, label: { es: 'Reporte Fiscal', en: 'Tax Report' }, path: '/tax-report-flow', color: 'from-red-500/20 to-red-600/20 border-red-500/30 shadow-red-500/15' },
];

function FlowNodeCard({ node, isClickable }: { node: FlowNode; isClickable: boolean }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  return (
    <button
      onClick={() => node.path && navigate(node.path)}
      disabled={!isClickable}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all duration-200",
        "bg-gradient-to-br text-sm font-medium",
        "shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] active:translate-y-0.5",
        node.color,
        isClickable 
          ? "cursor-pointer hover:-translate-y-1 hover:scale-105 hover:shadow-lg" 
          : "cursor-default opacity-80"
      )}
    >
      <span className="shrink-0">{node.emoji}</span>
      <span className="text-xs font-semibold whitespace-nowrap">{node.label[language]}</span>
    </button>
  );
}

function ColumnHeader({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="text-center mb-3">
      <span className="text-xs font-bold uppercase tracking-wider text-primary">{label}</span>
      <p className="text-[10px] text-muted-foreground">{sublabel}</p>
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="flex items-center justify-center px-1 md:px-3">
      <div className="flex items-center gap-0.5 text-primary/40">
        <div className="w-6 md:w-10 h-0.5 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full" />
        <ArrowRight className="h-4 w-4 text-primary/50 shrink-0" />
      </div>
    </div>
  );
}

export function DataFlowMap() {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold">
          {isEs ? '¿Cómo fluye tu información?' : 'How does your data flow?'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isEs 
            ? 'Click en cualquier nodo para ir a esa sección' 
            : 'Click any node to go to that section'}
        </p>
      </div>

      {/* Desktop: 3 columns with arrows */}
      <div className="hidden md:flex items-start justify-center gap-0">
        {/* Input column */}
        <div className="flex-1 max-w-[200px]">
          <ColumnHeader 
            label={isEs ? '📥 Entrada' : '📥 Input'} 
            sublabel={isEs ? 'Dónde ingresas datos' : 'Where you enter data'} 
          />
          <div className="space-y-2">
            {INPUT_NODES.map(n => <FlowNodeCard key={n.id} node={n} isClickable={!!n.path} />)}
          </div>
        </div>

        <ArrowConnector />

        {/* Process column */}
        <div className="flex-1 max-w-[200px]">
          <ColumnHeader 
            label={isEs ? '⚙️ Proceso' : '⚙️ Processing'} 
            sublabel={isEs ? 'La IA trabaja por ti' : 'AI works for you'} 
          />
          <div className="space-y-2">
            {PROCESS_NODES.map(n => <FlowNodeCard key={n.id} node={n} isClickable={false} />)}
          </div>
        </div>

        <ArrowConnector />

        {/* Output column */}
        <div className="flex-1 max-w-[200px]">
          <ColumnHeader 
            label={isEs ? '📊 Resultado' : '📊 Result'} 
            sublabel={isEs ? 'Tus datos organizados' : 'Your organized data'} 
          />
          <div className="space-y-2">
            {OUTPUT_NODES.map(n => <FlowNodeCard key={n.id} node={n} isClickable={!!n.path} />)}
          </div>
        </div>
      </div>

      {/* Mobile: vertical stacked */}
      <div className="md:hidden space-y-6">
        <div>
          <ColumnHeader 
            label={isEs ? '📥 Entrada' : '📥 Input'} 
            sublabel={isEs ? 'Dónde ingresas datos' : 'Where you enter data'} 
          />
          <div className="grid grid-cols-2 gap-2">
            {INPUT_NODES.map(n => <FlowNodeCard key={n.id} node={n} isClickable={!!n.path} />)}
          </div>
        </div>

        <div className="flex justify-center text-primary/40">
          <ArrowRight className="h-5 w-5 rotate-90" />
        </div>

        <div>
          <ColumnHeader 
            label={isEs ? '⚙️ Proceso' : '⚙️ Processing'} 
            sublabel={isEs ? 'La IA trabaja por ti' : 'AI works for you'} 
          />
          <div className="grid grid-cols-2 gap-2">
            {PROCESS_NODES.map(n => <FlowNodeCard key={n.id} node={n} isClickable={false} />)}
          </div>
        </div>

        <div className="flex justify-center text-primary/40">
          <ArrowRight className="h-5 w-5 rotate-90" />
        </div>

        <div>
          <ColumnHeader 
            label={isEs ? '📊 Resultado' : '📊 Result'} 
            sublabel={isEs ? 'Tus datos organizados' : 'Your organized data'} 
          />
          <div className="grid grid-cols-2 gap-2">
            {OUTPUT_NODES.map(n => <FlowNodeCard key={n.id} node={n} isClickable={!!n.path} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
