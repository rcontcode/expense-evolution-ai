import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Sparkles, Check, ArrowRight, ArrowLeft, X,
  FileImage, Mic, Wand2, Edit3, Save, Lightbulb
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuickCaptureTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  icon: React.ElementType;
  title: { es: string; en: string };
  description: { es: string; en: string };
  tip?: { es: string; en: string };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: Camera,
    title: { es: 'Captura tu recibo', en: 'Capture your receipt' },
    description: { 
      es: 'Toma una foto de tu recibo o factura. EvoFinz funciona mejor con fotos claras y bien iluminadas.',
      en: 'Take a photo of your receipt or invoice. EvoFinz works best with clear, well-lit photos.'
    },
    tip: {
      es: 'Asegúrate de que el texto sea legible y toda la información importante sea visible.',
      en: 'Make sure the text is readable and all important information is visible.'
    }
  },
  {
    icon: Sparkles,
    title: { es: 'Procesamiento Inteligente', en: 'Smart Processing' },
    description: {
      es: 'EvoFinz analiza automáticamente tu recibo y extrae: vendedor, monto, fecha, categoría y más.',
      en: 'EvoFinz automatically analyzes your receipt and extracts: vendor, amount, date, category, and more.'
    },
    tip: {
      es: 'También detectamos si el gasto es deducible para CRA y si es típicamente reembolsable.',
      en: 'We also detect if the expense is CRA deductible and typically reimbursable.'
    }
  },
  {
    icon: Edit3,
    title: { es: 'Revisa y edita', en: 'Review and edit' },
    description: {
      es: 'Revisa los datos extraídos y haz correcciones si es necesario. Puedes cambiar categoría, asignar cliente, etc.',
      en: 'Review the extracted data and make corrections if needed. You can change category, assign client, etc.'
    },
    tip: {
      es: 'Si hay algún error, tus correcciones ayudan a mejorar futuras extracciones.',
      en: 'If there is any error, your corrections help improve future extractions.'
    }
  },
  {
    icon: Save,
    title: { es: 'Guarda tu gasto', en: 'Save your expense' },
    description: {
      es: 'Una vez satisfecho, guarda el gasto. La foto queda vinculada al registro para referencia futura.',
      en: 'Once satisfied, save the expense. The photo is linked to the record for future reference.'
    },
    tip: {
      es: 'Si hay múltiples items, EvoFinz los detecta y puedes guardarlos uno por uno.',
      en: 'If there are multiple items, EvoFinz detects them and you can save them one by one.'
    }
  }
];

export function QuickCaptureTutorial({ onComplete, onSkip }: QuickCaptureTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { language } = useLanguage();
  
  const step = TUTORIAL_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {language === 'es' ? 'Tutorial' : 'Tutorial'} ({currentStep + 1}/{TUTORIAL_STEPS.length})
          </Badge>
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            {language === 'es' ? 'Saltar' : 'Skip'}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                idx <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <StepIcon className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold">
            {step.title[language as 'es' | 'en']}
          </h3>
          
          <p className="text-muted-foreground">
            {step.description[language as 'es' | 'en']}
          </p>

          {step.tip && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300 text-left">
                {step.tip[language as 'es' | 'en']}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Anterior' : 'Previous'}
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1">
            {isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {language === 'es' ? '¡Comenzar!' : 'Get started!'}
              </>
            ) : (
              <>
                {language === 'es' ? 'Siguiente' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
