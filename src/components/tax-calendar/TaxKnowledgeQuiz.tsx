import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useTaxKnowledge, useUpsertTaxKnowledge } from "@/hooks/data/useTaxKnowledge";
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, HelpCircle, 
  Lightbulb, ExternalLink, BookOpen, MessageSquare, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface TaxKnowledgeQuizProps {
  onClose: () => void;
  onComplete?: () => void;
}

interface QuizQuestion {
  id: string;
  question: { es: string; en: string };
  type: 'boolean' | 'open' | 'scale' | 'date';
  helpText?: { es: string; en: string };
  whereToFind?: { es: string; en: string; link?: string };
  conditionalOn?: (answers: Record<string, any>, profile: any) => boolean;
  field: string;
}

export function TaxKnowledgeQuiz({ onClose, onComplete }: TaxKnowledgeQuizProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { data: existing } = useTaxKnowledge();
  const upsert = useUpsertTaxKnowledge();
  const isEs = language === 'es';
  const isChile = profile?.country === 'CL';
  const workTypes = profile?.work_types || [];
  const hasBusiness = workTypes.includes('contractor') || workTypes.includes('corporation');

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    if (existing) {
      const e = existing as any;
      return {
        has_filed_before: e.has_filed_before,
        has_accountant: e.has_accountant,
        accountant_info: e.accountant_info || '',
        switched_from_employee: e.switched_from_employee,
        employee_end_date: e.employee_end_date || '',
        employment_transition_notes: e.employment_transition_notes || '',
        first_business_revenue_date: e.first_business_revenue_date || '',
        business_start_date_notes: e.business_start_date_notes || '',
        previous_filings_notes: e.previous_filings_notes || '',
        knows_fiscal_year_end: e.knows_fiscal_year_end,
        knows_gst_hst_status: e.knows_gst_hst_status,
        knows_tax_regime: e.knows_tax_regime,
        tax_software_used: e.tax_software_used || '',
        general_tax_knowledge: e.general_tax_knowledge || 1,
        additional_notes: e.additional_notes || '',
        business_registration_date: e.business_registration_date || '',
        business_legal_name: e.business_legal_name || '',
        has_separate_bank_account: e.has_separate_bank_account,
        uses_home_office: e.uses_home_office,
        home_office_details: e.home_office_details || '',
        uses_vehicle_for_business: e.uses_vehicle_for_business,
        has_international_income: e.has_international_income,
        international_income_details: e.international_income_details || '',
        pays_tax_installments: e.pays_tax_installments,
        record_keeping_method: e.record_keeping_method || '',
        has_tax_debts: e.has_tax_debts,
        tax_debts_details: e.tax_debts_details || '',
        has_employees: e.has_employees,
      };
    }
    return {};
  });

  const [currentIdx, setCurrentIdx] = useState(0);

  const questions: QuizQuestion[] = useMemo(() => {
    const qs: QuizQuestion[] = [
      // Q1: Has filed before?
      {
        id: 'has_filed_before',
        field: 'has_filed_before',
        type: 'boolean',
        question: {
          es: '¿Has declarado impuestos antes por tu cuenta o con un contador?',
          en: 'Have you filed taxes before on your own or with an accountant?'
        },
        helpText: {
          es: 'Si nunca has declarado, no te preocupes. Te guiaremos paso a paso.',
          en: "If you've never filed, don't worry. We'll guide you step by step."
        },
      },
      // Q2: Previous filings details (if yes)
      {
        id: 'previous_filings_notes',
        field: 'previous_filings_notes',
        type: 'open',
        question: {
          es: '¿Qué tipo de declaraciones has hecho? Cuéntanos lo que recuerdes.',
          en: 'What type of returns have you filed? Tell us what you remember.'
        },
        helpText: {
          es: 'Ejemplo: "Solo declaré T1 como empleado" o "Un contador hacía todo" o "Usaba TurboTax"',
          en: 'Example: "Just filed T1 as employee" or "An accountant did everything" or "I used TurboTax"'
        },
        conditionalOn: (a) => a.has_filed_before === true,
      },
      // Q3: Has accountant?
      {
        id: 'has_accountant',
        field: 'has_accountant',
        type: 'boolean',
        question: {
          es: '¿Tienes un contador o asesor fiscal actualmente?',
          en: 'Do you currently have an accountant or tax advisor?'
        },
        helpText: {
          es: 'Si no tienes, podemos ayudarte a entender qué necesitas.',
          en: "If you don't have one, we can help you understand what you need."
        },
      },
      // Q4: Accountant details
      {
        id: 'accountant_info',
        field: 'accountant_info',
        type: 'open',
        question: {
          es: '¿Qué servicios te presta tu contador? ¿Qué te resuelve él/ella y qué haces tú?',
          en: 'What services does your accountant provide? What do they handle vs. what do you do?'
        },
        conditionalOn: (a) => a.has_accountant === true,
      },
      // Q5: Switched from employee?
      {
        id: 'switched_from_employee',
        field: 'switched_from_employee',
        type: 'boolean',
        question: {
          es: '¿Dejaste de ser empleado para emprender o trabajar independiente?',
          en: 'Did you leave employment to start a business or work independently?'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q6: When did you stop being employee?
      {
        id: 'employee_end_date',
        field: 'employee_end_date',
        type: 'open',
        question: {
          es: '¿Cuándo dejaste de ser empleado? (fecha aproximada está bien)',
          en: 'When did you stop being an employee? (approximate date is fine)'
        },
        helpText: {
          es: 'Ejemplo: "marzo 2024" o "no recuerdo exacto, fue a mediados de 2023"',
          en: 'Example: "March 2024" or "I don\'t remember exactly, it was mid-2023"'
        },
        whereToFind: isChile 
          ? { es: 'Revisa tu último finiquito o tu cuenta en AFP para la fecha de tu última cotización', en: 'Check your last settlement or AFP account for the date of your last contribution' }
          : { es: 'Revisa tu último T4 o Record of Employment (ROE)', en: 'Check your last T4 or Record of Employment (ROE)', link: 'https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/reports/roe-guide.html' },
        conditionalOn: (a) => a.switched_from_employee === true,
      },
      // Q7: Employment transition notes
      {
        id: 'employment_transition_notes',
        field: 'employment_transition_notes',
        type: 'open',
        question: {
          es: '¿Hubo un período donde fuiste empleado e independiente al mismo tiempo?',
          en: 'Was there a period where you were an employee and self-employed at the same time?'
        },
        helpText: {
          es: 'Esto afecta cómo se calculan tus impuestos. Si no estás seguro, escribe lo que recuerdes.',
          en: 'This affects how your taxes are calculated. If unsure, write what you remember.'
        },
        conditionalOn: (a) => a.switched_from_employee === true,
      },
      // Q8: Business registration/incorporation date
      {
        id: 'business_registration_date',
        field: 'business_registration_date',
        type: 'open',
        question: {
          es: '¿Cuándo registraste o incorporaste tu empresa oficialmente? (fecha exacta o aproximada)',
          en: 'When did you officially register or incorporate your business? (exact or approximate date)'
        },
        helpText: {
          es: 'Ejemplo: "15 de marzo de 2023" o "creo que fue a principios de 2024"',
          en: 'Example: "March 15, 2023" or "I think it was early 2024"'
        },
        whereToFind: isChile
          ? { es: 'Revisa tu Inicio de Actividades en SII → Consultas → Inicio de Actividades', en: 'Check your Activity Start in SII → Queries → Activity Start', link: 'https://www.sii.cl' }
          : { es: 'Busca tu Articles of Incorporation o el certificado de registro provincial. También en CRA My Business Account.', en: 'Find your Articles of Incorporation or provincial registration certificate. Also in CRA My Business Account.', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => hasBusiness,
      },
      // Q9: Business legal name
      {
        id: 'business_legal_name',
        field: 'business_legal_name',
        type: 'open',
        question: {
          es: '¿Cuál es el nombre legal registrado de tu empresa o negocio?',
          en: 'What is the registered legal name of your business?'
        },
        helpText: {
          es: 'Ejemplo: "Evolaris SpA" o "John Doe Consulting" o "solo uso mi nombre personal"',
          en: 'Example: "Evolaris Inc." or "John Doe Consulting" or "I just use my personal name"'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q10: First revenue date
      {
        id: 'first_business_revenue_date',
        field: 'first_business_revenue_date',
        type: 'open',
        question: {
          es: '¿Cuándo recibiste tu primer ingreso como independiente o empresa?',
          en: 'When did you receive your first income as self-employed or business?'
        },
        helpText: {
          es: 'Ejemplo: "mi primera factura fue en junio 2024" o "empecé a cobrar en enero"',
          en: 'Example: "my first invoice was June 2024" or "I started charging in January"'
        },
        whereToFind: isChile
          ? { es: 'Revisa tus boletas emitidas en el SII → Consulta de Boletas', en: 'Check your issued receipts in SII → Receipt Query', link: 'https://www.sii.cl' }
          : { es: 'Revisa tu primera factura o tu primer depósito por servicios', en: 'Check your first invoice or first service deposit' },
        conditionalOn: () => hasBusiness,
      },
      // Q11: Business start notes
      {
        id: 'business_start_date_notes',
        field: 'business_start_date_notes',
        type: 'open',
        question: {
          es: '¿Cómo y cuándo creaste tu negocio/empresa? Cuéntanos lo que sepas.',
          en: 'How and when did you create your business? Tell us what you know.'
        },
        helpText: {
          es: 'Si no recuerdas la fecha exacta, indica lo que recuerdes. Ejemplo: "la registré en el SII en 2023" o "me incorporé con un abogado en septiembre"',
          en: 'If you don\'t remember the exact date, write what you recall. Example: "registered with CRA in 2023" or "incorporated with a lawyer in September"'
        },
        whereToFind: isChile
          ? { es: 'Busca tu escritura de constitución o revisa tu inicio de actividades en SII', en: 'Check your incorporation deed or activity start in SII', link: 'https://www.sii.cl' }
          : { es: 'Busca tu Articles of Incorporation o la carta de confirmación de CRA con tu Business Number', en: 'Find your Articles of Incorporation or CRA confirmation letter with your Business Number', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => workTypes.includes('corporation'),
      },
      // Q12: Separate business bank account
      {
        id: 'has_separate_bank_account',
        field: 'has_separate_bank_account',
        type: 'boolean',
        question: {
          es: '¿Tienes una cuenta bancaria separada para tu negocio?',
          en: 'Do you have a separate bank account for your business?'
        },
        helpText: {
          es: 'Tener cuentas separadas facilita mucho la contabilidad y declaración de impuestos.',
          en: 'Having separate accounts makes accounting and tax filing much easier.'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q13: Home office
      {
        id: 'uses_home_office',
        field: 'uses_home_office',
        type: 'boolean',
        question: {
          es: '¿Usas parte de tu hogar como oficina o espacio de trabajo para tu negocio?',
          en: 'Do you use part of your home as an office or workspace for your business?'
        },
        helpText: {
          es: 'Si trabajas desde casa, podrías deducir una parte proporcional de arriendo, servicios, internet, etc.',
          en: 'If you work from home, you may be able to deduct a proportional share of rent, utilities, internet, etc.'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q14: Home office details
      {
        id: 'home_office_details',
        field: 'home_office_details',
        type: 'open',
        question: {
          es: '¿Qué porcentaje de tu hogar usas para trabajar? ¿Sabes cómo calcularlo?',
          en: 'What percentage of your home do you use for work? Do you know how to calculate it?'
        },
        helpText: {
          es: 'Ejemplo: "uso una pieza de 4, así que creo que es 25%" o "no sé cómo calcularlo"',
          en: 'Example: "I use 1 room out of 4, so I think it\'s 25%" or "I don\'t know how to calculate it"'
        },
        whereToFind: isChile
          ? { es: 'Calcula los metros cuadrados de tu espacio de trabajo vs el total de tu vivienda', en: 'Calculate the square meters of your workspace vs total home' }
          : { es: 'CRA permite el método de área (m²) o de habitaciones. Busca formulario T2125, Parte 7.', en: 'CRA allows area (sq ft) or room method. See form T2125, Part 7.', link: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses/work-space-home-expenses.html' },
        conditionalOn: (a) => a.uses_home_office === true,
      },
      // Q15: Vehicle for business
      {
        id: 'uses_vehicle_for_business',
        field: 'uses_vehicle_for_business',
        type: 'boolean',
        question: {
          es: '¿Usas un vehículo para fines de tu negocio?',
          en: 'Do you use a vehicle for business purposes?'
        },
        helpText: {
          es: 'Si usas tu auto para visitar clientes, entregas, etc., podrías deducir gastos relacionados.',
          en: 'If you use your car to visit clients, make deliveries, etc., you may be able to deduct related expenses.'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q16: International clients/income
      {
        id: 'has_international_income',
        field: 'has_international_income',
        type: 'boolean',
        question: {
          es: '¿Recibes ingresos de clientes o fuentes en otros países?',
          en: 'Do you receive income from clients or sources in other countries?'
        },
        helpText: {
          es: 'El ingreso internacional puede tener implicaciones especiales en impuestos y tipo de cambio.',
          en: 'International income may have special tax implications and exchange rate considerations.'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q17: International income details
      {
        id: 'international_income_details',
        field: 'international_income_details',
        type: 'open',
        question: {
          es: '¿De qué países recibes ingresos y en qué moneda te pagan?',
          en: 'From which countries do you receive income and in what currency are you paid?'
        },
        helpText: {
          es: 'Ejemplo: "clientes en USA que me pagan en USD por Paypal" o "una empresa en España que paga en EUR"',
          en: 'Example: "US clients who pay me in USD via Paypal" or "a company in Spain that pays in EUR"'
        },
        conditionalOn: (a) => a.has_international_income === true,
      },
      // Q18: Tax installments
      {
        id: 'pays_tax_installments',
        field: 'pays_tax_installments',
        type: 'boolean',
        question: isChile
          ? { es: '¿Pagas PPM (Pagos Provisionales Mensuales)?', en: 'Do you pay PPM (Monthly Provisional Payments)?' }
          : { es: '¿Pagas cuotas trimestrales de impuestos (tax installments) a CRA?', en: 'Do you pay quarterly tax installments to CRA?' },
        helpText: isChile
          ? { es: 'Los PPM son pagos anticipados mensuales de impuestos que deben hacer algunos contribuyentes.', en: 'PPM are monthly advance tax payments required from some taxpayers.' }
          : { es: 'CRA puede requerir pagos trimestrales si debes más de $3,000 en impuestos al año.', en: 'CRA may require quarterly payments if you owe more than $3,000 in taxes per year.' },
        whereToFind: isChile
          ? { es: 'Revisa en SII → Servicios Online → Declaración y Pago de PPM (F29)', en: 'Check in SII → Online Services → PPM Declaration and Payment (F29)', link: 'https://www.sii.cl' }
          : { es: 'Revisa en CRA My Account si tienes un reminder de installments o busca la carta que CRA envía', en: 'Check CRA My Account for installment reminders or look for CRA\'s letter', link: 'https://www.canada.ca/en/revenue-agency/services/payments-cra/individual-payments/income-tax-instalments.html' },
        conditionalOn: () => hasBusiness,
      },
      // Q19: Record keeping
      {
        id: 'record_keeping_method',
        field: 'record_keeping_method',
        type: 'open',
        question: {
          es: '¿Cómo llevas el registro de tus ingresos y gastos actualmente?',
          en: 'How do you currently keep track of your income and expenses?'
        },
        helpText: {
          es: 'Ejemplo: "en un Excel", "no llevo registro", "uso QuickBooks", "guardo las boletas en una caja"',
          en: 'Example: "in a spreadsheet", "I don\'t keep records", "I use QuickBooks", "I keep receipts in a box"'
        },
      },
      // Q20: Tax debts or issues
      {
        id: 'has_tax_debts',
        field: 'has_tax_debts',
        type: 'boolean',
        question: {
          es: '¿Tienes deudas pendientes, multas o problemas anteriores con el organismo fiscal?',
          en: 'Do you have any outstanding debts, penalties, or previous issues with the tax authority?'
        },
        helpText: {
          es: 'No te preocupes, es más común de lo que crees. Saber esto nos ayuda a orientarte mejor.',
          en: "Don't worry, it's more common than you think. Knowing this helps us guide you better."
        },
      },
      // Q21: Tax debts details
      {
        id: 'tax_debts_details',
        field: 'tax_debts_details',
        type: 'open',
        question: {
          es: 'Cuéntanos sobre la situación. ¿Qué tipo de deuda o problema y desde cuándo?',
          en: 'Tell us about the situation. What kind of debt or issue and since when?'
        },
        conditionalOn: (a) => a.has_tax_debts === true,
      },
      // Q22: Has employees or contractors
      {
        id: 'has_employees',
        field: 'has_employees',
        type: 'boolean',
        question: {
          es: '¿Tienes empleados o contratas a otras personas para tu negocio?',
          en: 'Do you have employees or hire other people for your business?'
        },
        helpText: {
          es: 'Esto incluye empleados con contrato, subcontratistas o freelancers que trabajan para ti.',
          en: 'This includes contracted employees, subcontractors, or freelancers who work for you.'
        },
        conditionalOn: () => hasBusiness,
      },
      // Q23: Knows fiscal year end?
      {
        id: 'knows_fiscal_year_end',
        field: 'knows_fiscal_year_end',
        type: 'boolean',
        question: isChile 
          ? { es: '¿Sabes que en Chile el año fiscal siempre termina el 31 de diciembre?', en: 'Do you know that in Chile the fiscal year always ends December 31?' }
          : { es: '¿Sabes cuál es el fin de año fiscal de tu corporación?', en: 'Do you know your corporation\'s fiscal year end?' },
        whereToFind: isChile 
          ? undefined
          : { es: 'Está en tu Articles of Incorporation o en la carta de CRA. También en CRA My Business Account.', en: 'It\'s in your Articles of Incorporation or CRA letter. Also in CRA My Business Account.', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => workTypes.includes('corporation'),
      },
      // Q11: GST/HST or Tax regime knowledge
      ...(isChile ? [{
        id: 'knows_tax_regime',
        field: 'knows_tax_regime',
        type: 'boolean' as const,
        question: { es: '¿Sabes en qué régimen tributario está tu empresa? (Pro-Pyme, General, etc.)', en: 'Do you know your business tax regime? (Pro-Pyme, General, etc.)' },
        whereToFind: { es: 'Revisa en SII → Mi Información → Régimen Tributario', en: 'Check in SII → My Information → Tax Regime', link: 'https://www.sii.cl' },
        conditionalOn: () => hasBusiness,
      }] : [{
        id: 'knows_gst_hst_status',
        field: 'knows_gst_hst_status',
        type: 'boolean' as const,
        question: { es: '¿Sabes si estás registrado para GST/HST y cuándo debes declarar?', en: 'Do you know if you\'re registered for GST/HST and when you need to file?' },
        whereToFind: { es: 'Revisa CRA My Business Account o tu carta de registro RT', en: 'Check CRA My Business Account or your RT registration letter', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => hasBusiness,
      }]),
      // Q12: Tax software
      {
        id: 'tax_software_used',
        field: 'tax_software_used',
        type: 'open',
        question: {
          es: '¿Usas algún software para impuestos? ¿Cuál?',
          en: 'Do you use any tax software? Which one?'
        },
        helpText: {
          es: 'Ejemplo: "TurboTax", "Wealthsimple Tax", "mi contador usa algo", "ninguno"',
          en: 'Example: "TurboTax", "Wealthsimple Tax", "my accountant uses something", "none"'
        },
      },
      // Q13: Self-assessment
      {
        id: 'general_tax_knowledge',
        field: 'general_tax_knowledge',
        type: 'scale',
        question: {
          es: '¿Cómo calificarías tu conocimiento general sobre impuestos?',
          en: 'How would you rate your general tax knowledge?'
        },
      },
      // Q14: Anything else
      {
        id: 'additional_notes',
        field: 'additional_notes',
        type: 'open',
        question: {
          es: '¿Hay algo más que quieras contarnos sobre tu situación fiscal? Cualquier duda o detalle.',
          en: 'Is there anything else you\'d like to tell us about your tax situation? Any questions or details.'
        },
        helpText: {
          es: 'Este es tu espacio libre. Escribe cualquier pregunta, duda o situación especial.',
          en: 'This is your free space. Write any question, doubt, or special situation.'
        },
      },
    ];

    return qs.filter(q => !q.conditionalOn || q.conditionalOn(answers, profile));
  }, [answers, profile, hasBusiness, isChile, workTypes, isEs]);

  const currentQ = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const setAnswer = (field: string, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const gaps: string[] = [];
    if (answers.has_filed_before === false) gaps.push('no_filing_experience');
    if (answers.has_accountant === false) gaps.push('no_accountant');
    if (answers.knows_fiscal_year_end === false) gaps.push('unknown_fiscal_year');
    if (answers.knows_gst_hst_status === false) gaps.push('unknown_gst_status');
    if (answers.knows_tax_regime === false) gaps.push('unknown_tax_regime');
    if ((answers.general_tax_knowledge || 1) <= 2) gaps.push('low_tax_knowledge');
    if (answers.has_separate_bank_account === false) gaps.push('no_separate_bank');
    if (!answers.business_registration_date && hasBusiness) gaps.push('unknown_registration_date');
    if (answers.has_tax_debts === true) gaps.push('has_tax_debts');
    if (!answers.record_keeping_method || answers.record_keeping_method.toLowerCase().includes('no ')) gaps.push('poor_record_keeping');

    await upsert.mutateAsync({
      country: profile?.country || 'CA',
      ...answers,
      knowledge_gaps: gaps as any,
      completed_at: new Date().toISOString(),
    });

    toast.success(isEs ? '¡Evaluación completada! Ahora personalizaremos tu experiencia.' : 'Assessment complete! We\'ll now personalize your experience.');
    onComplete?.();
    onClose();
  };

  const scaleLabels = {
    es: ['Nada', 'Muy poco', 'Algo', 'Bastante', 'Experto'],
    en: ['Nothing', 'Very little', 'Some', 'Good', 'Expert'],
  };

  if (!currentQ) return null;

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            {isEs ? "Evaluación de Conocimiento Fiscal" : "Tax Knowledge Assessment"}
          </CardTitle>
          <CardDescription>
            {isEs 
              ? "Responde con lo que sepas. Si no sabes algo, te diremos dónde encontrarlo."
              : "Answer with what you know. If you don't know something, we'll tell you where to find it."
            }
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentIdx + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Question */}
        <div className="space-y-4 min-h-[200px]">
          <Label className="text-base font-semibold leading-relaxed block">
            <MessageSquare className="h-4 w-4 inline mr-2 text-primary" />
            {currentQ.question[isEs ? 'es' : 'en']}
          </Label>

          {/* Help text */}
          {currentQ.helpText && (
            <p className="text-sm text-muted-foreground italic">
              💡 {currentQ.helpText[isEs ? 'es' : 'en']}
            </p>
          )}

          {/* Answer input based on type */}
          {currentQ.type === 'boolean' && (
            <RadioGroup
              value={answers[currentQ.field] === true ? 'yes' : answers[currentQ.field] === false ? 'no' : ''}
              onValueChange={(v) => setAnswer(currentQ.field, v === 'yes')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="yes" id={`${currentQ.id}-yes`} />
                <Label htmlFor={`${currentQ.id}-yes`} className="flex-1 cursor-pointer">
                  {isEs ? "Sí" : "Yes"}
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="no" id={`${currentQ.id}-no`} />
                <Label htmlFor={`${currentQ.id}-no`} className="flex-1 cursor-pointer">
                  {isEs ? "No / No estoy seguro" : "No / I'm not sure"}
                </Label>
              </div>
            </RadioGroup>
          )}

          {currentQ.type === 'open' && (
            <Textarea
              placeholder={isEs ? "Escribe lo que sepas, o 'no sé' si no estás seguro..." : "Write what you know, or 'I don't know' if unsure..."}
              value={answers[currentQ.field] || ''}
              onChange={(e) => setAnswer(currentQ.field, e.target.value)}
              className="min-h-[100px]"
            />
          )}

          {currentQ.type === 'date' && (
            <Input
              type="date"
              value={answers[currentQ.field] || ''}
              onChange={(e) => setAnswer(currentQ.field, e.target.value)}
            />
          )}

          {currentQ.type === 'scale' && (
            <div className="space-y-3">
              <RadioGroup
                value={(answers[currentQ.field] || 1).toString()}
                onValueChange={(v) => setAnswer(currentQ.field, parseInt(v))}
                className="space-y-2"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={level.toString()} id={`scale-${level}`} />
                    <Label htmlFor={`scale-${level}`} className="flex-1 cursor-pointer flex items-center gap-2">
                      <Badge variant={level <= 2 ? "destructive" : level <= 3 ? "secondary" : "default"} className="text-xs">
                        {level}
                      </Badge>
                      {scaleLabels[isEs ? 'es' : 'en'][level - 1]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Where to find info */}
          {currentQ.whereToFind && answers[currentQ.field] === false && (
            <Alert className="bg-blue-500/10 border-blue-500/30 mt-4">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm space-y-2">
                <p className="font-medium">
                  {isEs ? "📍 Dónde encontrar esta información:" : "📍 Where to find this information:"}
                </p>
                <p>{currentQ.whereToFind[isEs ? 'es' : 'en']}</p>
                {currentQ.whereToFind.link && (
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <a href={currentQ.whereToFind.link} target="_blank" rel="noopener">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {isEs ? "Abrir sitio web" : "Open website"}
                    </a>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Skip note */}
          <p className="text-xs text-muted-foreground">
            {isEs 
              ? "💬 Puedes dejar en blanco si no sabes. La app te ayudará a encontrar la respuesta."
              : "💬 You can leave blank if you don't know. The app will help you find the answer."
            }
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="ghost"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {isEs ? "Anterior" : "Back"}
          </Button>
          
          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
              {isEs ? "Siguiente" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={upsert.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {upsert.isPending 
                ? (isEs ? "Guardando..." : "Saving...") 
                : (isEs ? "Completar" : "Complete")
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
