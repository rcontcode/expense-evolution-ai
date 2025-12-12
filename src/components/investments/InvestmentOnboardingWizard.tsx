import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateAsset, ASSET_CATEGORIES } from '@/hooks/data/useNetWorth';
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Bitcoin, 
  Building2, 
  PiggyBank,
  Wallet,
  BarChart3,
  Gem,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Info,
  Shield,
  Target,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

interface InvestmentOnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
type InvestmentType = 'stocks' | 'crypto' | 'bonds' | 'real_estate' | 'etf' | 'mutual_funds' | 'retirement' | 'commodities';

interface WizardState {
  experienceLevel: ExperienceLevel | null;
  riskTolerance: RiskTolerance | null;
  investmentTypes: InvestmentType[];
  goals: string[];
  firstAsset: {
    name: string;
    category: string;
    currentValue: string;
    purchaseValue: string;
  } | null;
}

const INVESTMENT_TYPES = [
  { id: 'stocks', label: 'Acciones', labelEn: 'Stocks', icon: TrendingUp, description: 'Acciones de empresas en bolsa' },
  { id: 'crypto', label: 'Criptomonedas', labelEn: 'Cryptocurrencies', icon: Bitcoin, description: 'Bitcoin, Ethereum, altcoins' },
  { id: 'etf', label: 'ETFs', labelEn: 'ETFs', icon: BarChart3, description: 'Fondos cotizados en bolsa' },
  { id: 'mutual_funds', label: 'Fondos Mutuos', labelEn: 'Mutual Funds', icon: PiggyBank, description: 'Fondos de inversión tradicionales' },
  { id: 'bonds', label: 'Bonos', labelEn: 'Bonds', icon: Shield, description: 'Bonos gubernamentales o corporativos' },
  { id: 'real_estate', label: 'Bienes Raíces', labelEn: 'Real Estate', icon: Building2, description: 'Propiedades de inversión' },
  { id: 'retirement', label: 'Cuentas de Retiro', labelEn: 'Retirement Accounts', icon: Target, description: 'RRSP, TFSA, 401k' },
  { id: 'commodities', label: 'Commodities', labelEn: 'Commodities', icon: Gem, description: 'Oro, plata, materias primas' },
];

const INVESTMENT_GOALS = [
  { id: 'retirement', label: 'Retiro anticipado (FIRE)', labelEn: 'Early retirement (FIRE)' },
  { id: 'passive_income', label: 'Ingresos pasivos', labelEn: 'Passive income' },
  { id: 'wealth_growth', label: 'Crecimiento de patrimonio', labelEn: 'Wealth growth' },
  { id: 'emergency_fund', label: 'Fondo de emergencia', labelEn: 'Emergency fund' },
  { id: 'education', label: 'Educación (propia o hijos)', labelEn: 'Education (self or children)' },
  { id: 'home_purchase', label: 'Comprar casa', labelEn: 'Home purchase' },
  { id: 'financial_freedom', label: 'Libertad financiera', labelEn: 'Financial freedom' },
];

