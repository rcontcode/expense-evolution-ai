import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Zap, Star, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialProfile, useUpsertFinancialProfile } from '@/hooks/data/useFinancialProfile';

const PASSION_OPTIONS = [
  'tecnología', 'arte', 'música', 'deportes', 'cocina', 'viajes', 'lectura', 'gaming',
  'fotografía', 'moda', 'fitness', 'naturaleza', 'cine', 'educación', 'salud', 'mascotas'
];

const TALENT_OPTIONS = [
  'programación', 'diseño', 'escritura', 'ventas', 'marketing', 'finanzas', 'enseñar',
  'comunicación', 'liderazgo', 'análisis', 'creatividad', 'organización', 'negociación', 'idiomas'
];

const INTEREST_OPTIONS = [
  'inmobiliario', 'acciones', 'criptomonedas', 'negocios_digitales', 'ecommerce', 
  'inversiones', 'emprendimiento', 'freelance', 'automatización', 'IA'
];

const RISK_TOLERANCES = [
  { value: 'conservative', labelKey: 'conservative' },
  { value: 'moderate', labelKey: 'moderate' },
  { value: 'aggressive', labelKey: 'aggressive' },
];

const TIME_OPTIONS = [
  { value: 'none', labelKey: 'noTime' },
  { value: 'few_hours', labelKey: 'fewHours' },
  { value: 'part_time', labelKey: 'partTime' },
  { value: 'full_time', labelKey: 'fullTime' },
];

const INCOME_TYPES = [
  { value: 'fully_passive', labelKey: 'fullyPassive' },
  { value: 'semi_passive', labelKey: 'semiPassive' },
  { value: 'mixed', labelKey: 'mixed' },
];

const EDUCATION_LEVELS = [
  { value: 'beginner', labelKey: 'beginner' },
  { value: 'intermediate', labelKey: 'intermediate' },
  { value: 'advanced', labelKey: 'advanced' },
];

interface FinancialProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancialProfileDialog({ open, onOpenChange }: FinancialProfileDialogProps) {
  const { t } = useLanguage();
  const { data: profile } = useFinancialProfile();
  const upsertProfile = useUpsertFinancialProfile();

  const [passions, setPassions] = useState<string[]>([]);
  const [talents, setTalents] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [availableCapital, setAvailableCapital] = useState('');
  const [monthlyCapacity, setMonthlyCapacity] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [timeAvailability, setTimeAvailability] = useState('part_time');
  const [preferredIncomeType, setPreferredIncomeType] = useState('mixed');
  const [educationLevel, setEducationLevel] = useState('beginner');

  useEffect(() => {
    if (profile) {
      setPassions(profile.passions || []);
      setTalents(profile.talents || []);
      setInterests(profile.interests || []);
      setAvailableCapital(String(profile.available_capital || ''));
      setMonthlyCapacity(String(profile.monthly_investment_capacity || ''));
      setRiskTolerance(profile.risk_tolerance || 'moderate');
      setTimeAvailability(profile.time_availability || 'part_time');
      setPreferredIncomeType(profile.preferred_income_type || 'mixed');
      setEducationLevel(profile.financial_education_level || 'beginner');
    }
  }, [profile, open]);

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = () => {
    upsertProfile.mutate({
      passions,
      talents,
      interests,
      available_capital: parseFloat(availableCapital) || 0,
      monthly_investment_capacity: parseFloat(monthlyCapacity) || 0,
      risk_tolerance: riskTolerance,
      time_availability: timeAvailability,
      preferred_income_type: preferredIncomeType,
      financial_education_level: educationLevel,
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('investments.financialProfile')}
          </DialogTitle>
          <DialogDescription>
            {t('investments.profileDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Passions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              {t('investments.passions')}
            </Label>
            <p className="text-sm text-muted-foreground">{t('investments.passionsHelp')}</p>
            <div className="flex flex-wrap gap-2">
              {PASSION_OPTIONS.map(item => (
                <Badge
                  key={item}
                  variant={passions.includes(item) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(passions, setPassions, item)}
                >
                  {item}
                  {passions.includes(item) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Talents */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              {t('investments.talents')}
            </Label>
            <p className="text-sm text-muted-foreground">{t('investments.talentsHelp')}</p>
            <div className="flex flex-wrap gap-2">
              {TALENT_OPTIONS.map(item => (
                <Badge
                  key={item}
                  variant={talents.includes(item) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(talents, setTalents, item)}
                >
                  {item}
                  {talents.includes(item) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-500" />
              {t('investments.interests')}
            </Label>
            <p className="text-sm text-muted-foreground">{t('investments.interestsHelp')}</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(item => (
                <Badge
                  key={item}
                  variant={interests.includes(item) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(interests, setInterests, item)}
                >
                  {item}
                  {interests.includes(item) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investments.availableCapital')}</Label>
              <Input
                type="number"
                value={availableCapital}
                onChange={(e) => setAvailableCapital(e.target.value)}
                placeholder="$0"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('investments.monthlyCapacity')}</Label>
              <Input
                type="number"
                value={monthlyCapacity}
                onChange={(e) => setMonthlyCapacity(e.target.value)}
                placeholder="$0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investments.riskTolerance')}</Label>
              <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_TOLERANCES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {t(`investments.${r.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('investments.timeAvailability')}</Label>
              <Select value={timeAvailability} onValueChange={setTimeAvailability}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.labelKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investments.preferredIncomeType')}</Label>
              <Select value={preferredIncomeType} onValueChange={setPreferredIncomeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map(i => (
                    <SelectItem key={i.value} value={i.value}>
                      {t(`investments.${i.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('investments.educationLevel')}</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      {t(`investments.${e.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={upsertProfile.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
