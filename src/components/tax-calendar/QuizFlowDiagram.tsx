import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Building2, DollarSign, Calculator, Shield, 
  User, Briefcase, Globe, Home, Car, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizFlowDiagramProps {
  currentIdx: number;
  totalQuestions: number;
  questionIds: string[];
  answeredFields: Record<string, any>;
  onJumpTo: (idx: number) => void;
}

interface FlowSection {
  id: string;
  icon: React.ReactNode;
  emoji: string;
  label: { es: string; en: string };
  description: { es: string; en: string };
  questionIds: string[];
  color: string;
  glowColor: string;
}

const SECTIONS: FlowSection[] = [
  {
    id: 'experience',
    icon: <User className="h-4 w-4" />,
    emoji: '🧑‍💼',
    label: { es: 'Experiencia', en: 'Experience' },
    description: { es: 'Tu historial con impuestos y contadores', en: 'Your history with taxes and accountants' },
    questionIds: ['has_filed_before', 'previous_filings_notes', 'has_accountant', 'accountant_info'],
    color: 'from-violet-500/20 to-purple-500/20',
    glowColor: 'shadow-violet-500/20',
  },
  {
    id: 'transition',
    icon: <Briefcase className="h-4 w-4" />,
    emoji: '🔄',
    label: { es: 'Transición', en: 'Transition' },
    description: { es: 'De empleado a independiente', en: 'From employee to self-employed' },
    questionIds: ['switched_from_employee', 'employee_end_date', 'employment_transition_notes'],
    color: 'from-amber-500/20 to-orange-500/20',
    glowColor: 'shadow-amber-500/20',
  },
  {
    id: 'business',
    icon: <Building2 className="h-4 w-4" />,
    emoji: '🏢',
    label: { es: 'Tu Negocio', en: 'Your Business' },
    description: { es: 'Registro, nombre, tipo de estructura', en: 'Registration, name, structure type' },
    questionIds: ['business_registration_date', 'business_legal_name', 'first_business_revenue_date', 'business_start_date_notes', 'has_separate_bank_account', 'has_employees'],
    color: 'from-blue-500/20 to-cyan-500/20',
    glowColor: 'shadow-blue-500/20',
  },
  {
    id: 'workspace',
    icon: <Home className="h-4 w-4" />,
    emoji: '🏠',
    label: { es: 'Espacio y Vehículo', en: 'Workspace & Vehicle' },
    description: { es: 'Home office y uso de vehículo', en: 'Home office and vehicle usage' },
    questionIds: ['uses_home_office', 'home_office_details', 'uses_vehicle_for_business'],
    color: 'from-green-500/20 to-emerald-500/20',
    glowColor: 'shadow-green-500/20',
  },
  {
    id: 'income',
    icon: <DollarSign className="h-4 w-4" />,
    emoji: '💰',
    label: { es: 'Ingresos', en: 'Income' },
    description: { es: 'Patrón, rango e ingresos internacionales', en: 'Pattern, range, and international income' },
    questionIds: ['has_international_income', 'international_income_details', 'revenue_pattern', 'revenue_range', 'business_tax_id'],
    color: 'from-emerald-500/20 to-teal-500/20',
    glowColor: 'shadow-emerald-500/20',
  },
  {
    id: 'tax_obligations',
    icon: <Calculator className="h-4 w-4" />,
    emoji: '📋',
    label: { es: 'Obligaciones', en: 'Obligations' },
    description: { es: 'GST/IVA, plazos, pagos provisionales', en: 'GST/VAT, deadlines, installments' },
    questionIds: ['knows_fiscal_year_end', 'knows_gst_hst_status', 'knows_tax_regime', 'gst_registration_date', 'iva_registration_date', 'gst_filing_frequency', 'iva_filing_frequency', 'pays_tax_installments', 'knows_personal_tax_deadline'],
    color: 'from-rose-500/20 to-pink-500/20',
    glowColor: 'shadow-rose-500/20',
  },
  {
    id: 'tools_knowledge',
    icon: <Shield className="h-4 w-4" />,
    emoji: '🎯',
    label: { es: 'Herramientas y Nivel', en: 'Tools & Level' },
    description: { es: 'Software, registros, deudas y autoevaluación', en: 'Software, records, debts, and self-assessment' },
    questionIds: ['record_keeping_method', 'has_tax_debts', 'tax_debts_details', 'tax_software_used', 'general_tax_knowledge', 'additional_notes'],
    color: 'from-indigo-500/20 to-blue-500/20',
    glowColor: 'shadow-indigo-500/20',
  },
];

export function QuizFlowDiagram({ currentIdx, totalQuestions, questionIds, answeredFields, onJumpTo }: QuizFlowDiagramProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const currentQId = questionIds[currentIdx];

  // Find which section the current question belongs to
  const currentSectionIdx = SECTIONS.findIndex(s => s.questionIds.includes(currentQId));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        🗺️ {isEs ? 'Mapa de la evaluación' : 'Assessment map'}
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {SECTIONS.map((section, sIdx) => {
          // Count how many of this section's questions exist in the visible list
          const visibleQs = section.questionIds.filter(qid => questionIds.includes(qid));
          if (visibleQs.length === 0) return null;

          const answeredCount = visibleQs.filter(qid => {
            const val = answeredFields[qid];
            return val !== undefined && val !== null && val !== '';
          }).length;

          const isCurrent = sIdx === currentSectionIdx;
          const isComplete = answeredCount === visibleQs.length && visibleQs.length > 0;
          const firstQIdx = questionIds.indexOf(visibleQs[0]);

          return (
            <button
              key={section.id}
              onClick={() => firstQIdx >= 0 && onJumpTo(firstQIdx)}
              className={cn(
                "flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border transition-all duration-300 min-w-[72px] relative group",
                isCurrent
                  ? `bg-gradient-to-b ${section.color} border-primary/40 shadow-lg ${section.glowColor} scale-105 ring-2 ring-primary/20`
                  : isComplete
                    ? "bg-gradient-to-b from-primary/5 to-primary/10 border-primary/20 opacity-80"
                    : "bg-card/50 border-border/50 opacity-60 hover:opacity-90 hover:scale-102"
              )}
            >
              {/* Pulse ring on current */}
              {isCurrent && (
                <span className="absolute inset-0 rounded-xl animate-pulse ring-2 ring-primary/30 pointer-events-none" />
              )}

              <span className="text-lg">{section.emoji}</span>
              <span className="text-[10px] font-medium leading-tight text-center">
                {section.label[isEs ? 'es' : 'en']}
              </span>

              {/* Progress dots */}
              <div className="flex gap-0.5 mt-0.5">
                {visibleQs.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      i < answeredCount ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              {isComplete && (
                <CheckCircle2 className="h-3 w-3 text-primary absolute -top-1 -right-1" />
              )}

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <p className="font-medium">{section.label[isEs ? 'es' : 'en']}</p>
                <p className="text-muted-foreground">{section.description[isEs ? 'es' : 'en']}</p>
                <p className="text-primary font-semibold mt-1">
                  {answeredCount}/{visibleQs.length} {isEs ? 'respondidas' : 'answered'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
