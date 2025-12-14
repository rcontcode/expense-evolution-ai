import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateInvestmentGoal } from '@/hooks/data/useInvestmentGoals';
import { useCreateSavingsGoal } from '@/hooks/data/useSavingsGoals';
import { Target, CheckCircle, Calendar as CalendarIcon, DollarSign, Lightbulb, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SMARTGoalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalType?: 'savings' | 'investment';
}

interface SMARTFormData {
  name: string;
  goalCategory: 'savings' | 'investment';
  goalType: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  relevanceReason: string;
  monthlyTarget: number;
  riskLevel: string;
  assetClass: string;
  color: string;
  // SMART validation
  isSpecific: boolean;
  isMeasurable: boolean;
  isAchievable: boolean | null;
  isRelevant: boolean;
  isTimeBound: boolean;
}

const GOAL_TYPES = [
  { value: 'emergency_fund', labelEs: 'Fondo de emergencia', labelEn: 'Emergency Fund' },
  { value: 'passive_income', labelEs: 'Ingreso pasivo', labelEn: 'Passive Income' },
  { value: 'early_retirement', labelEs: 'Retiro anticipado', labelEn: 'Early Retirement' },
  { value: 'financial_independence', labelEs: 'Independencia financiera', labelEn: 'Financial Independence' },
  { value: 'house', labelEs: 'Casa / Propiedad', labelEn: 'House / Property' },
  { value: 'education', labelEs: 'Educación', labelEn: 'Education' },
  { value: 'travel', labelEs: 'Viajes', labelEn: 'Travel' },
  { value: 'vehicle', labelEs: 'Vehículo', labelEn: 'Vehicle' },
  { value: 'business', labelEs: 'Negocio', labelEn: 'Business' },
  { value: 'other', labelEs: 'Otro', labelEn: 'Other' },
];

const RISK_LEVELS = [
  { value: 'conservative', labelEs: 'Conservador', labelEn: 'Conservative', color: 'text-green-600' },
  { value: 'moderate', labelEs: 'Moderado', labelEn: 'Moderate', color: 'text-yellow-600' },
  { value: 'aggressive', labelEs: 'Agresivo', labelEn: 'Aggressive', color: 'text-red-600' },
];

const ASSET_CLASSES = [
  { value: 'stocks', labelEs: 'Acciones', labelEn: 'Stocks' },
  { value: 'bonds', labelEs: 'Bonos', labelEn: 'Bonds' },
  { value: 'real_estate', labelEs: 'Bienes raíces', labelEn: 'Real Estate' },
  { value: 'crypto', labelEs: 'Criptomonedas', labelEn: 'Crypto' },
  { value: 'etf', labelEs: 'ETFs', labelEn: 'ETFs' },
  { value: 'mixed', labelEs: 'Mixto', labelEn: 'Mixed' },
];

const COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

