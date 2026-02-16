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
  Lightbulb, ExternalLink, BookOpen, MessageSquare, AlertTriangle,
  Sparkles, PartyPopper, Trophy
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { QuizFlowDiagram } from "./QuizFlowDiagram";
import { cn } from "@/lib/utils";

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
  const isSoleProp = workTypes.includes('contractor') && !workTypes.includes('corporation');
  const isCorp = workTypes.includes('corporation');

  // Human-friendly business type labels  
  const bizLabel = (() => {
    if (isCorp && isChile) return { es: 'tu empresa (SpA, SRL, Sociedad)', en: 'your company (SpA, SRL, Partnership)' };
    if (isCorp) return { es: 'tu corporación (Inc., Ltd., Corp.)', en: 'your corporation (Inc., Ltd., Corp.)' };
    if (isSoleProp && isChile) return { es: 'tu actividad independiente (Persona Natural con Giro)', en: 'your self-employment (Natural Person with Business Activity)' };
    if (isSoleProp) return { es: 'tu Sole Proprietorship (negocio unipersonal / autónomo)', en: 'your Sole Proprietorship (one-person business / self-employed)' };
    return { es: 'tu negocio', en: 'your business' };
  })();

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
        gst_registration_date: e.gst_registration_date || '',
        iva_registration_date: e.iva_registration_date || '',
        gst_filing_frequency: e.gst_filing_frequency || '',
        iva_filing_frequency: e.iva_filing_frequency || '',
        revenue_pattern: e.revenue_pattern || '',
        revenue_range: e.revenue_range || '',
        business_tax_id: e.business_tax_id || '',
        knows_personal_tax_deadline: e.knows_personal_tax_deadline,
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
      // Q8: Business type education + registration date
      {
        id: 'business_registration_date',
        field: 'business_registration_date',
        type: 'open',
        question: isSoleProp
          ? (isChile
            ? { es: `Tu perfil indica que trabajas como ${bizLabel.es}. ¿Cuándo hiciste tu Inicio de Actividades en el SII?`, en: `Your profile shows you work as ${bizLabel.en}. When did you do your Activity Start in SII?` }
            : { es: `Tu perfil indica que tienes ${bizLabel.es}. ¿Cuándo registraste tu negocio? (Nota: un Sole Proprietorship NO requiere Articles of Incorporation — se registra con tu nombre o un "trade name" en tu provincia)`, en: `Your profile shows you have ${bizLabel.en}. When did you register your business? (Note: a Sole Proprietorship does NOT require Articles of Incorporation — it's registered under your name or a "trade name" in your province)` })
          : (isChile
            ? { es: `Tu perfil indica que tienes ${bizLabel.es}. ¿Cuándo se constituyó legalmente? (escritura + inscripción en SII)`, en: `Your profile shows you have ${bizLabel.en}. When was it legally established? (deed + SII registration)` }
            : { es: `Tu perfil indica que tienes ${bizLabel.es}. ¿Cuándo se incorporó? (fecha en los Articles of Incorporation)`, en: `Your profile shows you have ${bizLabel.en}. When was it incorporated? (date on Articles of Incorporation)` }),
        helpText: isSoleProp
          ? (isChile
            ? { es: 'Como Persona Natural con Giro, tu "registro" es tu Inicio de Actividades en el SII. Ejemplo: "creo que fue en marzo 2024"', en: 'As a Natural Person with Business Activity, your "registration" is your Activity Start in SII.' }
            : { es: 'Como Sole Proprietor, tu registro puede ser: (1) registro del nombre comercial ("Business Name Registration") en tu provincia, o (2) cuando abriste tu cuenta de CRA con Business Number. Ejemplo: "registré el nombre en Ontario en julio 2023"', en: 'As a Sole Proprietor, your registration may be: (1) Business Name Registration in your province, or (2) when you opened your CRA account with a Business Number. Example: "registered the name in Ontario in July 2023"' })
          : (isChile
            ? { es: 'Ejemplo: "la escritura se firmó en enero 2023" o "no recuerdo, un abogado hizo todo"', en: 'Example: "the deed was signed in January 2023" or "I don\'t remember, a lawyer did everything"' }
            : { es: 'Ejemplo: "se incorporó en septiembre 2023" o "mi abogado la creó, no recuerdo la fecha exacta"', en: 'Example: "incorporated in September 2023" or "my lawyer created it, I don\'t remember the exact date"' }),
        whereToFind: isSoleProp
          ? (isChile
            ? { es: 'Revisa en SII → Mi Información → Inicio de Actividades', en: 'Check in SII → My Information → Activity Start', link: 'https://www.sii.cl' }
            : { es: 'Busca tu certificado de "Business Name Registration" de tu provincia (ej. Ontario: ServiceOntario, BC: BC Registry). Si no registraste nombre, busca la carta de CRA con tu Business Number (BN).', en: 'Find your provincial "Business Name Registration" certificate (e.g., Ontario: ServiceOntario, BC: BC Registry). If you didn\'t register a name, look for CRA\'s letter with your Business Number (BN).', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' })
          : (isChile
            ? { es: 'Busca tu escritura de constitución o revisa tu inicio de actividades en SII', en: 'Check your incorporation deed or activity start in SII', link: 'https://www.sii.cl' }
            : { es: 'Busca tu Articles of Incorporation o la carta de confirmación de CRA con tu Business Number', en: 'Find your Articles of Incorporation or CRA confirmation letter with your Business Number', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' }),
        conditionalOn: () => hasBusiness,
      },
      // Q9: Business legal name
      {
        id: 'business_legal_name',
        field: 'business_legal_name',
        type: 'open',
        question: isSoleProp
          ? { es: `¿Registraste un nombre comercial (trade name) para ${bizLabel.es}, o usas tu nombre personal?`, en: `Did you register a trade name for ${bizLabel.en}, or do you use your personal name?` }
          : { es: `¿Cuál es el nombre legal registrado de ${bizLabel.es}?`, en: `What is the registered legal name of ${bizLabel.en}?` },
        helpText: isSoleProp
          ? (isChile
            ? { es: 'Ejemplo: "uso mi nombre, Juan Pérez" o "registré el nombre Evolaris" — como Persona Natural puedes operar con tu nombre o un nombre de fantasía', en: 'Example: "I use my name, Juan Pérez" or "I registered the name Evolaris"' }
            : { es: 'Ejemplo: "Evolaris" (trade name registrado) o "solo uso mi nombre legal John Doe" — como Sole Proprietor puedes operar con tu nombre personal o un nombre comercial registrado', en: 'Example: "Evolaris" (registered trade name) or "I just use my legal name John Doe" — as a Sole Proprietor you can operate under your personal name or a registered trade name' })
          : { es: 'Ejemplo: "Evolaris SpA" o "Evolaris Inc."', en: 'Example: "Evolaris SpA" or "Evolaris Inc."' },
        conditionalOn: () => hasBusiness,
      },
      // Q10: First revenue date
      {
        id: 'first_business_revenue_date',
        field: 'first_business_revenue_date',
        type: 'open',
        question: {
          es: `¿Cuándo recibiste tu primer ingreso a través de ${bizLabel.es}?`,
          en: `When did you receive your first income through ${bizLabel.en}?`
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
      // Q11: Business start notes (corporation only - sole prop already covered above)
      {
        id: 'business_start_date_notes',
        field: 'business_start_date_notes',
        type: 'open',
        question: {
          es: `¿Cómo creaste ${bizLabel.es}? ¿Usaste un abogado, contador, o lo hiciste tú mismo online?`,
          en: `How did you create ${bizLabel.en}? Did you use a lawyer, accountant, or did it yourself online?`
        },
        helpText: isSoleProp
          ? (isChile
            ? { es: 'Ejemplo: "hice el inicio de actividades yo mismo en el SII" o "un contador me ayudó"', en: 'Example: "I did the activity start myself in SII" or "an accountant helped me"' }
            : { es: 'Ejemplo: "registré el nombre en ServiceOntario online" o "solo abrí la cuenta de CRA, no registré nombre" o "un contador me ayudó"', en: 'Example: "I registered the name on ServiceOntario online" or "I just opened the CRA account, didn\'t register a name" or "an accountant helped me"' })
          : (isChile
            ? { es: 'Ejemplo: "un abogado hizo la escritura" o "usé una plataforma online"', en: 'Example: "a lawyer did the deed" or "I used an online platform"' }
            : { es: 'Ejemplo: "un abogado incorporó la empresa" o "usé Ownr/BizPal online"', en: 'Example: "a lawyer incorporated it" or "I used Ownr/BizPal online"' }),
        conditionalOn: () => hasBusiness,
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
      // GST/HST or Tax regime knowledge
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
      // GST/IVA registration date
      ...(isChile ? [{
        id: 'iva_registration_date',
        field: 'iva_registration_date',
        type: 'open' as const,
        question: { es: '¿Desde cuándo estás registrado como contribuyente de IVA? (fecha de inicio de actividades)', en: 'Since when are you registered as a VAT taxpayer? (activity start date)' },
        helpText: { es: 'Ejemplo: "desde enero 2023" o "no recuerdo la fecha exacta"', en: 'Example: "since January 2023" or "I don\'t remember the exact date"' },
        whereToFind: { es: 'Revisa en SII → Mi Información → Inicio de Actividades', en: 'Check in SII → My Information → Activity Start', link: 'https://www.sii.cl' },
        conditionalOn: () => hasBusiness,
      }] : [{
        id: 'gst_registration_date',
        field: 'gst_registration_date',
        type: 'open' as const,
        question: { es: '¿Desde cuándo estás registrado para GST/HST? (fecha de registro efectiva)', en: 'Since when have you been registered for GST/HST? (effective registration date)' },
        helpText: { es: 'Ejemplo: "desde marzo 2024" o "no estoy seguro si estoy registrado"', en: 'Example: "since March 2024" or "I\'m not sure if I\'m registered"' },
        whereToFind: { es: 'Revisa tu carta de confirmación de registro RT de CRA o CRA My Business Account → GST/HST Account', en: 'Check your CRA RT registration confirmation letter or CRA My Business Account → GST/HST Account', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => hasBusiness,
      }]),
      // GST/IVA filing frequency
      ...(isChile ? [{
        id: 'iva_filing_frequency',
        field: 'iva_filing_frequency',
        type: 'open' as const,
        question: { es: '¿Cada cuánto declaras IVA (F29)? ¿Mensual?', en: 'How often do you file VAT (F29)? Monthly?' },
        helpText: { es: 'En Chile generalmente es mensual (F29 cada mes). Si no sabes, escríbelo.', en: 'In Chile it\'s usually monthly (F29 each month). If unsure, write it.' },
        conditionalOn: () => hasBusiness,
      }] : [{
        id: 'gst_filing_frequency',
        field: 'gst_filing_frequency',
        type: 'open' as const,
        question: { es: '¿Cada cuánto declaras GST/HST? ¿Anual, trimestral o mensual?', en: 'How often do you file GST/HST? Annually, quarterly, or monthly?' },
        helpText: { es: 'Ejemplo: "anualmente" o "no estoy seguro, creo que trimestral"', en: 'Example: "annually" or "I\'m not sure, I think quarterly"' },
        whereToFind: { es: 'Revisa CRA My Business Account → GST/HST → Filing frequency', en: 'Check CRA My Business Account → GST/HST → Filing frequency', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => hasBusiness,
      }]),
      // Revenue pattern/seasonality
      {
        id: 'revenue_pattern',
        field: 'revenue_pattern',
        type: 'open',
        question: {
          es: '¿Cómo son tus ingresos? ¿Regulares cada mes, irregulares, por proyecto, estacionales?',
          en: 'What are your income patterns? Regular monthly, irregular, per-project, seasonal?'
        },
        helpText: {
          es: 'Ejemplo: "facturo mensual a 2 clientes fijos" o "varía mucho, a veces 3 meses sin ingreso"',
          en: 'Example: "I invoice monthly to 2 fixed clients" or "it varies a lot, sometimes 3 months without income"'
        },
        conditionalOn: () => hasBusiness,
      },
      // Average monthly revenue range
      {
        id: 'revenue_range',
        field: 'revenue_range',
        type: 'open',
        question: {
          es: '¿En qué rango están tus ingresos brutos mensuales aproximados? (no tiene que ser exacto)',
          en: 'What range are your approximate gross monthly revenues? (doesn\'t have to be exact)'
        },
        helpText: {
          es: 'Ejemplo: "entre $1M y $3M CLP" o "entre $3,000 y $5,000 CAD" o "muy variable"',
          en: 'Example: "between $3,000 and $5,000 CAD" or "very variable, sometimes $0"'
        },
        conditionalOn: () => hasBusiness,
      },
      // Business number / RUT
      ...(isChile ? [{
        id: 'business_tax_id',
        field: 'business_tax_id',
        type: 'open' as const,
        question: { es: '¿Cuál es el RUT de tu empresa? (si es diferente a tu RUT personal)', en: 'What is your business RUT? (if different from your personal RUT)' },
        helpText: { es: 'Si operas como persona natural con giro, usa tu RUT personal. Si tienes SpA/SRL/etc, indica el RUT de la empresa.', en: 'If you operate as a natural person with business activity, use your personal RUT.' },
        conditionalOn: () => hasBusiness,
      }] : [{
        id: 'business_tax_id',
        field: 'business_tax_id',
        type: 'open' as const,
        question: { es: '¿Cuál es tu Business Number (BN) de CRA? (los 9 dígitos)', en: 'What is your CRA Business Number (BN)? (the 9 digits)' },
        helpText: { es: 'Ejemplo: "123456789" — si no lo sabes, escribe "no lo sé"', en: 'Example: "123456789" — if you don\'t know, write "I don\'t know"' },
        whereToFind: { es: 'Está en la carta de confirmación de CRA o en CRA My Business Account', en: 'It\'s in the CRA confirmation letter or CRA My Business Account', link: 'https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html' },
        conditionalOn: () => hasBusiness,
      }]),
      // Personal tax filing deadline awareness
      {
        id: 'knows_personal_tax_deadline',
        field: 'knows_personal_tax_deadline',
        type: 'boolean',
        question: isChile
          ? { es: '¿Sabes cuándo es la fecha límite para tu Declaración de Renta (F22)?', en: 'Do you know the deadline for your Income Tax Return (F22)?' }
          : { es: '¿Sabes cuándo es la fecha límite para declarar tu T1 personal?', en: 'Do you know the deadline for filing your personal T1?' },
        whereToFind: isChile
          ? { es: 'Generalmente es en abril. Revisa SII para la fecha exacta de este año.', en: 'Usually in April. Check SII for this year\'s exact date.', link: 'https://www.sii.cl' }
          : { es: 'Para empleados: 30 de abril. Para self-employed: 15 de junio (pero el pago vence el 30 de abril).', en: 'For employees: April 30. For self-employed: June 15 (but payment is due April 30).', link: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html' },
      },
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

  // Question type emojis
  const typeEmoji = (type: string) => {
    switch(type) {
      case 'boolean': return '🤔';
      case 'open': return '✍️';
      case 'scale': return '📊';
      case 'date': return '📅';
      default: return '💬';
    }
  };

  // Milestone messages
  const getMilestone = () => {
    const pct = progress;
    if (pct >= 100) return { emoji: '🏆', text: isEs ? '¡Último paso!' : 'Last step!' };
    if (pct >= 75) return { emoji: '🔥', text: isEs ? '¡Ya casi terminas!' : 'Almost done!' };
    if (pct >= 50) return { emoji: '⚡', text: isEs ? '¡Vas a la mitad!' : 'Halfway there!' };
    if (pct >= 25) return { emoji: '🚀', text: isEs ? '¡Buen ritmo!' : 'Good pace!' };
    return null;
  };

  const milestone = getMilestone();

  if (!currentQ) return null;

  return (
    <Card className="border-primary/30 overflow-hidden shadow-2xl shadow-primary/10 relative">
      {/* Animated gradient border glow */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl opacity-30 pointer-events-none animate-pulse" />
      
      <CardHeader className="relative pb-3 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-primary/10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="relative">
                <BookOpen className="h-5 w-5 text-primary" />
                <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
              </span>
              {isEs ? "🧭 Evaluación de Conocimiento Fiscal" : "🧭 Tax Knowledge Assessment"}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="inline-block animate-[pulse_3s_ease-in-out_infinite]">✨</span>
              {isEs 
                ? "Responde con lo que sepas. Si no sabes algo, te diremos dónde encontrarlo."
                : "Answer with what you know. If you don't know something, we'll tell you where to find it."
              }
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5 pt-4 relative">
        {/* Flow Diagram */}
        <QuizFlowDiagram
          currentIdx={currentIdx}
          totalQuestions={questions.length}
          questionIds={questions.map(q => q.id)}
          answeredFields={answers}
          onJumpTo={(idx) => setCurrentIdx(idx)}
        />

        {/* Progress with milestone */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">
              {typeEmoji(currentQ.type)} {currentIdx + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-2">
              {milestone && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xs font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                >
                  {milestone.emoji} {milestone.text}
                </motion.span>
              )}
              <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20">
                {Math.round(progress)}%
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2.5 bg-muted/50" />
            {/* Glowing progress tip */}
            <motion.div
              className="absolute top-0 h-2.5 w-2 rounded-full bg-primary shadow-lg shadow-primary/50"
              style={{ left: `calc(${Math.min(progress, 98)}% - 4px)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Question with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4 min-h-[220px]"
          >
            {/* Question label with gradient */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-primary/10">
              <Label className="text-base font-semibold leading-relaxed block">
                <span className="inline-flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm">
                    {typeEmoji(currentQ.type)}
                  </span>
                  <span>{currentQ.question[isEs ? 'es' : 'en']}</span>
                </span>
              </Label>
            </div>

            {/* Help text with glow */}
            {currentQ.helpText && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/10"
              >
                <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-muted-foreground italic">
                  {currentQ.helpText[isEs ? 'es' : 'en']}
                </p>
              </motion.div>
            )}

            {/* Answer inputs with enhanced styling */}
            {currentQ.type === 'boolean' && (
              <RadioGroup
                value={answers[currentQ.field] === true ? 'yes' : answers[currentQ.field] === false ? 'no' : ''}
                onValueChange={(v) => setAnswer(currentQ.field, v === 'yes')}
                className="space-y-2"
              >
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <div className={cn(
                    "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300",
                    answers[currentQ.field] === true
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}>
                    <RadioGroupItem value="yes" id={`${currentQ.id}-yes`} />
                    <Label htmlFor={`${currentQ.id}-yes`} className="flex-1 cursor-pointer flex items-center gap-2">
                      <span className="text-lg">👍</span>
                      {isEs ? "Sí" : "Yes"}
                    </Label>
                    {answers[currentQ.field] === true && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <div className={cn(
                    "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300",
                    answers[currentQ.field] === false
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}>
                    <RadioGroupItem value="no" id={`${currentQ.id}-no`} />
                    <Label htmlFor={`${currentQ.id}-no`} className="flex-1 cursor-pointer flex items-center gap-2">
                      <span className="text-lg">🤷</span>
                      {isEs ? "No / No estoy seguro" : "No / I'm not sure"}
                    </Label>
                    {answers[currentQ.field] === false && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                </motion.div>
              </RadioGroup>
            )}

            {currentQ.type === 'open' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <Textarea
                  placeholder={isEs ? "✍️ Escribe lo que sepas, o 'no sé' si no estás seguro..." : "✍️ Write what you know, or 'I don't know' if unsure..."}
                  value={answers[currentQ.field] || ''}
                  onChange={(e) => setAnswer(currentQ.field, e.target.value)}
                  className="min-h-[100px] border-2 focus:border-primary/50 transition-colors bg-card/50 text-sm"
                />
              </motion.div>
            )}

            {currentQ.type === 'date' && (
              <Input
                type="date"
                value={answers[currentQ.field] || ''}
                onChange={(e) => setAnswer(currentQ.field, e.target.value)}
                className="border-2 focus:border-primary/50"
              />
            )}

            {currentQ.type === 'scale' && (
              <div className="space-y-2">
                <RadioGroup
                  value={(answers[currentQ.field] || 1).toString()}
                  onValueChange={(v) => setAnswer(currentQ.field, parseInt(v))}
                  className="space-y-2"
                >
                  {[1, 2, 3, 4, 5].map((level) => {
                    const scaleEmojis = ['😵', '😟', '🤔', '😊', '🧠'];
                    const isSelected = (answers[currentQ.field] || 1) === level;
                    return (
                      <motion.div key={level} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <div className={cn(
                          "flex items-center space-x-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        )}>
                          <RadioGroupItem value={level.toString()} id={`scale-${level}`} />
                          <Label htmlFor={`scale-${level}`} className="flex-1 cursor-pointer flex items-center gap-3">
                            <span className="text-xl">{scaleEmojis[level - 1]}</span>
                            <Badge 
                              variant={level <= 2 ? "destructive" : level <= 3 ? "secondary" : "default"} 
                              className="text-xs font-bold min-w-[24px] justify-center"
                            >
                              {level}
                            </Badge>
                            <span className="font-medium">{scaleLabels[isEs ? 'es' : 'en'][level - 1]}</span>
                          </Label>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Where to find info - Enhanced */}
            {currentQ.whereToFind && answers[currentQ.field] === false && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Alert className="bg-accent/10 border-accent/30 mt-3 shadow-lg shadow-accent/5">
                  <Lightbulb className="h-4 w-4 text-accent animate-[pulse_2s_ease-in-out_infinite]" />
                  <AlertDescription className="text-sm space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      📍 {isEs ? "Dónde encontrar esta información:" : "Where to find this information:"}
                    </p>
                    <p className="text-muted-foreground">{currentQ.whereToFind[isEs ? 'es' : 'en']}</p>
                    {currentQ.whereToFind.link && (
                      <Button variant="outline" size="sm" className="h-auto py-1.5 px-3 gap-1.5 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-all hover:-translate-y-0.5" asChild>
                        <a href={currentQ.whereToFind.link} target="_blank" rel="noopener">
                          <ExternalLink className="h-3 w-3" />
                          {isEs ? "🌐 Abrir sitio web" : "🌐 Open website"}
                        </a>
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Skip note */}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 opacity-70">
              <span className="animate-[pulse_3s_ease-in-out_infinite]">💬</span>
              {isEs 
                ? "Puedes dejar en blanco si no sabes. La app te ayudará a encontrar la respuesta."
                : "You can leave blank if you don't know. The app will help you find the answer."
              }
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation with enhanced buttons */}
        <div className="flex justify-between pt-3 border-t border-primary/10">
          <Button
            variant="ghost"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="gap-1 hover:bg-muted/50 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            {isEs ? "Anterior" : "Back"}
          </Button>
          
          {currentIdx < questions.length - 1 ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="gap-1 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {isEs ? "Siguiente" : "Next"}
                <ChevronRight className="h-4 w-4" />
                <span className="animate-[pulse_2s_ease-in-out_infinite]">✨</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                onClick={handleSave} 
                disabled={upsert.isPending}
                className="gap-1.5 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary via-accent to-primary hover:shadow-xl transition-all"
              >
                {upsert.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {isEs ? "Guardando..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <PartyPopper className="h-4 w-4" />
                    {isEs ? "🎉 Completar" : "🎉 Complete"}
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
