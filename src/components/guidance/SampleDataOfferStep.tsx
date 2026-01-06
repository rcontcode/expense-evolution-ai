import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerateSampleData } from '@/hooks/data/useGenerateSampleData';
import { 
  Database, Sparkles, ArrowRight, Check, Users, Receipt, 
  TrendingUp, FileText, MapPin, Target, Loader2, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SampleDataOfferStepProps {
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

const SAMPLE_DATA_FEATURES = [
  {
    icon: Users,
    title: { es: '2 Clientes', en: '2 Clients' },
    description: { es: 'con proyectos asociados', en: 'with associated projects' }
  },
  {
    icon: Receipt,
    title: { es: '20 Gastos', en: '20 Expenses' },
    description: { es: 'variados y categorizados', en: 'varied and categorized' }
  },
  {
    icon: TrendingUp,
    title: { es: '12 Ingresos', en: '12 Incomes' },
    description: { es: 'de múltiples tipos', en: 'of multiple types' }
  },
  {
    icon: MapPin,
    title: { es: '8 Kilometraje', en: '8 Mileage' },
    description: { es: 'viajes de negocios', en: 'business trips' }
  },
  {
    icon: FileText,
    title: { es: '2 Contratos', en: '2 Contracts' },
    description: { es: 'con términos de reembolso', en: 'with reimbursement terms' }
  },
  {
    icon: Target,
    title: { es: 'Metas y activos', en: 'Goals & assets' },
    description: { es: 'inversión y ahorro', en: 'investment and savings' }
  }
];

const GENERATION_STEPS = [
  { key: 'clients', es: 'Creando clientes...', en: 'Creating clients...' },
  { key: 'projects', es: 'Creando proyectos...', en: 'Creating projects...' },
  { key: 'tags', es: 'Creando etiquetas...', en: 'Creating tags...' },
  { key: 'expenses', es: 'Creando gastos (20)...', en: 'Creating expenses (20)...' },
  { key: 'income', es: 'Creando ingresos (12)...', en: 'Creating income (12)...' },
  { key: 'mileage', es: 'Creando kilometraje...', en: 'Creating mileage...' },
  { key: 'assets', es: 'Creando activos...', en: 'Creating assets...' },
  { key: 'goals', es: 'Creando metas...', en: 'Creating goals...' },
  { key: 'contracts', es: 'Creando contratos...', en: 'Creating contracts...' },
  { key: 'finishing', es: '¡Finalizando!', en: 'Finishing up!' }
];

export function SampleDataOfferStep({ onComplete, onSkip, userName }: SampleDataOfferStepProps) {
  const { language } = useLanguage();
  const generateSampleData = useGenerateSampleData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleGenerateSampleData = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= GENERATION_STEPS.length) {
          clearInterval(progressInterval);
          return prev;
        }
        setGenerationProgress((next / GENERATION_STEPS.length) * 100);
        return next;
      });
    }, 800);

    try {
      await generateSampleData.mutateAsync(undefined);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setCurrentStep(GENERATION_STEPS.length - 1);
      setShowSuccess(true);

      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  if (showSuccess) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-green-600">
            {language === 'es' ? '¡Datos de ejemplo cargados!' : 'Sample data loaded!'}
          </h3>
          <p className="text-muted-foreground mt-2">
            {language === 'es' 
              ? 'Ahora puedes explorar todas las funcionalidades' 
              : 'Now you can explore all features'}
          </p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">
            {language === 'es' ? 'Generando datos de ejemplo...' : 'Generating sample data...'}
          </h3>
        </div>

        <div className="space-y-4">
          <Progress value={generationProgress} className="h-3" />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {GENERATION_STEPS[currentStep]?.[language as 'es' | 'en'] || GENERATION_STEPS[0][language as 'es' | 'en']}
            </span>
            <span className="font-medium">{Math.round(generationProgress)}%</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-4">
            {GENERATION_STEPS.slice(0, -1).map((step, index) => (
              <div
                key={step.key}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/50 text-primary">
          <Sparkles className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Opcional' : 'Optional'}
        </Badge>
        <h3 className="text-xl font-bold mb-2">
          {language === 'es' 
            ? `${userName ? userName + ', ¿' : '¿'}Deseas explorar con datos de ejemplo?` 
            : `${userName ? userName + ', w' : 'W'}ould you like to explore with sample data?`}
        </h3>
        <p className="text-muted-foreground">
          {language === 'es'
            ? 'Carga datos de prueba para ver cómo funciona cada módulo antes de ingresar tus datos reales'
            : 'Load test data to see how each module works before entering your real data'}
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {language === 'es' ? '¿Qué incluye?' : "What's included?"}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Datos realistas marcados con [SAMPLE] para fácil identificación' 
              : 'Realistic data marked with [SAMPLE] for easy identification'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {SAMPLE_DATA_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title.en}
                  className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title[language as 'es' | 'en']}</p>
                    <p className="text-xs text-muted-foreground">{feature.description[language as 'es' | 'en']}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {language === 'es'
            ? 'Puedes eliminar los datos de ejemplo en cualquier momento desde Configuración'
            : 'You can delete sample data anytime from Settings'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleGenerateSampleData}
          className="w-full gap-2"
          size="lg"
        >
          <Database className="h-4 w-4" />
          {language === 'es' ? 'Sí, cargar datos de ejemplo' : 'Yes, load sample data'}
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
        
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground"
        >
          {language === 'es' 
            ? 'No gracias, prefiero empezar vacío' 
            : 'No thanks, I prefer to start empty'}
        </Button>
      </div>
    </div>
  );
}