export function SMARTGoalWizard({ open, onOpenChange, goalType = 'savings' }: SMARTGoalWizardProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState<SMARTFormData>({
    name: '',
    goalCategory: goalType,
    goalType: 'emergency_fund',
    targetAmount: 0,
    currentAmount: 0,
    deadline: null,
    relevanceReason: '',
    monthlyTarget: 0,
    riskLevel: 'moderate',
    assetClass: 'mixed',
    color: '#10B981',
    isSpecific: false,
    isMeasurable: true,
    isAchievable: null,
    isRelevant: false,
    isTimeBound: false,
  });

  const createInvestmentGoal = useCreateInvestmentGoal();
  const createSavingsGoal = useCreateSavingsGoal();

  const updateForm = (updates: Partial<SMARTFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      
      // Auto-calculate SMART criteria
      updated.isSpecific = updated.name.length >= 10 && updated.goalType !== '';
      updated.isMeasurable = updated.targetAmount > 0;
      updated.isTimeBound = updated.deadline !== null;
      updated.isRelevant = updated.relevanceReason.length >= 20;
      
      // Calculate if achievable based on deadline and monthly target
      if (updated.deadline && updated.targetAmount > 0 && updated.currentAmount >= 0) {
        const monthsRemaining = Math.max(1, Math.ceil(
          (updated.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
        ));
        const neededMonthly = (updated.targetAmount - updated.currentAmount) / monthsRemaining;
        updated.monthlyTarget = Math.ceil(neededMonthly);
        updated.isAchievable = neededMonthly <= updated.targetAmount * 0.1; // 10% of target monthly is considered achievable
      }

      return updated;
    });
  };

  const smartScore = [
    formData.isSpecific,
    formData.isMeasurable,
    formData.isAchievable === true,
    formData.isRelevant,
    formData.isTimeBound,
  ].filter(Boolean).length;

  const handleSubmit = async () => {
    if (formData.goalCategory === 'investment') {
      await createInvestmentGoal.mutateAsync({
        name: formData.name,
        target_amount: formData.targetAmount,
        current_amount: formData.currentAmount,
        goal_type: formData.goalType,
        monthly_target: formData.monthlyTarget,
        asset_class: formData.assetClass,
        risk_level: formData.riskLevel,
        deadline: formData.deadline?.toISOString().split('T')[0] || null,
        color: formData.color,
        is_specific: formData.isSpecific,
        is_measurable: formData.isMeasurable,
        is_achievable: formData.isAchievable,
        is_relevant: formData.isRelevant,
        relevance_reason: formData.relevanceReason,
      });
    } else {
      await createSavingsGoal.mutateAsync({
        name: formData.name,
        target_amount: formData.targetAmount,
        current_amount: formData.currentAmount,
        deadline: formData.deadline,
        color: formData.color,
        priority: 1,
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      goalCategory: goalType,
      goalType: 'emergency_fund',
      targetAmount: 0,
      currentAmount: 0,
      deadline: null,
      relevanceReason: '',
      monthlyTarget: 0,
      riskLevel: 'moderate',
      assetClass: 'mixed',
      color: '#10B981',
      isSpecific: false,
      isMeasurable: true,
      isAchievable: null,
      isRelevant: false,
      isTimeBound: false,
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(amount);

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name.length >= 5 && formData.goalType !== '';
      case 2: return formData.targetAmount > 0;
      case 3: return formData.deadline !== null;
      case 4: return formData.relevanceReason.length >= 10;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Crear Meta SMART' : 'Create SMART Goal'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{language === 'es' ? `Paso ${step} de ${totalSteps}` : `Step ${step} of ${totalSteps}`}</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              SMART: {smartScore}/5
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {/* SMART Indicators */}
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'S', label: language === 'es' ? 'Específico' : 'Specific', met: formData.isSpecific },
            { key: 'M', label: language === 'es' ? 'Medible' : 'Measurable', met: formData.isMeasurable },
            { key: 'A', label: language === 'es' ? 'Alcanzable' : 'Achievable', met: formData.isAchievable === true },
            { key: 'R', label: language === 'es' ? 'Relevante' : 'Relevant', met: formData.isRelevant },
            { key: 'T', label: language === 'es' ? 'Tiempo' : 'Time-bound', met: formData.isTimeBound },
          ].map((item) => (
            <Badge
              key={item.key}
              variant={item.met ? 'default' : 'outline'}
              className={cn(
                'text-xs',
                item.met && 'bg-primary'
              )}
            >
              {item.met && <CheckCircle className="h-3 w-3 mr-1" />}
              {item.key}: {item.label}
            </Badge>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[200px]">
          {/* Step 1: Specific - Name & Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="text-primary font-bold">S</span>
                  {language === 'es' ? 'Específico' : 'Specific'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'es'
                    ? 'Define claramente qué quieres lograr'
                    : 'Clearly define what you want to achieve'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Tipo de meta' : 'Goal type'}
                </label>
                <Select value={formData.goalCategory} onValueChange={(v) => updateForm({ goalCategory: v as 'savings' | 'investment' })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">{language === 'es' ? 'Ahorro' : 'Savings'}</SelectItem>
                    <SelectItem value="investment">{language === 'es' ? 'Inversión' : 'Investment'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Categoría' : 'Category'}
                </label>
                <Select value={formData.goalType} onValueChange={(v) => updateForm({ goalType: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {language === 'es' ? type.labelEs : type.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Nombre de la meta (mínimo 10 caracteres)' : 'Goal name (minimum 10 characters)'}
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder={language === 'es' ? 'Ej: Ahorrar $10,000 para fondo de emergencia' : 'Ex: Save $10,000 for emergency fund'}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.name.length}/10 {language === 'es' ? 'caracteres' : 'characters'}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Measurable - Amount */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="text-primary font-bold">M</span>
                  {language === 'es' ? 'Medible' : 'Measurable'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'es'
                    ? 'Establece un monto específico que puedas rastrear'
                    : 'Set a specific amount you can track'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Monto objetivo' : 'Target amount'}
                </label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.targetAmount || ''}
                    onChange={(e) => updateForm({ targetAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="10000"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Monto actual (opcional)' : 'Current amount (optional)'}
                </label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.currentAmount || ''}
                    onChange={(e) => updateForm({ currentAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="pl-9"
                  />
                </div>
              </div>

              {formData.goalCategory === 'investment' && (
                <>
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'es' ? 'Nivel de riesgo' : 'Risk level'}
                    </label>
                    <Select value={formData.riskLevel} onValueChange={(v) => updateForm({ riskLevel: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <span className={level.color}>
                              {language === 'es' ? level.labelEs : level.labelEn}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {language === 'es' ? 'Clase de activo' : 'Asset class'}
                    </label>
                    <Select value={formData.assetClass} onValueChange={(v) => updateForm({ assetClass: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_CLASSES.map((asset) => (
                          <SelectItem key={asset.value} value={asset.value}>
                            {language === 'es' ? asset.labelEs : asset.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Time-bound - Deadline */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="text-primary font-bold">T</span>
                  {language === 'es' ? 'Tiempo Límite' : 'Time-bound'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'es'
                    ? 'Establece una fecha límite para tu meta'
                    : 'Set a deadline for your goal'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Fecha límite' : 'Deadline'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal mt-1',
                        !formData.deadline && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline
                        ? format(formData.deadline, 'PPP', { locale: language === 'es' ? es : enUS })
                        : (language === 'es' ? 'Seleccionar fecha' : 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deadline || undefined}
                      onSelect={(date) => updateForm({ deadline: date || null })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {formData.deadline && formData.targetAmount > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">
                    {language === 'es' ? 'Ahorro mensual necesario' : 'Monthly savings needed'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(formData.monthlyTarget)}/mes
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    formData.isAchievable === true ? 'text-green-600' : formData.isAchievable === false ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {formData.isAchievable === true
                      ? (language === 'es' ? '✓ Meta alcanzable' : '✓ Achievable goal')
                      : formData.isAchievable === false
                      ? (language === 'es' ? '⚠ Meta ambiciosa - considera extender el plazo' : '⚠ Ambitious goal - consider extending deadline')
                      : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Relevant - Why */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="text-primary font-bold">R</span>
                  {language === 'es' ? 'Relevante' : 'Relevant'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'es'
                    ? '¿Por qué es importante esta meta para ti?'
                    : 'Why is this goal important to you?'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Razón de relevancia (mínimo 20 caracteres)' : 'Relevance reason (minimum 20 characters)'}
                </label>
                <Textarea
                  value={formData.relevanceReason}
                  onChange={(e) => updateForm({ relevanceReason: e.target.value })}
                  placeholder={language === 'es'
                    ? 'Ej: Quiero tener seguridad financiera para mi familia y poder cubrir 6 meses de gastos en caso de emergencia'
                    : 'Ex: I want financial security for my family and be able to cover 6 months of expenses in case of emergency'}
                  className="mt-1"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.relevanceReason.length}/20 {language === 'es' ? 'caracteres' : 'characters'}
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {language === 'es'
                    ? 'Brian Tracy: "Las metas son sueños con fecha límite. Una meta sin un \'por qué\' poderoso es solo un deseo."'
                    : 'Brian Tracy: "Goals are dreams with deadlines. A goal without a powerful \'why\' is just a wish."'}
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="text-primary font-bold">A</span>
                  {language === 'es' ? 'Alcanzable - Resumen' : 'Achievable - Summary'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'es'
                    ? 'Revisa tu meta SMART antes de crearla'
                    : 'Review your SMART goal before creating it'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <p className="font-medium">{formData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Objetivo</p>
                    <p className="font-semibold text-primary">{formatCurrency(formData.targetAmount)}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Fecha límite</p>
                    <p className="font-medium">
                      {formData.deadline && format(formData.deadline, 'dd MMM yyyy', { locale: language === 'es' ? es : enUS })}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Ahorro mensual</p>
                  <p className="font-semibold">{formatCurrency(formData.monthlyTarget)}/mes</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Color</p>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateForm({ color })}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/5">
                  <p className="text-sm font-medium">Puntuación SMART: {smartScore}/5</p>
                  <Progress value={(smartScore / 5) * 100} className="h-2 mt-2" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Anterior' : 'Previous'}
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              {language === 'es' ? 'Siguiente' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={smartScore < 3}
            >
              <Target className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Crear Meta SMART' : 'Create SMART Goal'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
