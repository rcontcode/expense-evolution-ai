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
      return {
        has_filed_before: existing.has_filed_before,
        has_accountant: existing.has_accountant,
        accountant_info: existing.accountant_info || '',
        switched_from_employee: existing.switched_from_employee,
        employee_end_date: existing.employee_end_date || '',
        employment_transition_notes: existing.employment_transition_notes || '',
        first_business_revenue_date: existing.first_business_revenue_date || '',
        business_start_date_notes: existing.business_start_date_notes || '',
        previous_filings_notes: existing.previous_filings_notes || '',
        knows_fiscal_year_end: existing.knows_fiscal_year_end,
        knows_gst_hst_status: existing.knows_gst_hst_status,
        knows_tax_regime: existing.knows_tax_regime,
        tax_software_used: existing.tax_software_used || '',
        general_tax_knowledge: existing.general_tax_knowledge || 1,
        additional_notes: existing.additional_notes || '',
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
      // Q8: First revenue date
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
      // Q9: Business start notes
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
      // Q10: Knows fiscal year end?
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