export function InvestmentOnboardingWizard({ onComplete, onSkip }: InvestmentOnboardingWizardProps) {
  const { language } = useLanguage();
  const createAsset = useCreateAsset();
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    experienceLevel: null,
    riskTolerance: null,
    investmentTypes: [],
    goals: [],
    firstAsset: null,
  });

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Save first asset if provided
    if (state.firstAsset && state.firstAsset.name && state.firstAsset.currentValue) {
      try {
        await createAsset.mutateAsync({
          name: state.firstAsset.name,
          category: state.firstAsset.category || 'investments',
          current_value: parseFloat(state.firstAsset.currentValue) || 0,
          purchase_value: state.firstAsset.purchaseValue ? parseFloat(state.firstAsset.purchaseValue) : null,
          is_liquid: true,
        });
        toast.success(language === 'es' ? '¡Primer activo agregado!' : 'First asset added!');
      } catch (error) {
        console.error('Error adding asset:', error);
      }
    }
    onComplete();
  };

  const toggleInvestmentType = (type: InvestmentType) => {
    setState(prev => ({
      ...prev,
      investmentTypes: prev.investmentTypes.includes(type)
        ? prev.investmentTypes.filter(t => t !== type)
        : [...prev.investmentTypes, type]
    }));
  };

  const toggleGoal = (goal: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome step
      case 1: return state.experienceLevel !== null;
      case 2: return state.investmentTypes.length > 0;
      case 3: return state.goals.length > 0;
      case 4: return true; // Add asset step is optional
      default: return true;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-lg">
      <CardHeader className="space-y-4">
        {/* Disclaimer Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">
              {language === 'es' ? 'Aviso Importante' : 'Important Notice'}
            </p>
            <p className="text-amber-600/80 mt-1">
              {language === 'es' 
                ? 'Esta herramienta es solo para seguimiento personal. NO es consejo de inversión. Consulta a un asesor financiero certificado antes de tomar decisiones de inversión.'
                : 'This tool is for personal tracking only. This is NOT investment advice. Consult a certified financial advisor before making investment decisions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>
              {language === 'es' ? 'Configurar Seguimiento de Inversiones' : 'Setup Investment Tracking'}
            </CardTitle>
          </div>
          <Badge variant="outline">
            {currentStep + 1} / {totalSteps}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 0: Welcome */}
        {currentStep === 0 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'es' ? '¡Bienvenido al Seguimiento de Inversiones!' : 'Welcome to Investment Tracking!'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'es' 
                  ? 'Te haré algunas preguntas para personalizar tu experiencia y ayudarte a dar seguimiento a tus inversiones de manera efectiva.'
                  : "I'll ask you a few questions to personalize your experience and help you track your investments effectively."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <GraduationCap className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{language === 'es' ? 'Aprende' : 'Learn'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{language === 'es' ? 'Rastrea' : 'Track'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{language === 'es' ? 'Crece' : 'Grow'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Experience Level */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {language === 'es' ? '¿Cuál es tu experiencia con inversiones?' : "What's your investment experience?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'es' 
                  ? 'Esto nos ayuda a personalizar la información que te mostramos'
                  : 'This helps us personalize the information we show you'}
              </p>
            </div>
            <RadioGroup 
              value={state.experienceLevel || ''} 
              onValueChange={(value) => setState(prev => ({ ...prev, experienceLevel: value as ExperienceLevel }))}
              className="space-y-3"
            >
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${state.experienceLevel === 'beginner' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                  <div className="font-medium">{language === 'es' ? 'Principiante' : 'Beginner'}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'es' ? 'Nuevo en inversiones, quiero aprender' : 'New to investing, want to learn'}
                  </div>
                </Label>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${state.experienceLevel === 'intermediate' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                  <div className="font-medium">{language === 'es' ? 'Intermedio' : 'Intermediate'}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'es' ? 'Tengo algunas inversiones y conocimiento básico' : 'Have some investments and basic knowledge'}
                  </div>
                </Label>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${state.experienceLevel === 'advanced' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                  <div className="font-medium">{language === 'es' ? 'Avanzado' : 'Advanced'}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'es' ? 'Experiencia sólida, manejo mi portafolio activamente' : 'Solid experience, actively manage my portfolio'}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Investment Types */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {language === 'es' ? '¿Qué tipos de inversiones tienes o te interesan?' : 'What types of investments do you have or are interested in?'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'es' ? 'Selecciona todos los que apliquen' : 'Select all that apply'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INVESTMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = state.investmentTypes.includes(type.id as InvestmentType);
                return (
                  <div
                    key={type.id}
                    onClick={() => toggleInvestmentType(type.id as InvestmentType)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {language === 'es' ? type.label : type.labelEn}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {language === 'es' ? '¿Cuáles son tus objetivos financieros?' : 'What are your financial goals?'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'es' ? 'Selecciona los que más te motivan' : 'Select the ones that motivate you most'}
              </p>
            </div>
            <div className="space-y-2">
              {INVESTMENT_GOALS.map((goal) => {
                const isSelected = state.goals.includes(goal.id);
                return (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox checked={isSelected} />
                    <span className="flex-1">
                      {language === 'es' ? goal.label : goal.labelEn}
                    </span>
                    {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Add First Asset */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {language === 'es' ? '¿Quieres agregar tu primer activo?' : 'Want to add your first asset?'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'es' ? 'Opcional - puedes agregarlo después también' : 'Optional - you can add it later too'}
              </p>
            </div>
            
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{language === 'es' ? 'Nombre del activo' : 'Asset name'}</Label>
                  <Input
                    placeholder={language === 'es' ? 'Ej: Bitcoin, Acciones Apple, ETF VOO' : 'E.g: Bitcoin, Apple Stock, VOO ETF'}
                    value={state.firstAsset?.name || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      firstAsset: { ...prev.firstAsset!, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Valor actual ($CAD)' : 'Current value ($CAD)'}</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={state.firstAsset?.currentValue || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      firstAsset: { ...prev.firstAsset!, currentValue: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>{language === 'es' ? 'Valor de compra ($CAD)' : 'Purchase value ($CAD)'}</Label>
                  <Input
                    type="number"
                    placeholder={language === 'es' ? 'Opcional' : 'Optional'}
                    value={state.firstAsset?.purchaseValue || ''}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      firstAsset: { ...prev.firstAsset!, purchaseValue: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  {language === 'es' 
                    ? 'Al ingresar el valor de compra, podremos calcular automáticamente tu rendimiento (ganancia/pérdida).'
                    : 'By entering the purchase value, we can automatically calculate your return (gain/loss).'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {language === 'es' ? 'Tu perfil de inversión' : 'Your investment profile'}
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">{language === 'es' ? 'Nivel: ' : 'Level: '}</span>
                  <span className="font-medium capitalize">{state.experienceLevel}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{language === 'es' ? 'Intereses: ' : 'Interests: '}</span>
                  <span className="font-medium">{state.investmentTypes.length} {language === 'es' ? 'tipos' : 'types'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{language === 'es' ? 'Objetivos: ' : 'Goals: '}</span>
                  <span className="font-medium">{state.goals.length} {language === 'es' ? 'seleccionados' : 'selected'}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {currentStep === 0 ? (
              <Button variant="ghost" onClick={onSkip}>
                {language === 'es' ? 'Omitir' : 'Skip'}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {language === 'es' ? 'Atrás' : 'Back'}
              </Button>
            )}
          </div>
          <div>
            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                {language === 'es' ? 'Siguiente' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-gradient-to-r from-primary to-purple-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Completar' : 'Complete'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
